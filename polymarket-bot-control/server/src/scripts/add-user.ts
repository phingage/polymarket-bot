#!/usr/bin/env ts-node

import { MongoClient } from 'mongodb';
import * as bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const MONGO_DB = process.env.MONGO_DB || 'polymarket';
const USERS_COLLECTION = process.env.USERS_COLLECTION || 'users';

interface UserDocument {
  username: string;
  password: string;
  createdAt: Date;
  active: boolean;
}

async function addUser(username: string, password: string): Promise<void> {
  let client: MongoClient | null = null;
  
  try {
    // Connessione a MongoDB
    client = await MongoClient.connect(MONGO_URI);
    const db = client.db(MONGO_DB);
    const usersCollection = db.collection<UserDocument>(USERS_COLLECTION);

    // Verifica se l'utente esiste già
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      console.error(`❌ Errore: L'utente '${username}' esiste già`);
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
  } catch (error: any) {
    console.error('❌ Errore durante l\'aggiunta dell\'utente:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function listUsers(): Promise<void> {
  let client: MongoClient | null = null;
  
  try {
    client = await MongoClient.connect(MONGO_URI);
    const db = client.db(MONGO_DB);
    const usersCollection = db.collection<UserDocument>(USERS_COLLECTION);

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
  } catch (error: any) {
    console.error('❌ Errore durante il recupero degli utenti:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Gestione argomenti da linea di comando
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
🔐 Script per gestione utenti Polymarket Bot

Utilizzo:
  npm run add-user <username> <password>  - Aggiunge un nuovo utente
  npm run add-user -- --list              - Mostra tutti gli utenti
  npm run add-user -- --help              - Mostra questo messaggio

Esempi:
  npm run add-user admin password123
  npm run add-user -- --list
`);
  process.exit(0);
}

if (args[0] === '--list' || args[0] === '-l') {
  listUsers().catch(console.error);
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
  
  addUser(username, password).catch(console.error);
} else {
  console.error('❌ Errore: Numero di argomenti non valido. Usa --help per vedere l\'utilizzo');
  process.exit(1);
}