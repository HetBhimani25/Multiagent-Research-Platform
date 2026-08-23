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

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=api_key,
        temperature=0.3
    )

    context = "\n\n".join([
        f"Source [{r['title']}] ({r['url']}):\n{r['content']}"
        for r in search_results
    ])

    prompt = f"""You are a professional Academic & Technical Research Writer.
Write a comprehensive, structured research report in Markdown based on the provided search findings.

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
- ## References (List URLs from web findings)
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
