import express from 'express';
import cors from 'cors';
import { MongoClient, Db } from 'mongodb';
import session from 'express-session';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import marketsRoutes from './routes/markets';

// Import controllers
import marketsController from './controllers/marketsController';
import authController from './controllers/authController';

// Import types
import { ServerConfig } from './types';

dotenv.config();

const app = express();

// Environment configuration with type safety
const config: ServerConfig = {
  PORT: parseInt(process.env.SERVER_PORT || '3002'),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/',
  MONGO_DB: process.env.MONGO_DB || 'polymarket',
  MONGO_COLLECTION: process.env.MONGO_COLLECTION || 'markets',
  USERS_COLLECTION: process.env.USERS_COLLECTION || 'users',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  SESSION_SECRET: process.env.SESSION_SECRET || 'session-secret-key',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Middleware
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: config.NODE_ENV === 'production', 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

let db: Db;

// MongoDB connection
async function connectToDatabase(): Promise<void> {
  try {
    const client = await MongoClient.connect(config.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    db = client.db(config.MONGO_DB);
    
    // Set database reference for controllers
    marketsController.setDatabase(db);
    authController.setDatabase(db);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/markets', marketsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: db ? 'Connected' : 'Disconnected',
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

// Start server
async function startServer(): Promise<void> {
  try {
    await connectToDatabase();
    
    app.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`📊 Health check: http://localhost:${config.PORT}/health`);
      console.log(`📈 API Markets: http://localhost:${config.PORT}/api/markets`);
      console.log(`🔐 API Auth: http://localhost:${config.PORT}/api/auth`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});