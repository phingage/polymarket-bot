const { MongoClient } = require('mongodb');

// Test di integrazione per verificare la connettività con MongoDB reale
describe('Integration Tests', () => {
    let mongoClient;
    
    beforeAll(async () => {
        // Usa le variabili d'ambiente reali o fallback
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/';
        try {
            mongoClient = new MongoClient(mongoUri);
            await mongoClient.connect();
        } catch (error) {
            console.warn('MongoDB non disponibile per i test di integrazione:', error.message);
        }
    });

    afterAll(async () => {
        if (mongoClient) {
            await mongoClient.close();
        }
    });

    test('dovrebbe connettersi a MongoDB', async () => {
        if (!mongoClient) {
            console.log('Skipping integration test - MongoDB not available');
            return;
        }

        const admin = mongoClient.db().admin();
        const result = await admin.ping();
        expect(result.ok).toBe(1);
    });

    test('dovrebbe poter inserire e recuperare documenti', async () => {
        if (!mongoClient) {
            console.log('Skipping integration test - MongoDB not available');
            return;
        }

        const db = mongoClient.db('test_integration');
        const collection = db.collection('test_markets');
        
        // Pulisce la collezione
        await collection.deleteMany({});
        
        // Inserisce un documento di test
        const testDoc = {
            id: 'integration-test',
            question: 'Integration Test Market',
            active: true
        };
        
        await collection.insertOne(testDoc);
        
        // Recupera il documento
        const retrieved = await collection.findOne({ id: 'integration-test' });
        
        expect(retrieved).toBeTruthy();
        expect(retrieved.question).toBe('Integration Test Market');
        
        // Pulisce dopo il test
        await collection.deleteMany({});
    });
});
