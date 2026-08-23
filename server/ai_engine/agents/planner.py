import os
import json
from langchain_groq import ChatGroq
from agents.types import ResearchState

def run_planner(state: ResearchState) -> dict:
    question = state.get("question", "")
    api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        return {"error": "GROQ_API_KEY not found in environment variables."}

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=api_key,
        temperature=0.2
    )

    prompt = f"""You are a senior Research Planner AI.
Given the research question below, create a short research plan and output 3 distinct web search queries.

Research Question: "{question}"

Respond strictly in JSON format with two keys:
"plan": "Short strategy description",
"search_queries": ["query 1", "query 2", "query 3"]
"""

    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        # Clean markdown code blocks if present
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1])
            
        data = json.loads(content)
        return {
            "plan": data.get("plan", "Research plan generated."),
            "search_queries": data.get("search_queries", [question]),
            "status": "planned"
        }
    except Exception as e:
        return {
            "plan": f"Plan for: {question}",
            "search_queries": [question, f"{question} details", f"{question} architecture"],
            "status": "planned"
        }
