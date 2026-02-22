import os
import time
from pathlib import Path
from pymongo import MongoClient
from voyageai import Client as VoyageClient
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(__file__).parent.parent / "data"
voyage_client = VoyageClient(api_key=os.getenv("VOYAGE_API_KEY"))


def chunk_text(text: str, chunk_size: int = 2400, overlap: int = 200) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if len(chunk) > 100:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def topic_from_filename(filename: str) -> str:
    return filename.replace(".md", "").replace("-", " ").replace("_", " ").title()


def ingest_data():
    print("🚀 Starting data ingestion...")

    client = MongoClient(os.getenv("MONGODB_URI"))
    db = client["ai_tutor"]
    collection = db["placement_docs"]

    # Clear existing data
    collection.delete_many({})
    print("🗑️  Cleared existing placement_docs collection")

    md_files = list(DATA_DIR.glob("*.md"))
    print(f"📂 Found {len(md_files)} markdown files")

    total = 0
    for md_file in md_files:
        topic = topic_from_filename(md_file.name)
        text = md_file.read_text(encoding="utf-8")
        chunks = chunk_text(text)
        print(f"\n📄 Processing '{topic}' → {len(chunks)} chunks")

        for i, chunk in enumerate(chunks):
            try:
                embed_response = voyage_client.embed(
                    texts=[chunk],
                    model="voyage-3-lite",
                )
                embedding = embed_response.embeddings[0]

                collection.insert_one({
                    "topic": topic,
                    "subtopic": f"{topic} - Part {i + 1}",
                    "content": chunk,
                    "embedding": embedding,
                })
                total += 1
                print(f"  ✅ Chunk {i + 1}/{len(chunks)} stored")
                
                # Voyage AI free tier without CC has a 3 RPM (Requests Per Minute) limit.
                # We must sleep for at least 20 seconds between requests.
                if total < sum(len(chunk_text(Path(f).read_text(encoding="utf-8"))) for f in md_files):
                    print("  ⏳ Sleeping 21s to respect Voyage AI free tier 3 RPM limit...")
                    time.sleep(21)

            except Exception as e:
                print(f"  ❌ Error on chunk {i + 1}: {e}")

    print(f"\n✅ Done! {total} chunks stored in MongoDB Atlas")
    print("\n📌 Now create a Vector Search Index in MongoDB Atlas UI:")
    print("  Collection: ai_tutor.placement_docs")
    print("  Index name: vector_index")
    print("""  Config:
{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 512,
    "similarity": "cosine"
  }]
}""")
    client.close()


if __name__ == "__main__":
    ingest_data()
