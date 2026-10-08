import os
from langchain_groq import ChatGroq
from agents.types import ResearchState
from agents.planner import clean_topic_prompt

FALLBACK_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b"
]

def clean_snippet(text: str, max_chars: int = 650) -> str:
    """Cleanly truncates snippets at full sentence boundaries to prevent cutoffs."""
    if not text:
        return ""
    text = text.strip()
    if len(text) <= max_chars:
        return text
    truncated = text[:max_chars]
    last_punct = max(truncated.rfind('. '), truncated.rfind('.\n'), truncated.rfind('! '), truncated.rfind('? '))
    if last_punct > 150:
        return truncated[:last_punct + 1].strip()
    return truncated.rsplit(' ', 1)[0].strip() + "."

def generate_topic_report(topic: str, doc_type: str, plan: str, insights: list, context_items: list) -> str:
    """Generates a dynamic, topic-focused report tailored to the selected document type when API fallback occurs."""
    insights_str = "\n".join([f"- **{ins}**" for ins in insights]) if insights else f"- **Key Strategy:** Structured technical approach to {topic}."
    context_text = "\n\n".join([item for item in context_items[:3]]) if context_items else f"Literature and engineering guides for {topic}."

    if doc_type == "technical_approach":
        return f"""# Technical Overview & Implementation: {topic}

## Executive Summary & Objectives
This document establishes the comprehensive technical approach and engineering architecture for **{topic}**. The primary objective is to define a scalable, maintainable, and robust deployment strategy.

## Non-Goals & Scope Boundaries
- Out-of-scope third-party integrations outside core runtime requirements.
- Legacy hardware support without containerized environment guarantees.

## System Architecture & Technical Overview
Developing technical systems for **{topic}** requires a clear architectural foundation encompassing interface handling, service configuration, and isolated state storage.

### Core Architectural Principles:
- **Service Isolation:** Running modular microservices with defined interface boundaries.
- **Environment Parity:** Ensuring reproducible runtime parameters across local and cloud environments.
- **Observability:** Centralized structured telemetry and health-check diagnostics.

## Data Flow & Core Protocols
{context_text}

## Comparative Analysis & Trade-offs
{insights_str}

## Security, Isolation & Failure Modes
- Enforcing least-privilege credentials and boundary verification.
- Automated failover and circuit breaker mechanisms for downstream dependencies.

## Implementation Milestones & Deployment Plan
1. **Phase 1:** Core runtime setup, foundational schemas, and environment configuration.
2. **Phase 2:** Service wiring, automated testing, and performance benchmark validation.
3. **Phase 3:** Production hardening, telemetry alerts, and documentation sign-off.
"""
    elif doc_type == "system_design":
        return f"""# System Architecture Blueprint: {topic}

## Architectural Overview & High-Level Design
This specification provides an enterprise-grade architectural blueprint for **{topic}**, addressing scalability, data consistency, fault tolerance, and service discovery.

## Component Topology & Service Breakdown
The topology incorporates an API Gateway layer, distributed message brokers, stateful storage engines, and isolated compute workers.

## Data Models & Storage Strategies
{context_text}

## Reliability, Concurrency & High Availability
{insights_str}

## Observability, Metrics & Telemetry
System telemetry leverages distributed tracing, prometheus-compatible metric scrapers, and automated threshold alerts.
"""
    elif doc_type == "comparative_analysis":
        return f"""# Comparative Technical Analysis: {topic}

## Evaluation Scope & Criteria
This comparative evaluation provides a quantitative and architectural trade-off analysis regarding **{topic}**. Criteria include latency, throughput, implementation complexity, and ecosystem maturity.

## Head-to-Head Architectural Comparison
Key architectures differ in state management, memory overhead, and decoupling strategies.

## Feature Matrix & Benchmark Evaluation
| Feature / Metric | Primary Approach | Alternative Approach |
|---|---|---|
| Latency Overhead | Low | Moderate |
| Scalability Limit | Horizontal Clustering | Vertical Scaling |
| Operational Complexity | Minimal Configuration | Dedicated Cluster Management |

## Performance, Latency & Resource Utilization Trade-offs
{insights_str}

## Decision Matrix & Recommendations
{context_text}
"""
    elif doc_type == "executive_summary":
        return f"""# Strategic Technical Whitepaper: {topic}

## Executive Briefing & Context
This executive whitepaper synthesizes the technological impact and strategic value of **{topic}** for enterprise leadership and engineering executives.

## Market Drivers & Industry Challenges
{context_text}

## Core Solution Architecture
Implementing a disciplined strategy for **{topic}** mitigates architectural drift, enhances developer velocity, and establishes high organizational resilience.

## Business Value, Efficiency & ROI Analysis
{insights_str}

## Strategic Roadmap & Executive Recommendations
Prioritize incremental phased adoption, automated governance, and cross-functional team alignment to maximize ROI.
"""
    elif doc_type == "literature_review":
        return f"""# Literature Review & State-of-the-Art Survey: {topic}

## Survey Scope & Taxonomic Overview
This academic survey reviews foundational literature, historical milestones, and state-of-the-art developments regarding **{topic}**.

## Historical Evolution & Foundational Milestones
{context_text}

## Comprehensive Analysis of Existing Approaches
{insights_str}

## Open Challenges, Gaps & Future Horizons
Significant research opportunities remain in automated verification, low-latency execution, and cross-domain generalization.
"""
    else:  # research_paper default
        return f"""# Research Paper: {topic}

## Abstract
This paper presents an in-depth empirical investigation regarding **{topic}**. By analyzing algorithmic methodologies, theoretical frameworks, and experimental findings, we formulate a principled approach to solving critical challenges in this domain.

## Introduction & Problem Formulation
Recent developments in computing have underscored the importance of **{topic}**. This paper details the problem formulation, theoretical constraints, and objective functions governing optimal solutions.

## System Architecture & Technical Overview
The system architecture synthesizes state-of-the-art methodology, structured data pipelines, and rigorous empirical validation protocols.

## Experimental Analysis & Key Findings
{context_text}

## Comparative Discussion & Insights
{insights_str}

## Conclusion & Future Directions
Our findings validate the efficacy of the proposed methodology for **{topic}**. Future research will investigate broader generalization, adversarial robustness, and edge optimization.
"""

def get_format_prompt_for_type(doc_type: str, topic: str) -> str:
    """Returns tailored Markdown format instructions matching the selected document type."""
    if doc_type == "technical_approach":
        return f"""Required Paper Format:
# Technical Overview & Implementation: {topic}

## Executive Summary & Objectives
(Define what {topic} is, engineering goals, and key objectives)

## Non-Goals & Scope Boundaries
(Specify what is intentionally excluded from the implementation scope)

## System Architecture & Technical Overview
(Detail the technical architecture, component interactions, setup guidelines, and infrastructure patterns for {topic})

## Data Flow & Core Protocols
(Explain the step-by-step data lifecycle and protocol interactions)

## Comparative Analysis & Trade-offs
(Provide 3-4 structured analytical insights and trade-off comparisons regarding {topic})

## Security, Isolation & Failure Modes
(Detail threat models, recovery strategies, and security guarantees)

## Implementation Milestones & Deployment Plan
(List phased delivery milestones and production release runbook)
"""
    elif doc_type == "system_design":
        return f"""Required Paper Format:
# System Architecture Blueprint: {topic}

## Architectural Overview & High-Level Design
(Provide architectural vision, system goals, and high-level structure for {topic})

## System Architecture & Technical Overview
(Detail component topology, service breakdown, microservices boundaries, and interactions)

## Data Models & Storage Strategies
(Describe database schemas, caching, consistency models, and partition strategies)

## Reliability, Concurrency & High Availability
(Address failover, circuit breaking, horizontal scaling, and zero-downtime requirements)

## Observability, Metrics & Telemetry
(Define logging, distributed tracing, alerting, and operational dashboards)
"""
    elif doc_type == "comparative_analysis":
        return f"""Required Paper Format:
# Comparative Technical Analysis: {topic}

## Evaluation Scope & Criteria
(Define benchmark parameters, evaluation dimensions, and testing environment)

## Head-to-Head Architectural Comparison
(Detail the fundamental structural and philosophical differences)

## Feature Matrix & Benchmark Evaluation
(Include a formatted Markdown comparison table evaluating key metrics)

## System Architecture & Technical Overview
(Provide architectural breakdown of each compared approach)

## Performance, Latency & Resource Utilization Trade-offs
(Discuss speed, memory, cost, and operational complexity trade-offs)

## Decision Matrix & Recommendations
(Provide concrete decision guidelines on when to choose each approach)
"""
    elif doc_type == "executive_summary":
        return f"""Required Paper Format:
# Strategic Technical Whitepaper: {topic}

## Executive Briefing & Context
(High-level summary of {topic} for CTOs, architects, and decision-makers)

## Market Drivers & Industry Challenges
(Explain why this technology matters today and what challenges it addresses)

## System Architecture & Technical Overview
(Executive-level architectural overview and foundational tenets)

## Business Value, Efficiency & ROI Analysis
(Quantifiable advantages, developer productivity, and cost implications)

## Strategic Roadmap & Executive Recommendations
(Strategic adoption phases, governance, and organizational recommendations)
"""
    elif doc_type == "literature_review":
        return f"""Required Paper Format:
# Literature Review & State-of-the-Art Survey: {topic}

## Survey Scope & Taxonomic Overview
(Define scope, categorization taxonomy, and survey methodology for {topic})

## Historical Evolution & Foundational Milestones
(Trace historical progression and seminal breakthrough publications)

## System Architecture & Technical Overview
(Synthesize architectural paradigms across the surveyed literature)

## Comparative Methodology Synthesis
(Synthesize findings, comparative tables, and consensus techniques)

## Open Challenges, Gaps & Future Horizons
(Highlight unanswered questions, limitations, and future research directions)
"""
    else:  # research_paper default
        return f"""Required Paper Format:
# Research Paper: {topic}

## Abstract
(Dense academic summary: context, methodology, experimental findings, conclusion)

## Introduction & Problem Formulation
(Theoretical background, motivation, formal problem formulation, and paper contributions)

## Related Work & Literature Review
(Discussion of prior academic work and limitations of existing approaches)

## System Architecture & Technical Overview
(Detail the formal methodology, algorithmic models, and mathematical formulation)

## Experimental Analysis & Key Findings
(Synthesize empirical results, metrics, benchmarks, and statistical observations)

## Comparative Discussion & Insights
(Provide 3-4 structured analytical insights regarding {topic})

## Conclusion & Future Directions
(Summarize findings and outline future scientific research directions)
"""

def run_writer(state: ResearchState) -> dict:
    """Agent 7: Writer Agent
    Drafts academic papers or technical specifications customized to the selected document type.
    """
    raw_question = state.get("question", "")
    topic = clean_topic_prompt(raw_question)
    plan = state.get("plan", "")
    insights = state.get("insights", [])
    retrieved_context = state.get("retrieved_context", [])
    doc_type = state.get("doc_type", "research_paper") or "research_paper"
    
    api_key = os.getenv("GROQ_API_KEY")
    env_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    models_to_try = [env_model] + [m for m in FALLBACK_MODELS if m != env_model]

    context_items = []
    for r in retrieved_context[:4]:
        title = r.get("title", "Web Source")
        url = r.get("url", "")
        raw_content = r.get("text", "")
        content_snippet = clean_snippet(raw_content, max_chars=650)
        context_items.append(f"Source: [{title}]({url})\nSnippet: {content_snippet}")

    context_str = "\n\n".join(context_items)
    insights_str = "\n".join([f"- {ins}" for ins in insights])

    format_prompt = get_format_prompt_for_type(doc_type, topic)

    prompt = f"""You are a professional Technical Writer & Research Analyst.
Write a comprehensive, publication-grade document in Markdown specifically for the topic and document type specified below.

Target Topic: "{topic}"
Document Type: "{doc_type.replace('_', ' ').upper()}"
Research Plan: "{plan}"

Synthesized Insights:
{insights_str}

Technical Evidence:
{context_str}

{format_prompt}

Strict Rules:
- Write EVERY section specifically focused on "{topic}". Do NOT use generic placeholder templates.
- Ensure the document strictly adheres to the requested document type ({doc_type}).
- Complete every sentence cleanly with proper terminal punctuation.
"""

    if not api_key or api_key == "demo":
        fallback_rep = generate_topic_report(topic, doc_type, plan, insights, context_items)
        return {
            "draft_report": fallback_rep,
            "report": fallback_rep,
            "status": "written"
        }

    for model_name in models_to_try:
        try:
            llm = ChatGroq(
                model=model_name,
                groq_api_key=api_key,
                temperature=0.3,
                max_tokens=850
            )
            response = llm.invoke(prompt)
            content = str(response.content).strip()
            if content and "429" not in content and "error" not in content.lower()[:50]:
                return {
                    "draft_report": content,
                    "report": content,
                    "status": "written"
                }
        except Exception as e:
            print(f"[Writer Agent] Model {model_name} failed: {e}. Trying fallback...")
            continue

    fallback_rep = generate_topic_report(topic, doc_type, plan, insights, context_items)
    return {
        "draft_report": fallback_rep,
        "report": fallback_rep,
        "status": "written"
    }
