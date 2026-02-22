import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;
let client;

export async function connectDB() {
    try {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        db = client.db("ai_tutor");
        console.log("✅ Connected to MongoDB Atlas");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
}

export function getDB() {
    if (!db) throw new Error("Database not initialized. Call connectDB() first.");
    return db;
}
