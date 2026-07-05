import os
import re

def clean_text(text: str) -> str:
    # Normalize duplicate whitespaces but preserve single spaces/newlines
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n+', '\n', text)
    return text.strip()

def chunk_document(file_path: str, topic: str, chunk_size: int = 600, overlap: int = 100):
    """
    Reads a document, cleans it, and splits it into semantic chunks using headers.
    """
    if not os.path.exists(file_path):
        return []

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Split by headers (e.g. ## Header Name)
    sections = re.split(r'\n(?=##?\s+)', content)
    
    chunks = []
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
            
        # Extract the subtopic name from the first line if it's a header
        first_line = section.split('\n')[0]
        if first_line.startswith('#'):
            subtopic = re.sub(r'^##?\s+', '', first_line).strip()
        else:
            subtopic = "General"
            
        words = section.split()
        if len(words) <= chunk_size:
            chunks.append({
                "text": clean_text(section),
                "metadata": {
                    "topic": topic,
                    "subtopic": subtopic
                }
            })
        else:
            # Split with overlap if the section is too large
            start = 0
            chunk_idx = 1
            while start < len(words):
                end = min(start + chunk_size, len(words))
                chunk_words = words[start:end]
                chunk_text = " ".join(chunk_words)
                
                chunks.append({
                    "text": clean_text(f"Topic: {subtopic} (Part {chunk_idx})\n\n{chunk_text}"),
                    "metadata": {
                        "topic": topic,
                        "subtopic": subtopic
                    }
                })
                
                start += (chunk_size - overlap)
                chunk_idx += 1
                if end == len(words):
                    break

    return chunks
