const request = require('supertest');
const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock del server per i test
let app;
let mongoServer;
let mongoClient;

beforeAll(async () => {
    // Avvia MongoDB in memoria per i test
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Configura le variabili d'ambiente per i test
    process.env.MONGO_URI = mongoUri;
    process.env.MONGO_DB = 'test_polymarket';
    process.env.MONGO_COLLECTION = 'test_markets';
    process.env.PORT = '3002'; // Porta diversa per i test
    
    // Importa il server dopo aver impostato le variabili d'ambiente
    app = require('../server');
    
    // Connessione diretta per inserire dati di test
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
});

afterAll(async () => {
    // Chiude le connessioni e ferma il server di test
    if (mongoClient) {
        await mongoClient.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
    if (app && app.close) {
        app.close();
    }
});

beforeEach(async () => {
    // Pulisce il database prima di ogni test
    const db = mongoClient.db('test_polymarket');
    await db.collection('test_markets').deleteMany({});
});

describe('API Endpoints', () => {
    describe('GET /health', () => {
        test('dovrebbe restituire status OK', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            expect(response.body.status).toBe('OK');
            expect(response.body.timestamp).toBeDefined();
            expect(response.body.database).toBe('Connected');
        });
    });

    describe('GET /api/markets', () => {
        test('dovrebbe restituire un array vuoto quando non ci sono mercati', async () => {
            const response = await request(app)
                .get('/api/markets')
                .expect(200);
            
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        test('dovrebbe restituire i mercati quando sono presenti nel database', async () => {
            // Inserisce dati di test
            const testMarkets = [
                {
                    id: '1',
                    question: 'Test Question 1',
                    category: 'Test Category',
                    endDate: '2025-12-31T00:00:00Z',
                    volume: '1000',
                    liquidity: '500',
                    active: true,
                    closed: false,
                    archived: false,
                    slug: 'test-question-1'
                },
                {
                    id: '2',
                    question: 'Test Question 2',
                    category: 'Another Category',
                    endDate: '2026-01-01T00:00:00Z',
                    volume: '2000',
                    liquidity: '1000',
                    active: false,
                    closed: true,
                    archived: false,
                    slug: 'test-question-2'
                }
            ];

            const db = mongoClient.db('test_polymarket');
            await db.collection('test_markets').insertMany(testMarkets);

            const response = await request(app)
                .get('/api/markets')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            expect(response.body[0].question).toBe('Test Question 1');
            expect(response.body[1].question).toBe('Test Question 2');
        });

        test('dovrebbe gestire mercati con dati mancanti', async () => {
            // Inserisce un mercato con dati parziali
            const incompleteMarket = {
                id: '3',
                question: 'Incomplete Market'
                // Altri campi mancanti
            };

            const db = mongoClient.db('test_polymarket');
            await db.collection('test_markets').insertOne(incompleteMarket);

            const response = await request(app)
                .get('/api/markets')
                .expect(200);

            expect(response.body.length).toBe(1);
            expect(response.body[0].question).toBe('Incomplete Market');
            expect(response.body[0].category).toBe('Unknown');
            expect(response.body[0].volume).toBe('0');
            expect(response.body[0].liquidity).toBe('0');
        });
    });

    describe('GET /api/stats', () => {
        test('dovrebbe restituire statistiche corrette quando non ci sono mercati', async () => {
            const response = await request(app)
                .get('/api/stats')
                .expect(200);

            expect(response.body).toEqual({
                total: 0,
                active: 0,
                closed: 0,
                archived: 0
            });
        });

        test('dovrebbe calcolare correttamente le statistiche', async () => {
            // Inserisce mercati con stati diversi
            const testMarkets = [
                { id: '1', active: true, closed: false, archived: false },
                { id: '2', active: true, closed: false, archived: false },
                { id: '3', active: false, closed: true, archived: false },
                { id: '4', active: false, closed: false, archived: true }
            ];

            const db = mongoClient.db('test_polymarket');
            await db.collection('test_markets').insertMany(testMarkets);

            const response = await request(app)
                .get('/api/stats')
                .expect(200);

            expect(response.body).toEqual({
                total: 4,
                active: 2,
                closed: 1,
                archived: 1
            });
        });
    });

    describe('Error Handling', () => {
        test('dovrebbe gestire endpoint non esistenti', async () => {
            await request(app)
                .get('/api/nonexistent')
                .expect(404);
        });
    });
});
