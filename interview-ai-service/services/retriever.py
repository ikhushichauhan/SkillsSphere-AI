from services.qdrant_client import get_qdrant_client, get_mock_store
from services.embedder import get_embedding
from services.chunker import chunk_document
from qdrant_client.models import Distance, VectorParams, PointStruct
import os
import glob
import logging

logger = logging.getLogger("retriever")

COLLECTION_NAME = "skillssphere_docs"
EMBEDDING_DIM = 384  # BAAI/bge-small-en-v1.5 output dimension

def get_cosine_similarity(v1, v2):
    return sum(x * y for x, y in zip(v1, v2))

def ingest_documents(topic: str, folder_path: str):
    """
    Reads all docs in folder, chunks them, generates embeddings, and stores them.
    """
    client, is_mock = get_qdrant_client()
    
    # Gather all markdown/text files
    pattern = os.path.join(folder_path, "*.md")
    files = glob.glob(pattern)
    
    all_chunks = []
    for file in files:
        file_chunks = chunk_document(file, topic)
        all_chunks.extend(file_chunks)
        
    if not all_chunks:
        logger.info(f"No documents found to ingest for topic: {topic} at path: {folder_path}")
        return 0

    # Generate embeddings
    for chunk in all_chunks:
        chunk["embedding"] = get_embedding(chunk["text"])

    if is_mock:
        store = get_mock_store()
        # Clean existing chunks for this topic
        store[:] = [item for item in store if item["metadata"]["topic"] != topic]
        store.extend(all_chunks)
        logger.info(f"Ingested {len(all_chunks)} chunks for topic '{topic}' in local memory store.")
        return len(all_chunks)
    else:
        # Live Qdrant ingestion
        try:
            collections = client.get_collections().collections
            exists = any(c.name == COLLECTION_NAME for c in collections)
            if not exists:
                client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE)
                )
                
            points = []
            for i, chunk in enumerate(all_chunks):
                # Point ID needs to be a 64-bit unsigned int
                point_id = hash(chunk["text"]) & 0xfffffffffffffff
                points.append(PointStruct(
                    id=point_id,
                    vector=chunk["embedding"],
                    payload={
                        "text": chunk["text"],
                        "metadata": chunk["metadata"]
                    }
                ))
                
            client.upsert(collection_name=COLLECTION_NAME, points=points)
            logger.info(f"Ingested {len(all_chunks)} chunks for topic '{topic}' in Qdrant.")
            return len(all_chunks)
        except Exception as e:
            logger.error(f"Failed live Qdrant ingestion: {e}. Falling back to mock store.")
            # Fallback to mock store
            store = get_mock_store()
            store[:] = [item for item in store if item["metadata"]["topic"] != topic]
            store.extend(all_chunks)
            return len(all_chunks)

def retrieve_context(query: str, topic: str, top_k: int = 5):
    """
    Retrieve top-k relevant documentation passages.
    """
    client, is_mock = get_qdrant_client()
    query_vector = get_embedding(query, is_query=True)
    
    if is_mock:
        store = get_mock_store()
        # Filter by topic
        filtered = [item for item in store if item["metadata"]["topic"] == topic]
        
        # Calculate scores
        results = []
        for item in filtered:
            score = get_cosine_similarity(query_vector, item["embedding"])
            results.append((score, item["text"]))
            
        # Sort by score descending
        results.sort(key=lambda x: x[0], reverse=True)
        return [text for _, text in results[:top_k]]
    else:
        # Live Qdrant search
        try:
            search_result = client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=top_k * 2,  # Retrieve slightly more in case of mismatch
                with_payload=True
            )
            # Filter matches by topic in payload metadata
            contexts = []
            for hit in search_result:
                payload = hit.payload
                if payload and payload.get("metadata", {}).get("topic") == topic:
                    contexts.append(payload["text"])
                    if len(contexts) >= top_k:
                        break
            return contexts
        except Exception as e:
            logger.error(f"Error searching Qdrant: {e}. Falling back to mock memory search.")
            # Local fallback search
            store = get_mock_store()
            filtered = [item for item in store if item["metadata"]["topic"] == topic]
            results = []
            for item in filtered:
                score = get_cosine_similarity(query_vector, item["embedding"])
                results.append((score, item["text"]))
            results.sort(key=lambda x: x[0], reverse=True)
            return [text for _, text in results[:top_k]]
