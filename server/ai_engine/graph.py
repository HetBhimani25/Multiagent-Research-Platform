from langgraph.graph import StateGraph, END
from agents.types import ResearchState
from agents.planner import run_planner
from agents.searcher import run_searcher
from agents.crawler import run_crawler
from agents.chunker import run_chunker
from agents.vector_rag import run_vector_rag
from agents.reasoner import run_reasoner
from agents.writer import run_writer
from agents.citation import run_citation
from agents.reviewer import run_reviewer
from agents.diagram import run_diagram

def build_research_graph(depth: str = "deep"):
    builder = StateGraph(ResearchState)

    # Register nodes
    builder.add_node("planner", run_planner)
    builder.add_node("searcher", run_searcher)
    builder.add_node("crawler", run_crawler)
    builder.add_node("chunker", run_chunker)
    builder.add_node("vector_rag", run_vector_rag)
    builder.add_node("reasoner", run_reasoner)
    builder.add_node("writer", run_writer)
    builder.add_node("citation", run_citation)
    builder.add_node("reviewer", run_reviewer)
    builder.add_node("diagram", run_diagram)

    builder.set_entry_point("planner")

    if depth == "fast":
        # Fast Depth: 3 Agents (Planner -> Searcher -> Writer -> Diagram -> END)
        builder.add_edge("planner", "searcher")
        builder.add_edge("searcher", "writer")
        builder.add_edge("writer", "diagram")
        builder.add_edge("diagram", END)
    elif depth == "balanced":
        # Balanced Depth: 8 Agents with Flowchart Diagram (Planner -> Searcher -> Crawler -> Chunker -> Vector RAG -> Reasoner -> Writer -> Citation -> Diagram -> END)
        builder.add_edge("planner", "searcher")
        builder.add_edge("searcher", "crawler")
        builder.add_edge("crawler", "chunker")
        builder.add_edge("chunker", "vector_rag")
        builder.add_edge("vector_rag", "reasoner")
        builder.add_edge("reasoner", "writer")
        builder.add_edge("writer", "citation")
        builder.add_edge("citation", "diagram")
        builder.add_edge("diagram", END)
    else:
        # Deep Academic Depth: Full 10 Agents (Planner -> Searcher -> Crawler -> Chunker -> Vector RAG -> Reasoner -> Writer -> Citation -> Reviewer -> Diagram -> END)
        builder.add_edge("planner", "searcher")
        builder.add_edge("searcher", "crawler")
        builder.add_edge("crawler", "chunker")
        builder.add_edge("chunker", "vector_rag")
        builder.add_edge("vector_rag", "reasoner")
        builder.add_edge("reasoner", "writer")
        builder.add_edge("writer", "citation")
        builder.add_edge("citation", "reviewer")
        builder.add_edge("reviewer", "diagram")
        builder.add_edge("diagram", END)

    return builder.compile()

async def run_research_pipeline(
    question: str,
    depth: str = "deep",
    doc_type: str = "research_paper",
    workspace_id: str = None,
    document_id: str = None,
    initiated_by: str = None,
    run_id: str = None
) -> dict:
    initial_state: ResearchState = {
        "question": question,
        "plan": "",
        "search_queries": [],
        "search_results": [],
        "raw_documents": [],
        "chunks": [],
        "retrieved_context": [],
        "insights": [],
        "draft_report": "",
        "cited_report": "",
        "review_score": 0,
        "review_feedback": "",
        "revision_count": 0,
        "mermaid_diagram": "",
        "report": "",
        "status": "started",
        "error": None,
        # Document Type Objective
        "doc_type": doc_type,
        # Multi-User Collaboration Metadata
        "workspace_id": workspace_id,
        "document_id": document_id,
        "initiated_by": initiated_by,
        "run_id": run_id
    }

    graph = build_research_graph(depth=depth)
    final_state = await graph.ainvoke(initial_state)

    # Bulletproof fallback: guarantee report is never empty if cited_report or draft_report was produced
    if not final_state.get("report"):
        final_state["report"] = final_state.get("cited_report") or final_state.get("draft_report") or ""

    return final_state
