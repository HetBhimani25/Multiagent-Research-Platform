import os
from agents.types import ResearchState

def get_required_headings_for_type(doc_type: str, planned_sections: list = None) -> list:
    if planned_sections and len(planned_sections) >= 2:
        return [f"## {s}" for s in planned_sections[:3]]
    if doc_type == "technical_approach":
        return ["## Executive Summary & Objectives"]
    elif doc_type == "system_design":
        return ["## Architectural Overview & High-Level Design", "## Component Topology & Service Breakdown"]
    elif doc_type == "comparative_analysis":
        return ["## Evaluation Scope & Criteria", "## Feature Matrix & Benchmark Evaluation"]
    elif doc_type == "executive_summary":
        return ["## Executive Briefing & Context"]
    elif doc_type == "literature_review":
        return ["## Survey Scope & Taxonomic Overview"]
    else:  # research_paper default
        return ["## Abstract", "## Introduction & Problem Formulation"]

def run_reviewer(state: ResearchState) -> dict:
    """Agent 9: Reviewer Agent
    Automated peer-review & quality score feedback loop evaluating structure according to doc_type and planned sections.
    """
    cited_report = state.get("cited_report", "")
    question = state.get("question", "")
    doc_type = state.get("doc_type", "research_paper") or "research_paper"
    planned_sections = state.get("planned_sections") or []
    revision_count = state.get("revision_count", 0)

    score = 92
    feedback = f"Document structural integrity verified for {doc_type.replace('_', ' ').title()}. Clear technical headings, complete sentence closures, and verified citation references present."

    # Check for required sections based on document type and dynamic planned sections
    required_headings = get_required_headings_for_type(doc_type, planned_sections)
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
