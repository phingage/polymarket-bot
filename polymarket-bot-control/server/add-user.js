#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const MONGO_DB = process.env.MONGO_DB || 'polymarket';
const USERS_COLLECTION = process.env.USERS_COLLECTION || 'users';

async function addUser(username, password) {
    try {
        // Connessione a MongoDB
        const client = await MongoClient.connect(MONGO_URI);
        const db = client.db(MONGO_DB);
        const usersCollection = db.collection(USERS_COLLECTION);

        // Verifica se l'utente esiste già
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            console.error(`❌ Errore: L'utente '${username}' esiste già`);
            await client.close();
            return;
        }

        // Hash della password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Inserimento utente
        const result = await usersCollection.insertOne({
            username,
            password: hashedPassword,
            createdAt: new Date(),
            active: true
        });

        console.log(`✅ Utente '${username}' aggiunto con successo!`);
        console.log(`   ID: ${result.insertedId}`);
        
        await client.close();
    } catch (error) {
        console.error('❌ Errore durante l\'aggiunta dell\'utente:', error.message);
    }
}

async function listUsers() {
    try {
        const client = await MongoClient.connect(MONGO_URI);
        const db = client.db(MONGO_DB);
        const usersCollection = db.collection(USERS_COLLECTION);

        const users = await usersCollection.find({}, { 
            projection: { username: 1, createdAt: 1, active: 1 } 
        }).toArray();

        console.log('\n📋 Utenti registrati:');
        console.log('─'.repeat(50));
        
        if (users.length === 0) {
            console.log('   Nessun utente trovato');
        } else {
            users.forEach(user => {
                const status = user.active ? '🟢' : '🔴';
                const date = user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A';
                console.log(`   ${status} ${user.username} (creato: ${date})`);
            });
        }
        
        await client.close();
    } catch (error) {
        console.error('❌ Errore durante il recupero degli utenti:', error.message);
    }
}

// Gestione argomenti da linea di comando
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🔐 Script per gestione utenti Polymarket Bot

Utilizzo:
  node add-user.js <username> <password>  - Aggiunge un nuovo utente
  node add-user.js --list                 - Mostra tutti gli utenti
  node add-user.js --help                 - Mostra questo messaggio

Esempi:
  node add-user.js admin password123
  node add-user.js --list
`);
    process.exit(0);
}

if (args[0] === '--list' || args[0] === '-l') {
    listUsers();
} else if (args.length === 2) {
    const [username, password] = args;
    
    if (!username || !password) {
        console.error('❌ Errore: Username e password sono richiesti');
        process.exit(1);
    }
    
    if (password.length < 6) {
        console.error('❌ Errore: La password deve essere di almeno 6 caratteri');
        process.exit(1);
    }
    
    addUser(username, password);
} else {
    console.error('❌ Errore: Numero di argomenti non valido. Usa --help per vedere l\'utilizzo');
    process.exit(1);
}
