const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const session = require('express-session');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth');
const marketsRoutes = require('./src/routes/markets');

// Import controllers
const marketsController = require('./src/controllers/marketsController');
const authController = require('./src/controllers/authController');

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 ore
}));

// Configurazione MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const MONGO_DB = process.env.MONGO_DB || 'polymarket';

let db;

// Connessione a MongoDB
MongoClient.connect(MONGO_URI)
    .then(client => {
        console.log('Connesso a MongoDB');
        db = client.db(MONGO_DB);
        
        // Set database reference for controllers
        marketsController.setDatabase(db);
        authController.setDatabase(db);
    })
    .catch(error => {
        console.error('Errore connessione MongoDB:', error);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/markets', marketsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: db ? 'Connected' : 'Disconnected'
    });
});

app.listen(PORT, () => {
    console.log(`Server in esecuzione su porta ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API Markets: http://localhost:${PORT}/api/markets`);
});
