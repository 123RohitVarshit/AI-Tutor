import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client = None
_collection = None


def get_collection():
    global _client, _collection
    if _collection is None:
        _client = MongoClient(os.getenv("MONGODB_URI"))
        db = _client["ai_tutor"]
        _collection = db["placement_docs"]
        print("✅ Connected to MongoDB Atlas")
    return _collection
