const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const MONGO_DB = process.env.MONGO_DB || 'polymarket';
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || 'markets';

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

// Endpoint per recuperare tutti i mercati
app.get('/api/markets', async (req, res) => {
    try {
        const collection = db.collection(MONGO_COLLECTION);
        const markets = await collection.find({}).toArray();
        
        console.log(`Recuperati ${markets.length} mercati da MongoDB`);
        
        // Trasforma i dati per l'interfaccia
        const formattedMarkets = markets.map(market => ({
            id: market.id || market._id.toString(),
            question: market.question || 'N/A',
            category: market.category || 'Unknown',
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

// Endpoint per le statistiche
app.get('/api/stats', async (req, res) => {
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
