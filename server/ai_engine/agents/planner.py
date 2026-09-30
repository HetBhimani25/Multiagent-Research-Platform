import os
import json
from langchain_groq import ChatGroq
from agents.types import ResearchState

FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
]

def clean_topic_prompt(raw_prompt: str) -> str:
    """Strips meta instructions like 'Generate a Research Paper' to extract the pure research topic."""
    clean = raw_prompt.replace('Generate a Research Paper', '').replace('Write a paper on', '').replace('Write a technical report on', '').strip()
    clean = clean.strip('"').strip("'").strip()
    return clean if clean else raw_prompt

def run_planner(state: ResearchState) -> dict:
    raw_question = state.get("question", "")
    question = clean_topic_prompt(raw_question)
    
    api_key = os.getenv("GROQ_API_KEY")
    env_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    models_to_try = [env_model] + [m for m in FALLBACK_MODELS if m != env_model]
    
    if not api_key or api_key == "demo":
        return {
            "plan": f"Decompose topic '{question}' into search sub-queries.",
            "search_queries": [question, f"{question} methods", f"{question} analysis"],
            "status": "planned"
        }

    prompt = f"""You are a senior Research Planner AI.
Given the research topic below, create a concise research strategy and output 3 targeted web search queries focused strictly on the core technical topic.

Research Topic: "{question}"

Respond strictly in JSON format with two keys:
"plan": "Short strategy description",
"search_queries": ["query 1", "query 2", "query 3"]
"""

    for model_name in models_to_try:
        try:
            llm = ChatGroq(
                model=model_name,
                groq_api_key=api_key,
                temperature=0.2,
                max_tokens=400
            )
            response = llm.invoke(prompt)
            content = response.content.strip()
            
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
            print(f"Planner model {model_name} error: {e}. Trying fallback model...")
            continue

    return {
        "plan": f"Decompose topic '{question}' into search sub-queries.",
        "search_queries": [question, f"{question} methods", f"{question} analysis"],
        "status": "planned"
    }
