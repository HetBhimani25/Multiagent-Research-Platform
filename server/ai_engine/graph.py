from langgraph.graph import StateGraph, END
from agents.types import ResearchState
from agents.planner import run_planner
from agents.searcher import run_searcher
from agents.writer import run_writer

def build_research_graph():
    builder = StateGraph(ResearchState)

    builder.add_node("planner", run_planner)
    builder.add_node("searcher", run_searcher)
    builder.add_node("writer", run_writer)

    builder.set_entry_point("planner")
    builder.add_edge("planner", "searcher")
    builder.add_edge("searcher", "writer")
    builder.add_edge("writer", END)

    return builder.compile()

async def run_research_pipeline(question: str) -> dict:
    initial_state: ResearchState = {
        "question": question,
        "plan": "",
        "search_queries": [],
        "search_results": [],
        "report": "",
        "status": "started",
        "error": None
    }

    graph = build_research_graph()
    final_state = await graph.ainvoke(initial_state)
    return final_state
