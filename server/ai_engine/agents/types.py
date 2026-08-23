from typing import TypedDict, List, Optional, Any

class ResearchState(TypedDict):
    question: str
    plan: str
    search_queries: List[str]
    search_results: List[dict]
    report: str
    status: str
    error: Optional[str]
