const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

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
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || 'markets';
const USERS_COLLECTION = process.env.USERS_COLLECTION || 'users';

let db;

// Connessione a MongoDB
MongoClient.connect(MONGO_URI)
    .then(client => {
        console.log('Connesso a MongoDB');
        db = client.db(MONGO_DB);
    })
    .catch(error => {
        console.error('Errore connessione MongoDB:', error);
        process.exit(1);
    });

// Middleware per verificare l'autenticazione
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token di accesso richiesto' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token non valido' });
        }
        req.user = user;
        next();
    });
};

// Endpoint per il login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password richiesti' });
        }

        const usersCollection = db.collection(USERS_COLLECTION);
        const user = await usersCollection.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Credenziali non valide' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenziali non valide' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login effettuato con successo',
            token,
            user: { id: user._id, username: user.username }
        });
    } catch (error) {
        console.error('Errore durante il login:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Endpoint per verificare lo stato di autenticazione
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Endpoint per il logout
app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logout effettuato con successo' });
});

// Endpoint per recuperare tutti i mercati (protetto)
app.get('/api/markets', authenticateToken, async (req, res) => {
    try {
        const collection = db.collection(MONGO_COLLECTION);
        
        // Filtra solo i mercati che hanno elementi nell'array clobRewards
        const markets = await collection.find({
            clobRewards: { $exists: true, $ne: [] }
        }).toArray();
        
        console.log(`Recuperati ${markets.length} mercati con clobRewards da MongoDB`);
        
        // Trasforma i dati per l'interfaccia
        const formattedMarkets = markets.map(market => ({
            id: market.id || market._id.toString(),
            question: market.question || 'N/A',
            reward: market.clobRewards && market.clobRewards[0] ? 
                (market.clobRewards[0].rewardsDailyRate || '0') : '0',
            minSize: market.rewardsMinSize || '0',
            maxSpread: market.rewardsMaxSpread || '0',
            spread: market.spread || '0',
            endDate: market.endDate || new Date().toISOString(),
            volume: market.volume || '0',
            liquidity: market.liquidity || '0',
            active: market.active || false,
            closed: market.closed || false,
            archived: market.archived || false,
            slug: market.slug || '',
            description: market.description || '',
            outcomes: market.outcomes || [],
            outcomePrices: market.outcomePrices || []
        }));
        
        res.json(formattedMarkets);
    } catch (error) {
        console.error('Errore nel recupero mercati:', error);
        res.status(500).json({ 
            error: 'Errore interno del server', 
            message: error.message 
        });
    }
});

// Endpoint per le statistiche (protetto)
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const collection = db.collection(MONGO_COLLECTION);
        
        const totalMarkets = await collection.countDocuments({});
        const activeMarkets = await collection.countDocuments({ active: true });
        const closedMarkets = await collection.countDocuments({ closed: true });
        const archivedMarkets = await collection.countDocuments({ archived: true });
        
        res.json({
            total: totalMarkets,
            active: activeMarkets,
            closed: closedMarkets,
            archived: archivedMarkets
        });
    } catch (error) {
        console.error('Errore nel recupero statistiche:', error);
        res.status(500).json({ 
            error: 'Errore interno del server', 
            message: error.message 
        });
    }
});

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
