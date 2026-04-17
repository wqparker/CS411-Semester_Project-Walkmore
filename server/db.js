import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI);
let db;

export async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db('walkmore');
  }
  return db;
}