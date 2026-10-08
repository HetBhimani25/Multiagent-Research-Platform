import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load root .env file
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from graph import run_research_pipeline

app = FastAPI(title="Multi-Agent AI Research Engine with Collaboration Support")

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

@app.get("/")
def read_root():
    return {"status": "online", "service": "AI Research Engine"}

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
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))