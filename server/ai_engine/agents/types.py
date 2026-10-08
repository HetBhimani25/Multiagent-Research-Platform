from typing import TypedDict, List, Optional, Any, Dict

class DocumentChunk(TypedDict):
    id: str
    source_url: str
    source_title: str
    text: str
    score: Optional[float]
    workspace_id: Optional[str]
    document_id: Optional[str]

class ResearchState(TypedDict):
    question: str
    plan: str
    search_queries: List[str]
    search_results: List[Dict[str, Any]]
    raw_documents: List[Dict[str, Any]]
    chunks: List[DocumentChunk]
    retrieved_context: List[Dict[str, Any]]
    insights: List[str]
    draft_report: str
    cited_report: str
    review_score: int
    review_feedback: str
    revision_count: int
    mermaid_diagram: str
    report: str
    status: str
    error: Optional[str]
    # Document Filtration & Type Objective
    doc_type: Optional[str]
    # Multi-User Collaboration & Run Ownership
    workspace_id: Optional[str]
    document_id: Optional[str]
    initiated_by: Optional[str]
    run_id: Optional[str]
