import os
from agents.types import ResearchState
from agents.planner import clean_topic_prompt

def generate_mermaid_diagram(topic: str, doc_type: str = "research_paper") -> str:
    """Generates an interactive horizontal Mermaid.js diagram tailored to the document objective."""
    short_topic = topic[:28]

    if doc_type == "comparative_analysis":
        return f"""```mermaid
graph LR
    Input["Evaluation Topic: {short_topic}"] --> Matrix["Comparative Benchmark Engine"]
    Matrix --> OptionA["Primary Approach Architecture"]
    Matrix --> OptionB["Alternative / Baseline Approach"]
    OptionA --> Tradeoffs["Latency & Throughput Trade-offs"]
    OptionB --> Tradeoffs
    Tradeoffs --> Decision["Decision Matrix & Guidelines"]
```"""
    elif doc_type == "executive_summary":
        return f"""```mermaid
graph LR
    Drivers["Market & Business Drivers"] --> Strategy["Executive Strategy: {short_topic}"]
    Strategy --> Core["Core Solution Architecture"]
    Core --> Governance["Governance & Security Perimeter"]
    Governance --> Value["Enterprise ROI & Velocity Impact"]
```"""
    elif doc_type == "literature_review":
        return f"""```mermaid
graph LR
    Taxonomy["Survey Scope: {short_topic}"] --> Foundations["Foundational Research Literature"]
    Foundations --> Modern["State-of-the-Art Methodologies"]
    Modern --> Synthesis["Comparative Synthesis & Benchmarks"]
    Synthesis --> Gaps["Identified Research Gaps & Horizons"]
```"""
    else:
        return f"""```mermaid
graph LR
    Client["User / Client Interface"] --> Router["API Gateway / Router"]
    Router --> Service["Core Service Component: {short_topic}"]
    Service --> Storage["Local State / Storage Engine"]
    Service --> Security["Security & Origin Verification"]
```"""

def run_diagram(state: ResearchState) -> dict:
    """Agent 10: Diagram Agent
    Extracts system components and generates interactive Mermaid.js diagrams embedded into the appropriate section.
    """
    cited_report = state.get("cited_report", "")
    raw_question = state.get("question", "")
    topic = clean_topic_prompt(raw_question)
    doc_type = state.get("doc_type", "research_paper") or "research_paper"
    
    diagram_code = generate_mermaid_diagram(topic, doc_type)

    # Candidate sections where the diagram should be embedded
    candidate_sections = [
        "## System Architecture & Technical Overview",
        "## Methodology & System Architecture",
        "## Core Solution Architecture",
        "## Head-to-Head Architectural Comparison",
        "## Component Topology & Service Breakdown",
        "## Comprehensive Analysis of Existing Approaches"
    ]

    final_report = None
    for section_header in candidate_sections:
        if section_header in cited_report:
            parts = cited_report.split(section_header, 1)
            updated_section = f"\n{section_header}\n\n{diagram_code}\n\n" + parts[1].lstrip()
            final_report = parts[0] + updated_section
            break

    if not final_report:
        final_report = cited_report + f"\n\n## System Architecture Diagram\n\n{diagram_code}\n"

    return {
        "mermaid_diagram": diagram_code,
        "report": final_report,
        "status": "completed"
    }
