import os
from langchain_groq import ChatGroq
from agents.types import ResearchState

def run_writer(state: ResearchState) -> dict:
    question = state.get("question", "")
    plan = state.get("plan", "")
    search_results = state.get("search_results", [])
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"report": "GROQ_API_KEY missing.", "status": "error"}

    model_name = os.getenv("GROQ_MODEL", "groq/compound")
    llm = ChatGroq(
        model=model_name,
        groq_api_key=api_key,
        temperature=0.3
    )

    # Smart context truncation to prevent 413 Request Entity Too Large errors
    context_items = []
    for r in search_results[:4]:
        title = r.get("title", "Web Source")
        url = r.get("url", "")
        content_snippet = r.get("content", "")[:800] # Cap snippet at 800 characters
        context_items.append(f"Source: [{title}]({url})\nSnippet: {content_snippet}")

    context = "\n\n".join(context_items)

    prompt = f"""You are a professional Academic & Technical Research Writer.
Write a comprehensive, well-structured research report in Markdown based on the provided search findings.

Research Topic: "{question}"
Research Strategy: "{plan}"

Web Findings Context:
{context}

Format Requirements:
- # Title
- ## Executive Summary
- ## Key Findings & Technical Insights
- ## Detailed Analysis
- ## Conclusion & Future Work
- ## References (List source URLs)
"""

    try:
        response = llm.invoke(prompt)
        return {
            "report": response.content,
            "status": "completed"
        }
    except Exception as e:
        return {
            "report": f"Failed to generate report: {str(e)}",
            "status": "failed",
            "error": str(e)
        }
