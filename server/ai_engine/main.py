import os
import io
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader

# Load root .env file
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from graph import run_research_pipeline
from rag_service import rag_store, execute_rag_query

app = FastAPI(title="Multi-Agent AI Research Engine & Full Vector RAG System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    question: str
    depth: Optional[str] = "deep"
    doc_type: Optional[str] = "research_paper"
    workspace_id: Optional[str] = None
    document_id: Optional[str] = None
    initiated_by: Optional[str] = None
    run_id: Optional[str] = None

class RAGQueryRequest(BaseModel):
    query: str
    doc_id: Optional[str] = "all"
    top_k: Optional[int] = 5

class RAGIndexRequest(BaseModel):
    doc_id: str
    title: str
    content: str
    source_type: Optional[str] = "paper"
    metadata: Optional[Dict[str, Any]] = None

class SyncPapersRequest(BaseModel):
    papers: List[Dict[str, Any]]

@app.get("/")
def read_root():
    return {"status": "online", "service": "AI Research Engine & Vector RAG Assistant"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/research/run")
async def execute_research(payload: ResearchRequest):
    if not payload.question:
        raise HTTPException(status_code=400, detail="Question prompt is required.")
    
    try:
        pipeline_depth = payload.depth.lower() if payload.depth else "deep"
        doc_type = payload.doc_type.lower() if payload.doc_type else "research_paper"
        result = await run_research_pipeline(
            payload.question,
            depth=pipeline_depth,
            doc_type=doc_type,
            workspace_id=payload.workspace_id,
            document_id=payload.document_id,
            initiated_by=payload.initiated_by,
            run_id=payload.run_id
        )
        # Automatically index newly generated research paper into RAG vector store
        if result and result.get("report"):
            paper_id = payload.document_id or f"paper_{uuid.uuid4().hex[:8]}"
            rag_store.index_document(
                doc_id=paper_id,
                title=payload.question,
                content=result["report"],
                source_type="generated_paper",
                metadata={"depth": pipeline_depth, "doc_type": doc_type}
            )

        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── FULL RAG SYSTEM ENDPOINTS ──

@app.post("/api/rag/query")
async def rag_query_endpoint(payload: RAGQueryRequest):
    """Retrieves top-k relevant semantic chunks and synthesizes a grounded answer via LLM."""
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        result = await execute_rag_query(
            query=payload.query.strip(),
            doc_id=payload.doc_id,
            top_k=payload.top_k or 5
        )
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG execution error: {str(e)}")

@app.post("/api/rag/index")
async def rag_index_endpoint(payload: RAGIndexRequest):
    """Indexes a single document directly into the vector store."""
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")

    try:
        chunks_created = rag_store.index_document(
            doc_id=payload.doc_id,
            title=payload.title,
            content=payload.content,
            source_type=payload.source_type or "paper",
            metadata=payload.metadata
        )
        return {
            "status": "success",
            "doc_id": payload.doc_id,
            "title": payload.title,
            "chunks_created": chunks_created,
            "total_documents": len(rag_store.documents),
            "total_chunks": len(rag_store.chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing error: {str(e)}")

@app.post("/api/rag/sync-papers")
async def rag_sync_papers_endpoint(payload: SyncPapersRequest):
    """Bulk synchronizes user's saved research documents into the vector store."""
    try:
        synced = 0
        total_new_chunks = 0
        for p in payload.papers:
            p_id = p.get("id")
            p_topic = p.get("topic") or "Untitled Paper"
            p_report = p.get("report") or ""
            if p_id and p_report.strip():
                c_count = rag_store.index_document(
                    doc_id=p_id,
                    title=p_topic,
                    content=p_report,
                    source_type="saved_paper",
                    metadata={"depth": p.get("depth"), "docType": p.get("docType")}
                )
                synced += 1
                total_new_chunks += c_count

        return {
            "status": "success",
            "synced_documents": synced,
            "total_chunks": len(rag_store.chunks),
            "total_documents": len(rag_store.documents)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync error: {str(e)}")

@app.post("/api/rag/upload")
async def rag_upload_endpoint(file: UploadFile = File(...)):
    """Uploads and indexes an external document (PDF, Markdown, TXT) into the vector store."""
    try:
        filename = file.filename or "uploaded_document.txt"
        contents = await file.read()
        extracted_text = ""

        if filename.lower().endswith(".pdf"):
            pdf_stream = io.BytesIO(contents)
            reader = PdfReader(pdf_stream)
            pages_text = []
            for i, page in enumerate(reader.pages):
                t = page.extract_text()
                if t:
                    pages_text.append(f"--- Page {i+1} ---\n{t}")
            extracted_text = "\n\n".join(pages_text)
        else:
            # Assume text/markdown/json
            try:
                extracted_text = contents.decode("utf-8")
            except UnicodeDecodeError:
                extracted_text = contents.decode("latin-1")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from uploaded file.")

        doc_id = f"upload_{uuid.uuid4().hex[:10]}"
        title = filename.rsplit(".", 1)[0].replace("_", " ").title()
        
        chunks_created = rag_store.index_document(
            doc_id=doc_id,
            title=title,
            content=extracted_text,
            source_type="uploaded_file",
            metadata={"filename": filename, "file_size": len(contents)}
        )

        return {
            "status": "success",
            "doc_id": doc_id,
            "title": title,
            "filename": filename,
            "chunks_created": chunks_created,
            "char_count": len(extracted_text),
            "total_documents": len(rag_store.documents),
            "total_chunks": len(rag_store.chunks)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {str(e)}")

@app.get("/api/rag/stats")
def rag_stats_endpoint():
    """Returns vector store health, document catalog, and indexing metrics."""
    return {
        "status": "success",
        "data": rag_store.get_stats()
    }

@app.delete("/api/rag/document/{doc_id}")
def rag_delete_document_endpoint(doc_id: str):
    """Deletes an indexed document and its vector chunks."""
    deleted = rag_store.delete_document(doc_id)
    return {
        "status": "success",
        "deleted": deleted,
        "doc_id": doc_id,
        "remaining_documents": len(rag_store.documents),
        "remaining_chunks": len(rag_store.chunks)
    }