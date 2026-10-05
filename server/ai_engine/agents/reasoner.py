import os
import json
from langchain_groq import ChatGroq
from agents.types import ResearchState
from agents.planner import clean_topic_prompt

FALLBACK_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b"
]

def run_reasoner(state: ResearchState) -> dict:
    """Agent 6: Reasoner Agent
    Synthesizes structured insights, key findings, and technical arguments from vector RAG context.
    """
    raw_question = state.get("question", "")
    topic = clean_topic_prompt(raw_question)
    plan = state.get("plan", "")
    retrieved_context = state.get("retrieved_context", [])

    api_key = os.getenv("GROQ_API_KEY")
    env_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    models_to_try = [env_model] + [m for m in FALLBACK_MODELS if m != env_model]

    context_snippets = "\n".join([f"- {c.get('text', '')[:300]}" for c in retrieved_context[:4]])

    default_insights = [
        f"Implementing {topic} requires robust local loopback network binding (127.0.0.1 / ::1), port isolation, and environment configuration management.",
        f"Local development workflows benefit significantly from containerized service orchestration (Docker Compose) to mirror production database and proxy behaviors.",
        f"Security and CORS origin controls must be explicitly configured when hosting local development servers to prevent unauthorized cross-site requests."
    ]

    if not api_key or api_key == "demo":
        return {
            "insights": default_insights,
            "status": "reasoned"
        }

    prompt = f"""You are an Expert AI Technical Reasoner.
Analyze the target topic and retrieved context below to synthesize 3 key structured analytical insights and architectural arguments specifically for this topic.

Target Topic: "{topic}"
Research Strategy: "{plan}"
Retrieved Technical Evidence:
{context_snippets}

Respond strictly in JSON format with key:
"insights": ["insight 1 specifically about {topic}", "insight 2 specifically about {topic}", "insight 3 specifically about {topic}"]
"""

    for model_name in models_to_try:
        try:
            llm = ChatGroq(
                model=model_name,
                groq_api_key=api_key,
                temperature=0.2,
                max_tokens=500
            )
            response = llm.invoke(prompt)
            content = str(response.content).strip()

            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]).strip()
                if content.startswith("json"):
                    content = content[4:].strip()

            data = json.loads(content)
            insights = data.get("insights", default_insights)
            if not isinstance(insights, list) or len(insights) == 0:
                insights = default_insights

            return {
                "insights": insights,
                "status": "reasoned"
            }
        except Exception as e:
            print(f"[Reasoner Agent] Model {model_name} error: {e}. Trying fallback...")
            continue

    return {
        "insights": default_insights,
        "status": "reasoned"
    }
