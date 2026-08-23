import os
from tavily import TavilyClient
from agents.types import ResearchState

def run_searcher(state: ResearchState) -> dict:
    queries = state.get("search_queries", [])
    api_key = os.getenv("TAVILY_API_KEY")
    
    if not api_key:
        return {"search_results": [{"title": "Demo Result", "url": "https://example.com", "content": "Tavily search API key missing."}]}

    tavily = TavilyClient(api_key=api_key)
    results = []

    for query in queries[:3]:
        try:
            res = tavily.search(query=query, max_results=2)
            for item in res.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "content": item.get("content", "")
                })
        except Exception as e:
            print(f"Error searching for '{query}': {e}")

    return {
        "search_results": results,
        "status": "searched"
    }
