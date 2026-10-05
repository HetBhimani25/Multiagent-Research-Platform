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

app = FastAPI(title="Multi-Agent AI Research Engine")

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
        result = await run_research_pipeline(payload.question, depth=pipeline_depth)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))