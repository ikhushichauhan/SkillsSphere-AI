import os
from services.chunker import chunk_document
from services.embedder import get_embedding
from services.retriever import ingest_documents, retrieve_context, get_mock_store
from services.evaluator import evaluate_with_rag
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_chunker():
    """Verify document chunking yields chunks with correct structure and metadata."""
    doc_path = "knowledge/react/react_docs.md"
    # Ensure folder path exists relatively
    if not os.path.exists("knowledge/react"):
        os.makedirs("knowledge/react")
        with open(doc_path, "w") as f:
            f.write("# React\n## State\nState is local data.\n## Hooks\nuseState is a hook.")

    chunks = chunk_document(doc_path, "React")
    assert len(chunks) > 0
    for chunk in chunks:
        assert "text" in chunk
        assert "metadata" in chunk
        assert chunk["metadata"]["topic"] == "React"
        assert "subtopic" in chunk["metadata"]

def test_embedder():
    """Verify bge embedding generation yields list of length 384."""
    emb = get_embedding("React state management", is_query=False)
    assert isinstance(emb, list)
    assert len(emb) == 384
    # All values should be float numbers
    assert all(isinstance(x, float) for x in emb)

def test_retriever_mock_ingest_and_retrieve():
    """Verify document ingestion and semantic search context retrieval in mock mode."""
    # Ingest documents
    num_chunks = ingest_documents("React", "knowledge/react")
    assert num_chunks > 0

    # Retrieve context
    contexts = retrieve_context("What is React State?", "React", top_k=2)
    assert len(contexts) > 0
    assert len(contexts) <= 2
    # The matching document should be returned as string
    assert isinstance(contexts[0], str)

def test_evaluator_fallback():
    """Verify Gemini evaluator falls back gracefully to default results if API key is absent."""
    result = evaluate_with_rag(
        question="What are hooks?",
        answer="Hooks are helper functions.",
        context=["Hooks are functions introduced in 16.8."],
        expected_concepts=["hooks", "usecontext"]
    )
    assert "technical" in result
    assert "relevance" in result
    assert "feedback" in result
    assert "weakConcepts" in result

def test_evaluation_api_route():
    """Verify the evaluate FastAPI endpoint works with mock database and returns expected keys."""
    # Ensure some data exists in the mock store first
    ingest_documents("React", "knowledge/react")

    payload = {
        "transcript": "React state is a local data store inside component.",
        "expectedAnswer": "State holds local information of component.",
        "expectedConcepts": ["state", "render"],
        "topic": "React"
    }

    response = client.post("/api/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "technical" in data
    assert "communication" in data
    assert "relevance" in data
    assert "concepts" in data
    assert "detected" in data["concepts"]
    assert "missed" in data["concepts"]
    assert "weakConcepts" in data
    assert "feedback" in data
