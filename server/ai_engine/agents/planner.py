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
    """Strips conversational wrappers and meta-instructions (e.g. 'I want a technical approach on...') to extract pure research topics."""
    if not raw_prompt:
        return "Software Architecture & Infrastructure"
    
    clean = raw_prompt.strip()
    prefixes_to_strip = [
        r"^i\s+want\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s+(on|for|about)?\s*",
        r"^i\s+need\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s+(on|for|about)?\s*",
        r"^(can|could)\s+you\s+(please\s+)?(write|give|provide|create|generate|prepare)\s+(me\s+)?(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s+(on|for|about)?\s*",
        r"^please\s+(write|give|provide|create|generate|prepare)\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s+(on|for|about)?\s*",
        r"^give\s+me\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s+(on|for|about)?\s*",
        r"^provide\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s+(on|for|about)?\s*",
        r"^create\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s+(on|for|about)?\s*",
        r"^generate\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s+(on|for|about)?\s*",
        r"^write\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s+(on|for|about)?\s*",
        r"^tell\s+me\s+about\s+",
        r"^explain\s+(to\s+me\s+)?",
        r"^research\s+(on|about)?\s*",
        r"^(build|draft)\s+a\s+(plan|report|approach)\s+(for|on)\s*"
    ]
    for pattern in prefixes_to_strip:
        clean = re.sub(pattern, "", clean, flags=re.IGNORECASE).strip()
    
    clean = clean.strip('"').strip("'").strip()
    return clean if clean else raw_prompt

def get_intelligent_plan(topic: str, doc_type: str) -> dict:
    """Intelligently plans document sections, search queries, and diagram/flowchart requirements based on domain and doc_type."""
    topic_lower = topic.lower()

    # Domain 1: Exploratory Data Analysis / Data Science / Analytics
    if any(k in topic_lower for k in ["exploratory data analysis", "eda process", "data analysis", "data cleaning", "feature engineering", "data profiling", "pandas", "dataset"]):
        return {
            "plan": f"Execute end-to-end research for an Exploratory Data Analysis (EDA) framework on '{topic}', focusing on ingestion, profiling, anomaly detection, and multivariate feature relationships.",
            "search_queries": [
                f"{topic} exploratory data analysis pipeline methodology",
                f"{topic} data profiling missing values outlier detection statistical techniques",
                f"{topic} feature correlation distribution analysis best practices",
                f"{topic} data science preprocessing validation protocols"
            ],
            "diagram_required": True,
            "diagram_plan": [
                {
                    "title": "Exploratory Data Analysis (EDA) Workflow Pipeline",
                    "type": "flowchart",
                    "orientation": "vertical",
                    "target_section": "Data Profiling & Quality Assessment Pipeline",
                    "description": "Raw Data Ingestion -> Automated Schema Validation -> Missing & Outlier Treatment -> Statistical Distribution Analysis -> Multivariate Correlation -> Actionable Insights"
                }
            ],
            "planned_sections": [
                "Executive Summary & Objectives",
                "Data Ingestion & Schema Verification",
                "Data Profiling & Quality Assessment Pipeline",
                "Statistical Distribution & Anomaly Treatment",
                "Multivariate Correlation & Feature Interactions",
                "Actionable Deliverables & Downstream Modeling Guidelines"
            ]
        }

    # Domain 2: Semiconductor / VLSI / Electronic Design Automation (EDA in chip design)
    if any(k in topic_lower for k in ["semiconductor", "vlsi", "rtl", "gdsii", "physical design", "asic", "fpga", "cadence", "synopsys"]):
        return {
            "plan": f"Formulate a technical semiconductor EDA implementation plan for '{topic}', detailing logic synthesis, physical layout, clock tree synthesis, and DRC/LVS sign-off.",
            "search_queries": [
                f"{topic} electronic design automation RTL to GDSII flow",
                f"{topic} logic synthesis floorplanning placement routing PDK",
                f"{topic} clock tree synthesis timing closure DRC LVS signoff",
                f"{topic} semiconductor design verification manufacturing tapeout"
            ],
            "diagram_required": True,
            "diagram_plan": [
                {
                    "title": "RTL-to-GDSII Electronic Design Automation Flow",
                    "type": "flowchart",
                    "orientation": "vertical",
                    "target_section": "Physical Design & Synthesis Workflow",
                    "description": "RTL Logic Specification -> Logic Synthesis -> Floorplanning & Power Mesh -> Placement & Clock Tree Synthesis -> Global & Detailed Routing -> Physical Verification DRC/LVS -> GDSII Tapeout"
                }
            ],
            "planned_sections": [
                "Executive Summary & Objectives",
                "Design Scope & PDK Constraints",
                "Physical Design & Synthesis Workflow",
                "Clock Tree Synthesis & Timing Closure",
                "Design Rule Checking & Verification Protocols",
                "Tapeout Milestones & Sign-off Checklist"
            ]
        }

    # Domain 3: System Design / Distributed Systems
    if doc_type == "system_design" or any(k in topic_lower for k in ["system design", "distributed system", "microservices", "high level design", "kafka", "scalability", "database topology", "pgvector"]):
        return {
            "plan": f"Architect a distributed, fault-tolerant system design blueprint for '{topic}', covering microservices topology, storage partitioning, and high-availability concurrency.",
            "search_queries": [
                f"{topic} distributed system architecture high level design",
                f"{topic} component topology service breakdown microservices",
                f"{topic} database schema data storage partitioning caching",
                f"{topic} high availability fault tolerance scaling observability"
            ],
            "diagram_required": True,
            "diagram_plan": [
                {
                    "title": f"{topic} Multi-Tier Architecture & Topology Flow",
                    "type": "architecture",
                    "orientation": "combination",
                    "target_section": "Component Topology & Service Breakdown",
                    "description": "Multi-tier architecture: Ingress Client Tier -> Gateway & Auth Layer -> Query Routing & Service Cluster -> Distributed Storage & Vector Cache Tier"
                }
            ],
            "planned_sections": [
                "High-Level Architectural Overview",
                "Component Topology & Service Breakdown",
                "Data Storage, Partitioning & Consistency Models",
                "Scalability, Concurrency & Fault Tolerance",
                "Observability, Telemetry & Disaster Recovery"
            ]
        }

    # Domain 4: CI/CD / DevOps / Cloud Deployment
    if any(k in topic_lower for k in ["ci/cd", "deployment", "pipeline", "docker", "kubernetes", "devops", "cloud deployment"]):
        return {
            "plan": f"Establish automated CI/CD and deployment engineering guidelines for '{topic}', detailing build verification, container orchestration, and canary release strategies.",
            "search_queries": [
                f"{topic} automated CI/CD pipeline deployment architecture",
                f"{topic} container build testing staging canary release",
                f"{topic} infrastructure as code security scanning Kubernetes",
                f"{topic} rollback strategies observability operational runbook"
            ],
            "diagram_required": True,
            "diagram_plan": [
                {
                    "title": "Automated Build, Test & Deployment Pipeline",
                    "type": "flowchart",
                    "orientation": "vertical",
                    "target_section": "CI/CD Pipeline Architecture & Automation",
                    "description": "Source Control Commit -> Static Code Analysis -> Container Build -> Integration Tests -> Canary Deployment -> Production Monitoring"
                }
            ],
            "planned_sections": [
                "Executive Summary & Objectives",
                "Infrastructure & Environment Prerequisites",
                "CI/CD Pipeline Architecture & Automation",
                "Security Scanning & Artifact Verification",
                "Deployment Strategies & Rollback Protocols",
                "Release Milestones & Operational Runbook"
            ]
        }

    # Domain 5: Security / Authentication / Zero Trust
    if any(k in topic_lower for k in ["security", "zero trust", "authentication", "authorization", "oauth", "mtls", "cryptography"]):
        return {
            "plan": f"Formulate a zero-trust security specification for '{topic}', focusing on identity verification, policy enforcement, encrypted transport, and audit telemetry.",
            "search_queries": [
                f"{topic} zero trust security architecture authentication",
                f"{topic} policy enforcement decision point identity provider",
                f"{topic} transport encryption cryptographic key management",
                f"{topic} threat model incident response audit compliance"
            ],
            "diagram_required": True,
            "diagram_plan": [
                {
                    "title": "Zero-Trust Security & Authentication Architecture",
                    "type": "architecture",
                    "orientation": "combination",
                    "target_section": "Security Architecture & Policy Enforcement",
                    "description": "Client Device -> Identity Verification -> Policy Decision Engine -> Gateway Proxy -> Secure Enclave"
                }
            ],
            "planned_sections": [
                "Security Governance & Threat Model",
                "Identity & Access Management Protocols",
                "Security Architecture & Policy Enforcement",
                "Cryptographic Standards & Transport Encryption",
                "Incident Response & Audit Telemetry"
            ]
        }

    # Default by Document Type:
    if doc_type == "comparative_analysis":
        return {
            "plan": f"Execute comparative benchmark evaluation for '{topic}', examining trade-offs, performance metrics, and architectural divergence.",
            "search_queries": [
                f"{topic} comparative analysis benchmark comparison evaluation",
                f"{topic} feature matrix head to head differences",
                f"{topic} latency throughput resource utilization trade-offs",
                f"{topic} pros cons operational complexity decision guide"
            ],
            "diagram_required": True,
            "diagram_plan": [
                {
                    "title": f"Comparative Decision Flow & Trade-Off Matrix: {topic}",
                    "type": "flowchart",
                    "orientation": "combination",
                    "target_section": "Architectural Evaluation & Decision Framework",
                    "description": "Evaluation Ingestion -> Feature Comparison Engine -> Latency & Throughput Trade-offs -> Decision Matrix"
                }
            ],
            "planned_sections": [
                "Evaluation Scope & Benchmark Parameters",
                "Architectural Evaluation & Decision Framework",
                "Feature Matrix & Empirical Benchmarks",
                "Throughput, Latency & Resource Utilization",
                "Strategic Recommendations & Decision Guide"
            ]
        }
    elif doc_type == "executive_summary":
        return {
            "plan": f"Synthesize strategic executive whitepaper for '{topic}', analyzing market impact, ROI, solution architecture, and leadership roadmap.",
            "search_queries": [
                f"{topic} executive whitepaper strategic overview enterprise impact",
                f"{topic} market drivers industry adoption cost ROI",
                f"{topic} core solution architecture governance security compliance",
                f"{topic} strategic roadmap implementation recommendations"
            ],
            "diagram_required": True,
            "diagram_plan": [
                {
                    "title": "Enterprise Strategic Architecture & Value Delivery Flow",
                    "type": "flowchart",
                    "orientation": "combination",
                    "target_section": "Strategic Solution Architecture",
                    "description": "Market Drivers -> Enterprise Strategy -> Core Solution -> Value Delivery"
                }
            ],
            "planned_sections": [
                "Executive Briefing & Strategic Context",
                "Market Drivers & Economic Rationale",
                "Strategic Solution Architecture",
                "Business Impact, ROI & Risk Mitigation",
                "Organizational Roadmap & Phased Rollout"
            ]
        }
    elif doc_type == "literature_review":
        return {
            "plan": f"Conduct exhaustive state-of-the-art taxonomic survey on '{topic}', tracking historical milestones, seminal methodologies, and open horizons.",
            "search_queries": [
                f"{topic} literature survey taxonomy seminal research papers",
                f"{topic} historical evolution foundational milestones",
                f"{topic} current methodologies comparative synthesis approaches",
                f"{topic} open challenges future research horizons survey"
            ],
            "diagram_required": True,
            "diagram_plan": [
                {
                    "title": "Taxonomic Survey & Research Milestones Flowchart",
                    "type": "flowchart",
                    "orientation": "vertical",
                    "target_section": "Taxonomic Synthesis & Theoretical Framework",
                    "description": "Foundational Milestones -> Methodological Divergence -> State-of-the-Art Synthesis -> Open Challenges"
                }
            ],
            "planned_sections": [
                "Survey Scope & Taxonomic Overview",
                "Historical Evolution & Foundational Milestones",
                "Taxonomic Synthesis & Theoretical Framework",
                "Empirical Benchmarks Across Seminal Works",
                "Open Research Gaps & Future Trajectories"
            ]
        }
    elif doc_type == "technical_approach":
        return {
            "plan": f"Formulate comprehensive technical RFC approach for '{topic}', establishing architecture, implementation flow, and deployment guarantees.",
            "search_queries": [
                f"{topic} technical architecture implementation specification RFC",
                f"{topic} core protocols data flow component interactions",
                f"{topic} configuration deployment setup best practices",
                f"{topic} security isolation failure modes trade-offs"
            ],
            "diagram_required": True,
            "diagram_plan": [
                {
                    "title": f"Technical Implementation Flowchart: {topic}",
                    "type": "flowchart",
                    "orientation": "vertical",
                    "target_section": "Core Technical Methodology & Execution Flow",
                    "description": "Input Specifications -> Technical Processing Engine -> State Management -> Verification & Deployment"
                }
            ],
            "planned_sections": [
                "Executive Summary & Objectives",
                "Scope Boundaries & Non-Goals",
                "Core Technical Methodology & Execution Flow",
                "Data Lifecycle & Protocol Specifications",
                "Security, Resilience & Failure Modes",
                "Implementation Milestones & Deployment Plan"
            ]
        }
    else:  # research_paper default
        return {
            "plan": f"Conduct structured academic research on '{topic}', analyzing theoretical foundations, empirical results, and methodological pipeline.",
            "search_queries": [
                f"{topic} literature review state of the art theoretical foundations",
                f"{topic} empirical methodology algorithmic design experiments",
                f"{topic} benchmark performance evaluation metrics comparative results",
                f"{topic} research challenges limitations open questions"
            ],
            "diagram_required": True,
            "diagram_plan": [
                {
                    "title": "Methodological & Algorithmic Pipeline Architecture",
                    "type": "flowchart",
                    "orientation": "vertical",
                    "target_section": "Methodological Framework & System Design",
                    "description": "Problem Formulation -> Theoretical Model -> Algorithmic Pipeline -> Experimental Validation"
                }
            ],
            "planned_sections": [
                "Abstract",
                "Introduction & Problem Formulation",
                "Methodological Framework & System Design",
                "Empirical Evaluation & Performance Analysis",
                "Discussion, Limitations & Future Work"
            ]
        }

def get_default_queries_by_type(topic: str, doc_type: str) -> list:
    """Generates default search queries aligned with the selected document type objective."""
    return get_intelligent_plan(topic, doc_type)["search_queries"]

def run_planner(state: ResearchState) -> dict:
    """Agent 1: Planner Agent
    Intelligently determines diagram requirements, plans topic-specific sections, and decomposes research into targeted search queries.
    """
    raw_question = state.get("question", "")
    topic = clean_topic_prompt(raw_question)
    doc_type = state.get("doc_type", "research_paper") or "research_paper"
    
    api_key = os.getenv("GROQ_API_KEY")
    env_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    models_to_try = [env_model] + [m for m in FALLBACK_MODELS if m != env_model]
    
    fallback_plan_data = get_intelligent_plan(topic, doc_type)

    if not api_key or api_key == "demo":
        return {
            "plan": fallback_plan_data["plan"],
            "search_queries": fallback_plan_data["search_queries"],
            "diagram_required": fallback_plan_data["diagram_required"],
            "diagram_plan": fallback_plan_data["diagram_plan"],
            "planned_sections": fallback_plan_data["planned_sections"],
            "status": "planned"
        }

    prompt = f"""You are a Principal Technical Architect and Research Planner AI.
Target Topic: "{topic}"
Document Type: "{doc_type.replace('_', ' ').upper()}"

Your mission is to formulate an intelligent, tailored execution plan for this specific topic:
1. Determine if this topic and document type require technical flowcharts or architectural diagrams.
   - For 'system_design', diagrams are ALWAYS mandatory (e.g., component topology, microservices flow).
   - For 'technical_approach', process pipelines, data flow, or architecture diagrams are highly necessary.
   - For any topic involving processes, pipelines (like EDA, CI/CD), systems, or algorithms, set diagram_required to true.
2. If required, specify 1 or 2 relevant diagrams with:
   - "title": Professional Flowchart Title
   - "type": "flowchart" or "architecture"
   - "orientation": "vertical" (best for sequential pipelines like EDA/data pipelines/lifecycles), "combination" (for multi-tier architectures with subgraphs), or "horizontal" (for concise 3-4 node sequences)
   - "target_section": Target Section Title to embed into
   - "description": Sequence of nodes and flow
3. Plan 5 to 6 dynamic, professional, topic-specific section headings. CRITICAL: DO NOT use generic repetitive headings like 'System Architecture & Technical Overview' for everything. Tailor section names directly to the topic (e.g. for EDA: Data Profiling & Quality Assessment Pipeline; for semiconductor EDA: RTL-to-GDSII Physical Layout Flow).
4. Generate 4 targeted, highly specific web search queries.

Respond strictly in valid JSON format matching this schema:
{{
  "plan": "Strategic research plan...",
  "diagram_required": true,
  "diagram_plan": [
    {{
      "title": "Professional Flowchart Title",
      "type": "flowchart",
      "orientation": "vertical",
      "target_section": "Target Section Title",
      "description": "Sequence of nodes..."
    }}
  ],
  "planned_sections": ["Section 1", "Section 2", "Section 3", "Section 4", "Section 5"],
  "search_queries": ["query 1", "query 2", "query 3", "query 4"]
}}
"""

    for model_name in models_to_try:
        try:
            llm = ChatGroq(
                model=model_name,
                groq_api_key=api_key,
                temperature=0.2,
                max_tokens=600
            )
            response = llm.invoke(prompt)
            content = str(response.content).strip()
            
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]).strip()
                if content.startswith("json"):
                    content = content[4:].strip()
                
            data = json.loads(content)
            queries = data.get("search_queries", fallback_plan_data["search_queries"])
            if not isinstance(queries, list) or len(queries) < 2:
                queries = fallback_plan_data["search_queries"]

            diagram_required = data.get("diagram_required", fallback_plan_data["diagram_required"])
            diagram_plan = data.get("diagram_plan", fallback_plan_data["diagram_plan"])
            planned_sections = data.get("planned_sections", fallback_plan_data["planned_sections"])

            return {
                "plan": data.get("plan", fallback_plan_data["plan"]),
                "search_queries": queries,
                "diagram_required": bool(diagram_required),
                "diagram_plan": diagram_plan if isinstance(diagram_plan, list) else fallback_plan_data["diagram_plan"],
                "planned_sections": planned_sections if isinstance(planned_sections, list) else fallback_plan_data["planned_sections"],
                "status": "planned"
            }
        except Exception as e:
            print(f"[Planner Agent] Model {model_name} error: {e}. Trying fallback...")
            continue

    return {
        "plan": fallback_plan_data["plan"],
        "search_queries": fallback_plan_data["search_queries"],
        "diagram_required": fallback_plan_data["diagram_required"],
        "diagram_plan": fallback_plan_data["diagram_plan"],
        "planned_sections": fallback_plan_data["planned_sections"],
        "status": "planned"
    }
