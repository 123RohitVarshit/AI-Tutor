import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import VoyageAI from "voyageai";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");

const voyage = new VoyageAI({ apiKey: process.env.VOYAGE_API_KEY });

// Chunk text into segments of ~600 tokens (~2400 chars)
function chunkText(text, chunkSize = 2400, overlap = 200) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end).trim());
        start += chunkSize - overlap;
    }
    return chunks.filter((c) => c.length > 100);
}

// Extract topic from filename
function topicFromFilename(filename) {
    return filename
        .replace(/\.md$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Sleep helper to avoid rate limits
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ingestData() {
    console.log("🚀 Starting data ingestion...");

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("ai_tutor");
    const collection = db.collection("placement_docs");

    // Clear existing data
    await collection.deleteMany({});
    console.log("🗑️  Cleared existing placement_docs collection");

    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".md"));
    console.log(`📂 Found ${files.length} markdown files`);

    let totalChunks = 0;

    for (const file of files) {
        const topic = topicFromFilename(file);
        const text = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
        const chunks = chunkText(text);

        console.log(`\n📄 Processing "${topic}" → ${chunks.length} chunks`);

        for (let i = 0; i < chunks.length; i++) {
            try {
                // Generate embedding for this chunk
                const embeddingResponse = await voyage.embed({
                    input: chunks[i],
                    model: "voyage-3-lite",
                });
                const embedding = embeddingResponse.data[0].embedding;

                // Store in MongoDB
                await collection.insertOne({
                    topic,
                    subtopic: `${topic} - Part ${i + 1}`,
                    content: chunks[i],
                    embedding,
                    createdAt: new Date(),
                });

                totalChunks++;
                console.log(`  ✅ Chunk ${i + 1}/${chunks.length} embedded and stored`);

                // Rate limit: 100ms between requests
                await sleep(100);
            } catch (error) {
                console.error(`  ❌ Error on chunk ${i + 1}:`, error.message);
            }
        }
    }

    console.log(`\n✅ Ingestion complete! Stored ${totalChunks} chunks in MongoDB Atlas`);
    console.log("\n📌 Next step: Create a Vector Search Index in MongoDB Atlas:");
    console.log("  1. Go to your Atlas cluster → Search → Create Search Index");
    console.log('  2. Choose "Atlas Vector Search" → JSON editor');
    console.log("  3. Collection: ai_tutor.placement_docs");
    console.log(`  4. Paste this config:
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 512,
      "similarity": "cosine"
    }
  ]
}
  5. Name it: vector_index`);

    await client.close();
}

ingestData().catch(console.error);
