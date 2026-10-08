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
        r"^generate\s+system\s+design\s+on\s+",
        r"^generate\s+comparative\s+analysis\s+on\s+",
        r"^generate\s+executive\s+summary\s+on\s+",
        r"^generate\s+literature\s+review\s+on\s+",
        r"^generate\s+a\s+research\s+paper\s+on\s+",
        r"^generate\s+a\s+paper\s+on\s+",
        r"^write\s+a\s+paper\s+on\s+",
        r"^write\s+a\s+technical\s+report\s+on\s+",
        r"^write\s+a\s+comparative\s+analysis\s+on\s+",
        r"^create\s+a\s+report\s+on\s+",
        r"^build\s+a\s+plan\s+for\s+"
    ]
    for pattern in prefixes_to_strip:
        clean = re.sub(pattern, "", clean, flags=re.IGNORECASE).strip()
    
    clean = clean.strip('"').strip("'").strip()
    return clean if clean else raw_prompt

def get_default_queries_by_type(topic: str, doc_type: str) -> list:
    """Generates default search queries aligned with the selected document type objective."""
    if doc_type == "technical_approach":
        return [
            f"{topic} technical architecture implementation specification RFC",
            f"{topic} core protocols data flow component interactions",
            f"{topic} configuration deployment setup best practices",
            f"{topic} security isolation failure modes trade-offs"
        ]
    elif doc_type == "system_design":
        return [
            f"{topic} distributed system architecture high level design",
            f"{topic} component topology service breakdown microservices",
            f"{topic} database schema data storage partitioning caching",
            f"{topic} high availability fault tolerance scaling observability"
        ]
    elif doc_type == "comparative_analysis":
        return [
            f"{topic} comparative analysis benchmark comparison evaluation",
            f"{topic} feature matrix head to head differences",
            f"{topic} latency throughput resource utilization trade-offs",
            f"{topic} pros cons operational complexity decision guide"
        ]
    elif doc_type == "executive_summary":
        return [
            f"{topic} executive whitepaper strategic overview enterprise impact",
            f"{topic} market drivers industry adoption cost ROI",
            f"{topic} core solution architecture governance security compliance",
            f"{topic} strategic roadmap implementation recommendations"
        ]
    elif doc_type == "literature_review":
        return [
            f"{topic} literature survey taxonomy seminal research papers",
            f"{topic} historical evolution foundational milestones",
            f"{topic} current methodologies comparative synthesis approaches",
            f"{topic} open challenges future research horizons survey"
        ]
    else:  # research_paper default
        return [
            f"{topic} literature review state of the art theoretical foundations",
            f"{topic} empirical methodology algorithmic design experiments",
            f"{topic} benchmark performance evaluation metrics comparative results",
            f"{topic} research challenges limitations open questions"
        ]

def run_planner(state: ResearchState) -> dict:
    """Agent 1: Planner Agent
    Decomposes complex research topics into 3–5 targeted search sub-queries tailored to the chosen document type.
    """
    raw_question = state.get("question", "")
    topic = clean_topic_prompt(raw_question)
    doc_type = state.get("doc_type", "research_paper") or "research_paper"
    
    api_key = os.getenv("GROQ_API_KEY")
    env_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    models_to_try = [env_model] + [m for m in FALLBACK_MODELS if m != env_model]
    
    default_queries = get_default_queries_by_type(topic, doc_type)

    if not api_key or api_key == "demo":
        return {
            "plan": f"Decompose {doc_type.replace('_', ' ')} for '{topic}' into targeted search sub-queries.",
            "search_queries": default_queries,
            "status": "planned"
        }

    prompt = f"""You are a senior Research Planner AI.
The user wants to generate a document of type: "{doc_type.replace('_', ' ').upper()}".
Analyze the target topic below and create a strategic research breakdown. Generate 4 targeted, highly specific web search queries focusing specifically on the requirements of this document type ({doc_type}).

Target Topic: "{topic}"
Document Type: "{doc_type}"

Respond strictly in JSON format with two keys:
"plan": "Detailed strategy breakdown for researching {topic} as a {doc_type}",
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
                "plan": data.get("plan", f"Research breakdown for {topic} ({doc_type})."),
                "search_queries": queries,
                "status": "planned"
            }
        except Exception as e:
            print(f"[Planner Agent] Model {model_name} error: {e}. Trying fallback...")
            continue

    return {
        "plan": f"Decompose {doc_type.replace('_', ' ')} for '{topic}' into targeted sub-queries.",
        "search_queries": default_queries,
        "status": "planned"
    }
