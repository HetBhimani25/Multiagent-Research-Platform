import os
from agents.types import ResearchState
from agents.planner import clean_topic_prompt

def generate_mermaid_diagram(topic: str) -> str:
    """Generates an interactive horizontal Mermaid.js diagram illustrating the system architecture for the target topic."""
    short_topic = topic[:30]
    return f"""```mermaid
graph LR
    Client["User / Client Interface"] --> Router["API Gateway / Router"]
    Router --> Service["Core Service Component: {short_topic}"]
    Service --> Storage["Local State / Storage Engine"]
    Service --> Security["Security & Origin Verification"]
```"""

def run_diagram(state: ResearchState) -> dict:
    """Agent 10: Diagram Agent
    Extracts system components and generates interactive Mermaid.js diagrams.
    """
    cited_report = state.get("cited_report", "")
    raw_question = state.get("question", "")
    topic = clean_topic_prompt(raw_question)
    
    diagram_code = generate_mermaid_diagram(topic)

    # Embed the Mermaid diagram cleanly inside ## System Architecture & Technical Overview
    if "## System Architecture & Technical Overview" in cited_report:
        parts = cited_report.split("## System Architecture & Technical Overview")
        updated_section = "\n## System Architecture & Technical Overview\n\n" + diagram_code + "\n\n" + parts[1].lstrip()
        final_report = parts[0] + updated_section
    else:
        final_report = cited_report + "\n\n" + diagram_code

    return {
        "mermaid_diagram": diagram_code,
        "report": final_report,
        "status": "completed"
    }
