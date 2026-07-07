import os
import sys
import glob
import logging
from typing import List

# Ensure we can import from the parent 'services' directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.chunker import chunk_document
from services.embedder import get_embedding
from services.qdrant_client import get_qdrant_client
from qdrant_client.models import Distance, VectorParams, PointStruct

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag_ingestion")

COLLECTION_NAME = "skillssphere_docs"
EMBEDDING_DIM = 384  # BAAI/bge-small-en-v1.5 dimension
KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge")


def ingest_knowledge_base():
    """
    Reads markdown files from knowledge base, chunks them, generates embeddings,
    and stores them in Qdrant.
    """
    client, is_mock = get_qdrant_client()
    
    if is_mock:
        logger.warning("Qdrant client is running in MOCK mode. Data will only be stored in memory.")
    else:
        # Ensure collection exists
        collections = client.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
        if not exists:
            logger.info(f"Creating Qdrant collection: {COLLECTION_NAME}")
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE)
            )

    total_chunks = 0
    
    # We explicitly look for React docs as per Phase 3 plan, but iterate dynamically
    topics = [d for d in os.listdir(KNOWLEDGE_BASE_DIR) if os.path.isdir(os.path.join(KNOWLEDGE_BASE_DIR, d))]
    
    if not topics:
        logger.warning(f"No topic directories found in {KNOWLEDGE_BASE_DIR}")
        return

    for topic in topics:
        topic_path = os.path.join(KNOWLEDGE_BASE_DIR, topic)
        md_files = glob.glob(os.path.join(topic_path, "*.md"))
        
        if not md_files:
            continue
            
        logger.info(f"Processing topic: {topic} ({len(md_files)} files found)")
        
        topic_chunks = []
        # 1. Read and chunk documents
        for file_path in md_files:
            logger.info(f"Chunking {file_path}...")
            chunks = chunk_document(file_path, topic=topic)
            topic_chunks.extend(chunks)
            
        if not topic_chunks:
            logger.warning(f"No text extracted for topic {topic}.")
            continue
            
        # 2. Generate embeddings
        logger.info(f"Generating embeddings for {len(topic_chunks)} chunks using BAAI/bge-small-en-v1.5...")
        for chunk in topic_chunks:
            chunk["embedding"] = get_embedding(chunk["text"])
            
        # 3. Store in Qdrant
        if is_mock:
            from services.qdrant_client import get_mock_store
            store = get_mock_store()
            store.extend(topic_chunks)
            logger.info(f"Stored {len(topic_chunks)} chunks for {topic} in mock store.")
        else:
            points = []
            for chunk in topic_chunks:
                point_id = hash(chunk["text"]) & 0xfffffffffffffff
                points.append(PointStruct(
                    id=point_id,
                    vector=chunk["embedding"],
                    payload={
                        "text": chunk["text"],
                        "metadata": chunk["metadata"]
                    }
                ))
                
            logger.info(f"Upserting {len(points)} vectors to Qdrant...")
            client.upsert(collection_name=COLLECTION_NAME, points=points)
            logger.info(f"Successfully upserted {len(points)} chunks for topic '{topic}'.")
            
        total_chunks += len(topic_chunks)

    logger.info(f"Ingestion complete. Total chunks processed: {total_chunks}")


if __name__ == "__main__":
    ingest_knowledge_base()
