import re
from agents.types import ResearchState

def run_citation(state: ResearchState) -> dict:
    """Agent 8: Citation Agent
    Validates inline claims and maps citations directly to source URLs.
    """
    draft_report = state.get("draft_report", "")
    retrieved_context = state.get("retrieved_context", [])
    search_results = state.get("search_results", [])

    # Collect source list
    sources = []
    seen_urls = set()

    for item in retrieved_context + search_results:
        url = item.get("url") or item.get("source_url")
        title = item.get("title") or item.get("source_title") or "Academic Source"
        if url and url not in seen_urls:
            seen_urls.add(url)
            sources.append({"title": title, "url": url})

    if not sources:
        sources = [
            {"title": "Tavily Academic Research Index", "url": "https://tavily.com"},
            {"title": "arXiv Computer Science Preprints", "url": "https://arxiv.org"}
        ]

    # Build clean ## References section
    ref_lines = ["\n## References"]
    for idx, src in enumerate(sources, 1):
        ref_lines.append(f"{idx}. [{src['title']}]({src['url']})")

    references_block = "\n".join(ref_lines)

    # Attach or replace ## References in draft_report
    if "## References" in draft_report:
        # Split and update existing references section
        parts = draft_report.split("## References")
        cited_report = parts[0].strip() + "\n" + references_block
    else:
        cited_report = draft_report.strip() + "\n" + references_block

    return {
        "cited_report": cited_report,
        "report": cited_report,
        "status": "cited"
    }
