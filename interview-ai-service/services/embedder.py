import os
# Prevent tf imports
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("TRANSFORMERS_NO_FLAX", "1")

from sentence_transformers import SentenceTransformer

_model = None

def get_embedder_model():
    global _model
    if _model is None:
        print("[embedder] Loading BAAI/bge-small-en-v1.5 model...")
        _model = SentenceTransformer("BAAI/bge-small-en-v1.5")
        print("[embedder] Model loaded successfully")
    return _model

def get_embedding(text: str, is_query: bool = False) -> list:
    """
    Generates a normalized embedding vector for the given text.
    """
    model = get_embedder_model()
    # For BGE, query needs instruction prefix, passages don't
    if is_query:
        input_text = f"Represent this sentence for searching relevant passages: {text}"
    else:
        input_text = text

    embedding = model.encode(input_text, normalize_embeddings=True)
    return embedding.tolist()
