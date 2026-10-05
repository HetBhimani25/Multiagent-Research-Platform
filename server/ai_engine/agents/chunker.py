import uuid
from agents.types import ResearchState, DocumentChunk

def split_text_into_chunks(text: str, chunk_size: int = 800, overlap: int = 100) -> list:
    """Splits raw text into ~800 character semantic chunks with 100 char overlap at sentence boundaries."""
    if not text:
        return []

    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = min(start + chunk_size, text_length)
        if end < text_length:
            # Look for sentence boundary near end
            punct_idx = max(text.rfind('. ', start, end), text.rfind('?\n', start, end), text.rfind('! ', start, end))
            if punct_idx > start + 300:
                end = punct_idx + 1

        chunk_str = text[start:end].strip()
        if chunk_str:
            chunks.append(chunk_str)

        if end >= text_length:
            break
        start = end - overlap

    return chunks

def run_chunker(state: ResearchState) -> dict:
    """Agent 4: Chunker Agent
    Splits document text into optimal 800-character semantic chunks with overlap.
    """
    raw_documents = state.get("raw_documents", [])
    search_results = state.get("search_results", [])
    
    # Use raw_documents or search_results as fallback
    docs_to_process = raw_documents if raw_documents else [
        {"url": item.get("url"), "title": item.get("title"), "full_text": item.get("content")}
        for item in search_results
    ]

    all_chunks: list = []

    for doc in docs_to_process:
        url = doc.get("url", "https://arxiv.org")
        title = doc.get("title", "Research Reference")
        text = doc.get("full_text", "")

        text_chunks = split_text_into_chunks(text, chunk_size=800, overlap=100)
        for i, chunk_text in enumerate(text_chunks):
            chunk_obj: DocumentChunk = {
                "id": f"chunk_{uuid.uuid4().hex[:8]}",
                "source_url": url,
                "source_title": title,
                "text": chunk_text,
                "score": 0.0
            }
            all_chunks.append(chunk_obj)

    return {
        "chunks": all_chunks,
        "status": "chunked"
    }
