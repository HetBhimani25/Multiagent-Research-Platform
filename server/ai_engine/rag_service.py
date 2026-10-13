import os
import re
import math
import uuid
import json
import io
from pathlib import Path
from typing import List, Dict, Any, Optional
from collections import Counter
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# In-memory document & chunk storage with local file persistence
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)
INDEX_FILE = DATA_DIR / "rag_index.json"

class DocumentChunk:
    def __init__(
        self,
        chunk_id: str,
        doc_id: str,
        doc_title: str,
        text: str,
        chunk_index: int,
        source_type: str = "paper",
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.chunk_id = chunk_id
        self.doc_id = doc_id
        self.doc_title = doc_title
        self.text = text
        self.chunk_index = chunk_index
        self.source_type = source_type
        self.metadata = metadata or {}
        # Precomputed term frequencies
        self.tokens = self._tokenize(text)
        self.term_freq = Counter(self.tokens)

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        # Filter out common stop-words and retain meaningful alphanumeric tokens
        tokens = re.findall(r'\b[a-zA-Z0-9_\-\.]{2,}\b', text.lower())
        stopwords = {
            'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'of', 'to',
            'for', 'with', 'as', 'by', 'that', 'this', 'it', 'from', 'be', 'are', 'was',
            'were', 'will', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'not', 'can'
        }
        return [t for t in tokens if t not in stopwords]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "doc_id": self.doc_id,
            "doc_title": self.doc_title,
            "text": self.text,
            "chunk_index": self.chunk_index,
            "source_type": self.source_type,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DocumentChunk':
        return cls(
            chunk_id=data["chunk_id"],
            doc_id=data["doc_id"],
            doc_title=data["doc_title"],
            text=data["text"],
            chunk_index=data["chunk_index"],
            source_type=data.get("source_type", "paper"),
            metadata=data.get("metadata", {})
        )


class RAGVectorStore:
    def __init__(self):
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.chunks: List[DocumentChunk] = []
        self._load_from_disk()

    def _save_to_disk(self):
        try:
            payload = {
                "documents": self.documents,
                "chunks": [c.to_dict() for c in self.chunks]
            }
            with open(INDEX_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[RAG Store] Error saving index to disk: {e}")

    def _load_from_disk(self):
        if not INDEX_FILE.exists():
            return
        try:
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                payload = json.load(f)
            self.documents = payload.get("documents", {})
            self.chunks = [DocumentChunk.from_dict(c) for c in payload.get("chunks", [])]
            print(f"[RAG Store] Loaded {len(self.documents)} documents, {len(self.chunks)} chunks from disk.")
        except Exception as e:
            print(f"[RAG Store] Error loading index from disk: {e}")

    def split_into_chunks(self, text: str, chunk_size: int = 700, overlap: int = 120) -> List[str]:
        """Splits text into semantic segments respecting paragraph & sentence boundaries."""
        if not text or not text.strip():
            return []

        # Split on double newline first (paragraphs)
        raw_paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        current_chunk = ""

        for p in raw_paragraphs:
            if len(current_chunk) + len(p) + 2 <= chunk_size:
                current_chunk = f"{current_chunk}\n\n{p}" if current_chunk else p
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                # If paragraph itself is larger than chunk_size, split by sentences
                if len(p) > chunk_size:
                    sentences = re.split(r'(?<=[.!?])\s+', p)
                    sub_chunk = ""
                    for s in sentences:
                        if len(sub_chunk) + len(s) + 1 <= chunk_size:
                            sub_chunk = f"{sub_chunk} {s}" if sub_chunk else s
                        else:
                            if sub_chunk:
                                chunks.append(sub_chunk.strip())
                            sub_chunk = s
                    current_chunk = sub_chunk
                else:
                    current_chunk = p

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def index_document(
        self,
        doc_id: str,
        title: str,
        content: str,
        source_type: str = "paper",
        metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """Indexes or replaces a document in the vector store."""
        # Remove previous chunks for this document if updating
        self.delete_document(doc_id, save=False)

        chunks_text = self.split_into_chunks(content)
        new_chunks = []
        for idx, c_text in enumerate(chunks_text):
            chunk = DocumentChunk(
                chunk_id=f"{doc_id}_c{idx}",
                doc_id=doc_id,
                doc_title=title,
                text=c_text,
                chunk_index=idx + 1,
                source_type=source_type,
                metadata=metadata or {}
            )
            new_chunks.append(chunk)

        self.chunks.extend(new_chunks)
        self.documents[doc_id] = {
            "id": doc_id,
            "title": title,
            "source_type": source_type,
            "chunk_count": len(new_chunks),
            "char_count": len(content),
            "metadata": metadata or {}
        }
        self._save_to_disk()
        return len(new_chunks)

    def delete_document(self, doc_id: str, save: bool = True) -> bool:
        """Removes a document and its chunks from the store."""
        initial_chunk_count = len(self.chunks)
        self.chunks = [c for c in self.chunks if c.doc_id != doc_id]
        if doc_id in self.documents:
            del self.documents[doc_id]
        if save:
            self._save_to_disk()
        return len(self.chunks) < initial_chunk_count

    def search(
        self,
        query: str,
        doc_id: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Hybrid Vector + BM25 cosine retrieval across chunks."""
        if not query.strip() or not self.chunks:
            return []

        target_chunks = self.chunks
        if doc_id and doc_id != "all":
            target_chunks = [c for c in self.chunks if c.doc_id == doc_id]
            if not target_chunks:
                return []

        # 1. Sub-word character n-gram TF-IDF vector similarity
        texts = [c.text for c in target_chunks]
        subword_sims = [0.0] * len(target_chunks)
        try:
            tfidf = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5), sublinear_tf=True)
            tfidf_matrix = tfidf.fit_transform(texts)
            q_vec = tfidf.transform([query])
            sim_array = cosine_similarity(q_vec, tfidf_matrix)[0]
            subword_sims = [float(s) for s in sim_array]
        except Exception as e:
            print(f"[RAG Store] TF-IDF vectorizer error: {e}")

        # 2. BM25 term weighting
        query_tokens = DocumentChunk._tokenize(query)
        if not query_tokens:
            query_tokens = query.lower().split()

        total_docs = len(target_chunks)
        df: Counter = Counter()
        for c in target_chunks:
            for t in set(c.tokens):
                df[t] += 1

        avg_dl = sum(len(c.tokens) for c in target_chunks) / max(total_docs, 1)
        k1 = 1.5
        b = 0.75

        scored: List[Dict[str, Any]] = []

        for idx, c in enumerate(target_chunks):
            doc_len = len(c.tokens) or 1
            subword_sim = subword_sims[idx]

            # BM25 score
            bm25 = 0.0
            for t in query_tokens:
                if t in c.term_freq:
                    n_q = df.get(t, 0)
                    idf = math.log((total_docs - n_q + 0.5) / (n_q + 0.5) + 1.0)
                    tf = c.term_freq[t]
                    num = tf * (k1 + 1.0)
                    denom = tf + k1 * (1.0 - b + b * (doc_len / avg_dl))
                    bm25 += idf * (num / denom)

            normalized_bm25 = 1.0 / (1.0 + math.exp(-bm25 / 3.0)) if bm25 > 0 else 0.0

            # Hybrid score fusing sub-word vector similarity and BM25
            hybrid_score = (0.60 * subword_sim) + (0.40 * normalized_bm25)

            if hybrid_score > 0.05 or subword_sim > 0.10:
                scored.append({
                    "chunk_id": c.chunk_id,
                    "doc_id": c.doc_id,
                    "doc_title": c.doc_title,
                    "text": c.text,
                    "chunk_index": c.chunk_index,
                    "source_type": c.source_type,
                    "score": round(min(hybrid_score, 1.0), 4),
                    "vector_score": round(subword_sim, 4),
                    "bm25_score": round(bm25, 4)
                })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_documents": len(self.documents),
            "total_chunks": len(self.chunks),
            "documents": list(self.documents.values())
        }


# Global store instance
rag_store = RAGVectorStore()


async def execute_rag_query(query: str, doc_id: Optional[str] = None, top_k: int = 5) -> Dict[str, Any]:
    """Retrieves top context and generates a grounded response using Groq LLM."""
    retrieved = rag_store.search(query, doc_id=doc_id, top_k=top_k)

    if not retrieved:
        # Check if store has any documents at all
        if not rag_store.chunks:
            return {
                "answer": "There are currently no documents in the RAG knowledge base. You can **upload a PDF/TXT document** or **generate a new research paper** to begin querying your library.",
                "sources": [],
                "confidence": 0.0,
                "total_chunks_evaluated": 0
            }
        return {
            "answer": f"I searched across the indexed documents, but could not find information directly relevant to: *\"{query}\"*. Please try rephrasing or asking about topics covered in the selected document(s).",
            "sources": [],
            "confidence": 0.0,
            "total_chunks_evaluated": len(rag_store.chunks)
        }

    # Format context for LLM
    context_blocks = []
    for idx, r in enumerate(retrieved):
        context_blocks.append(
            f"--- [SOURCE {idx+1}: {r['doc_title']} (Chunk #{r['chunk_index']})] ---\n{r['text']}"
        )
    context_str = "\n\n".join(context_blocks)

    api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

    prompt = f"""You are a specialized Research Document RAG Assistant.
A user is asking a question about documents in their knowledge base.
Answer the question thoroughly, clearly, and concisely based strictly on the provided context excerpts below.

Context Excerpts:
{context_str}

User Question:
"{query}"

Guidelines:
1. Ground your answer ONLY in the facts mentioned in the context.
2. Explicitly cite the sources inline using brackets like `[Source 1: Doc Title, Chunk #1]`.
3. If the context does not contain the complete answer, state clearly what is supported and what is not mentioned.
4. Structure your response with clean Markdown (headings, bullet points, or code if applicable).
"""

    answer = ""
    if api_key and api_key != "demo":
        try:
            from groq import Groq
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                model=groq_model,
                messages=[
                    {"role": "system", "content": "You are a professional academic research assistant specializing in retrieval-augmented answering."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=900
            )
            answer = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[RAG Service] Groq error: {e}. Falling back to contextual extraction.")
            answer = ""

    if not answer:
        # Fallback synthesizer: extract salient sentences from top retrieved chunks
        salient_points = []
        for r in retrieved[:3]:
            # Take the first two substantive sentences of the chunk
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', r["text"]) if len(s.strip()) > 30]
            if sentences:
                salient_points.append(f"- **From *{r['doc_title']}* (Chunk #{r['chunk_index']}):** {sentences[0]}")
        
        points_str = "\n".join(salient_points)
        answer = f"""### Findings from Indexed Knowledge Base

Based on semantic vector retrieval against your documents, here are the most relevant insights regarding **"{query}"**:

{points_str}

*(Note: Context retrieved from {len(retrieved)} chunk segments with high semantic relevance).*"""

    avg_score = sum(r["score"] for r in retrieved) / max(len(retrieved), 1)

    return {
        "answer": answer,
        "sources": retrieved,
        "confidence": round(avg_score * 100, 1),
        "total_chunks_evaluated": len(rag_store.chunks)
    }
