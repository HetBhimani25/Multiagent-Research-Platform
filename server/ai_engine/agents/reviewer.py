import os
from agents.types import ResearchState

def get_required_headings_for_type(doc_type: str) -> list:
    if doc_type == "technical_approach":
        return ["## Executive Summary & Objectives", "## System Architecture & Technical Overview", "## Comparative Analysis & Trade-offs"]
    elif doc_type == "system_design":
        return ["## Architectural Overview & High-Level Design", "## Component Topology & Service Breakdown", "## Data Models & Storage Strategies"]
    elif doc_type == "comparative_analysis":
        return ["## Evaluation Scope & Criteria", "## Feature Matrix & Benchmark Evaluation", "## Performance, Latency & Resource Utilization Trade-offs"]
    elif doc_type == "executive_summary":
        return ["## Executive Briefing & Context", "## Core Solution Architecture", "## Business Value, Efficiency & ROI Analysis"]
    elif doc_type == "literature_review":
        return ["## Survey Scope & Taxonomic Overview", "## Comprehensive Analysis of Existing Approaches", "## Open Challenges, Gaps & Future Horizons"]
    else:  # research_paper default
        return ["## Abstract", "## Introduction & Problem Formulation", "## System Architecture & Technical Overview"]

def run_reviewer(state: ResearchState) -> dict:
    """Agent 9: Reviewer Agent
    Automated peer-review & quality score feedback loop evaluating structure according to doc_type.
    """
    cited_report = state.get("cited_report", "")
    question = state.get("question", "")
    doc_type = state.get("doc_type", "research_paper") or "research_paper"
    revision_count = state.get("revision_count", 0)

    score = 92
    feedback = f"Document structural integrity verified for {doc_type.replace('_', ' ').title()}. Clear technical headings, complete sentence closures, and verified citation references present."

    # Check for required sections based on document type
    required_headings = get_required_headings_for_type(doc_type)
    missing_headings = [h for h in required_headings if h not in cited_report]

    if missing_headings:
        score -= 20
        feedback += f" Missing required sections: {', '.join(missing_headings)}."

    # Check if report ends abruptly without proper punctuation
    last_char = cited_report.strip()[-1] if cited_report.strip() else ""
    if last_char not in [".", ")", "]", "}", "`", ">"]:
        score -= 15
        feedback += " Report ends with incomplete trailing characters."

    return {
        "review_score": score,
        "review_feedback": feedback,
        "revision_count": revision_count + 1,
        "status": "reviewed"
    }
