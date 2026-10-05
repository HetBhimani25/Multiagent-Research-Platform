import os
import json
import re
from langchain_groq import ChatGroq
from agents.types import ResearchState

FALLBACK_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b"
]

def clean_topic_prompt(raw_prompt: str) -> str:
    """Strips meta instructions like 'Generate Technical Approach on' to extract the pure research topic."""
    if not raw_prompt:
        return "Software Architecture & Infrastructure"
    
    clean = raw_prompt.strip()
    prefixes_to_strip = [
        r"^generate\s+technical\s+approach\s+on\s+",
        r"^generate\s+a\s+research\s+paper\s+on\s+",
        r"^generate\s+a\s+paper\s+on\s+",
        r"^write\s+a\s+paper\s+on\s+",
        r"^write\s+a\s+technical\s+report\s+on\s+",
        r"^create\s+a\s+report\s+on\s+",
        r"^build\s+a\s+plan\s+for\s+"
    ]
    for pattern in prefixes_to_strip:
        clean = re.sub(pattern, "", clean, flags=re.IGNORECASE).strip()
    
    clean = clean.strip('"').strip("'").strip()
    return clean if clean else raw_prompt

def run_planner(state: ResearchState) -> dict:
    """Agent 1: Planner Agent
    Decomposes complex research topics into 3–5 targeted search sub-queries.
    """
    raw_question = state.get("question", "")
    topic = clean_topic_prompt(raw_question)
    
    api_key = os.getenv("GROQ_API_KEY")
    env_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    models_to_try = [env_model] + [m for m in FALLBACK_MODELS if m != env_model]
    
    default_queries = [
        f"{topic} system architecture development",
        f"{topic} technical implementation best practices",
        f"{topic} environment setup trade-offs performance",
        f"{topic} security isolation configuration"
    ]

    if not api_key or api_key == "demo":
        return {
            "plan": f"Decompose technical research topic '{topic}' into targeted search sub-queries covering architecture, implementation, and performance.",
            "search_queries": default_queries,
            "status": "planned"
        }

    prompt = f"""You are a senior Research Planner AI.
Analyze the target topic below and create a strategic research breakdown. Generate 4 targeted, highly specific web search queries focusing on technical implementation, system architecture, performance, and best practices for this topic.

Target Research Topic: "{topic}"

Respond strictly in JSON format with two keys:
"plan": "Detailed strategy breakdown for researching {topic}",
"search_queries": ["query 1", "query 2", "query 3", "query 4"]
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
            content = str(response.content).strip()
            
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]).strip()
                if content.startswith("json"):
                    content = content[4:].strip()
                
            data = json.loads(content)
            queries = data.get("search_queries", default_queries)
            if not isinstance(queries, list) or len(queries) < 2:
                queries = default_queries

            return {
                "plan": data.get("plan", f"Research breakdown for {topic}."),
                "search_queries": queries,
                "status": "planned"
            }
        except Exception as e:
            print(f"[Planner Agent] Model {model_name} error: {e}. Trying fallback...")
            continue

    return {
        "plan": f"Decompose technical research topic '{topic}' into targeted sub-queries.",
        "search_queries": default_queries,
        "status": "planned"
    }
