import os
import re
import json
from langchain_groq import ChatGroq
from agents.types import ResearchState
from agents.planner import clean_topic_prompt

FALLBACK_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b"
]

def generate_domain_mermaid_diagram(topic: str, doc_type: str = "research_paper", diagram_title: str = None, orientation: str = "vertical") -> str:
    """Generates an authentic, domain-relevant Mermaid diagram in vertical, combination, or horizontal orientation."""
    topic_lower = topic.lower()
    title_comment = f"%% title: {diagram_title}\n" if diagram_title else ""

    # Domain 1: Exploratory Data Analysis / Data Science / Analytics (Vertical Pipeline)
    if any(k in topic_lower for k in ["exploratory data analysis", "eda", "data analysis", "data cleaning", "feature engineering", "data profiling", "pandas", "dataset"]):
        if orientation == "horizontal":
            direction = "graph LR"
        else:
            direction = "graph TD"
            
        return f"""```{title_comment}mermaid
{direction}
    RawData["1. Raw Data Ingestion & Streaming"] --> Schema["2. Automated Schema Validation & Typing"]
    Schema --> Missing["3. Missing Value & Imputation Pipeline"]
    Missing --> Outliers["4. Outlier & Anomaly Detection (IQR / Z-Score)"]
    Outliers --> Univariate["5. Univariate Distribution & Skewness Analysis"]
    Univariate --> Bivariate["6. Multivariate Correlation & Feature Collinearity"]
    Bivariate --> Insights["7. Statistical Findings & Actionable Deliverables"]
```"""

    # Domain 2: Semiconductor / VLSI / Electronic Design Automation (Vertical Synthesis Flow)
    if any(k in topic_lower for k in ["semiconductor", "vlsi", "rtl", "gdsii", "physical design", "asic", "fpga", "cadence", "synopsys"]):
        if orientation == "horizontal":
            direction = "graph LR"
        else:
            direction = "graph TD"

        return f"""```{title_comment}mermaid
{direction}
    RTL["1. RTL HDL Specification (Verilog / VHDL)"] --> Synth["2. Logic Synthesis & Standard Cell Mapping"]
    Synth --> Floorplan["3. Power Mesh Design & Floorplanning"]
    Floorplan --> Placement["4. Standard Cell Placement & Clock Tree Synthesis"]
    Placement --> Routing["5. Global & Detailed Interconnect Routing"]
    Routing --> Signoff["6. Physical Verification DRC / LVS / Timing Closure"]
    Signoff --> GDSII["7. Production GDSII Tapeout Delivery"]
```"""

    # Domain 3: System Design / Distributed Systems / pgvector / Microservices (Combination Multi-Tier Architecture)
    if doc_type == "system_design" or any(k in topic_lower for k in ["system design", "distributed system", "microservices", "high level design", "kafka", "pgvector", "database topology", "vector database"]):
        if orientation == "horizontal":
            return f"""```{title_comment}mermaid
graph LR
    Client["Client SDKs"] --> APIGateway["API Gateway & Router"]
    APIGateway --> ComputeCluster["Compute & Index Cluster"]
    ComputeCluster --> Cache["Distributed Cache"]
    ComputeCluster --> Storage["PostgreSQL Vector Shards"]
```"""
        else:
            # Combination: Multi-tier flowchart TD with subgraphs
            return f"""```{title_comment}mermaid
flowchart TD
    subgraph IngressTier ["1. Client & Ingestion Tier"]
        Client["Client Applications & SDK Ingestion"]
        Gateway["Edge API Gateway & Rate Limiter"]
    end
    subgraph RoutingTier ["2. Routing & Ingress Layer"]
        Router["Query Router & Shard Dispatcher"]
        Auth["Zero-Trust Authenticator & JWT Validator"]
    end
    subgraph ComputeTier ["3. Processing & Vector Search Cluster"]
        IndexEngine["pgvector HNSW Index Search Engine"]
        Filter["Metadata Pre/Post Filtering Engine"]
    end
    subgraph StorageTier ["4. Partitioned Persistence & Cache Tier"]
        PrimaryDB[("Primary Database Master (Vector Shards)")]
        Cache[("Distributed Memory Cache (Redis)")]
        Replicas[("Cross-AZ Read Replicas")]
    end
    Client --> Gateway
    Gateway --> Auth
    Auth --> Router
    Router --> IndexEngine
    IndexEngine --> Filter
    Filter --> Cache
    Filter --> PrimaryDB
    PrimaryDB -.-> Replicas
```"""

    # Domain 4: CI/CD / DevOps / Cloud Deployment (Vertical Pipeline)
    if any(k in topic_lower for k in ["ci/cd", "deployment", "pipeline", "docker", "kubernetes", "devops"]):
        if orientation == "horizontal":
            direction = "graph LR"
        else:
            direction = "graph TD"

        return f"""```{title_comment}mermaid
{direction}
    GitCommit["1. Code Commit & Branch Pull Request"] --> Linters["2. Static Analysis & Security Scanning"]
    Linters --> Build["3. Container Build & Image Packaging"]
    Build --> TestMatrix["4. Automated Unit & Integration Test Matrix"]
    TestMatrix --> Canary["5. Canary Staging Deployment & Health Checks"]
    Canary --> Production["6. Automated Zero-Downtime Production Rollout"]
```"""

    # Domain 5: Security / Zero-Trust / Authentication (Combination Multi-Tier)
    if any(k in topic_lower for k in ["security", "zero trust", "authentication", "authorization", "oauth", "mtls", "cryptography"]):
        if orientation == "horizontal":
            direction = "graph LR"
            return f"""```{title_comment}mermaid
{direction}
    Client["Client Device"] --> IdP["Identity Provider"]
    IdP --> PDP["Policy Decision Point"]
    PDP --> Gateway["Mutual TLS Gateway"]
    Gateway --> Enclave["Secure Workload Enclave"]
```"""
        else:
            return f"""```{title_comment}mermaid
flowchart TD
    subgraph Perimeter ["1. Endpoint & Identity Perimeter"]
        ClientDevice["Authenticated Client Device & Agent"]
        IdP["Enterprise Identity Provider (OIDC / SAML)"]
    end
    subgraph ControlPlane ["2. Policy & Authorization Engine"]
        PDP["Policy Decision Point (OPA / AuthZ Engine)"]
        PEP["Policy Enforcement Gateway (Mutual TLS)"]
    end
    subgraph Workload ["3. Workload Enclave & Services"]
        Service["Protected Microservice Workload"]
        AuditLog["Immutable SIEM Audit Log & Telemetry"]
    end
    ClientDevice --> IdP
    IdP --> PDP
    PDP --> PEP
    PEP --> Service
    Service --> AuditLog
```"""

    # Domain 6: Comparative Analysis (Combination / Decision Matrix)
    if doc_type == "comparative_analysis":
        return f"""```{title_comment}mermaid
flowchart TD
    Requirements["Workload Constraints & Functional Requirements"] --> EvalEngine["Comparative Benchmark Engine"]
    EvalEngine --> PatternA["Primary Architectural Pattern"]
    EvalEngine --> PatternB["Alternative Baseline Pattern"]
    PatternA --> Tradeoffs["Throughput vs Latency Trade-Off Analysis"]
    PatternB --> Tradeoffs
    Tradeoffs --> DecisionGuide["Enterprise Decision & Selection Matrix"]
```"""

    # Domain 7: Executive Summary (Combination / Strategic Value Flow)
    if doc_type == "executive_summary":
        return f"""```{title_comment}mermaid
flowchart TD
    Drivers["Market Dynamics & Business Drivers"] --> Strategy["Executive Technology Strategy"]
    Strategy --> CoreArchitecture["Core Enterprise Architectural Blueprint"]
    CoreArchitecture --> Governance["Security, Risk & Regulatory Compliance"]
    Governance --> BusinessValue["Measurable Enterprise ROI & Developer Velocity"]
```"""

    # Domain 8: Literature Review (Vertical Taxonomic Synthesis)
    if doc_type == "literature_review":
        return f"""```{title_comment}mermaid
graph TD
    Taxonomy["1. Survey Scope & Categorization Taxonomy"] --> Foundations["2. Seminal Historical Research Milestones"]
    Foundations --> Modern["3. State-of-the-Art Methodologies"]
    Modern --> Synthesis["4. Cross-Study Empirical Synthesis"]
    Synthesis --> Gaps["5. Identified Research Gaps & Future Horizons"]
```"""

    # Default Research Paper / Technical Approach
    if orientation == "horizontal":
        direction = "graph LR"
    else:
        direction = "graph TD"

    return f"""```{title_comment}mermaid
{direction}
    Problem["1. Problem Formulation & Specification"] --> Methodology["2. Proposed Methodological Pipeline"]
    Methodology --> Execution["3. Core Technical Execution Engine"]
    Execution --> Verification["4. Empirical Validation & Test Suites"]
    Verification --> Delivery["5. Production-Ready Verified Outcomes"]
```"""

def sanitize_mermaid_code(code: str, preferred_orientation: str = "vertical") -> str:
    """Ensures Mermaid syntax adheres to strict parsing rules while respecting vertical, combination, and horizontal orientations."""
    if not code:
        return ""
    code = code.strip()
    raw_chart = code
    if raw_chart.startswith("```"):
        lines = raw_chart.split("\n")
        raw_chart = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:]).strip()
        if raw_chart.startswith("mermaid"):
            raw_chart = raw_chart[7:].strip()

    # Ensure starts with a valid graph/flowchart declaration without destroying TD/LR
    if not (raw_chart.startswith("graph ") or raw_chart.startswith("flowchart ")):
        if preferred_orientation == "horizontal":
            raw_chart = "graph LR\n" + raw_chart
        elif preferred_orientation == "combination":
            raw_chart = "flowchart TD\n" + raw_chart
        else:
            raw_chart = "graph TD\n" + raw_chart

    return f"```mermaid\n{raw_chart}\n```"

def generate_llm_diagram(topic: str, doc_type: str, diagram_info: dict, api_key: str, models_to_try: list) -> str:
    """Uses Groq LLM to synthesize an authentic, customized Mermaid diagram respecting the planned orientation."""
    title = diagram_info.get("title", f"{topic} Flowchart")
    description = diagram_info.get("description", f"Workflow for {topic}")
    orientation = diagram_info.get("orientation", "vertical")

    if orientation == "horizontal":
        direction_guideline = "Use 'graph LR' or 'flowchart LR' (horizontal flow) for this concise interaction."
    elif orientation == "combination":
        direction_guideline = "Use 'flowchart TD' (top-down combination) with subgraphs representing architectural tiers (e.g., Ingress Tier, Compute/Routing Tier, Storage Tier)."
    else:
        direction_guideline = "Use 'graph TD' or 'flowchart TD' (vertical top-to-bottom flow) so each stage flows naturally downwards without horizontal overflow."

    prompt = f"""You are a Principal Systems Architect and Technical Diagram Specialist.
Topic: "{topic}"
Document Type: "{doc_type}"
Diagram Title: "{title}"
Description: "{description}"
Layout Guideline: {direction_guideline}

Task: Write a clean, professional, fully valid Mermaid.js diagram representing the authentic technical workflow or architecture for "{topic}".

Strict Syntax Rules:
- Must begin with a valid direction header (e.g. ```mermaid\ngraph TD or flowchart TD)
- {direction_guideline}
- Each node must use a concise alphanumeric ID and clean quoted label, e.g.:
  Ingestion["1. Raw Data Ingestion & Streaming"]
  Validation["2. Schema Validation & Typing"]
- DO NOT use unescaped special characters, colons, or HTML inside node labels.
- Connect logical stages using "-->" or "-.->" arrows.
- Use authentic technical steps specifically relevant to "{topic}". DO NOT use generic dummy labels like "Core Service Component: {topic}".
- End with:
```

Output ONLY the Mermaid code block.
"""

    for model_name in models_to_try:
        try:
            llm = ChatGroq(
                model=model_name,
                groq_api_key=api_key,
                temperature=0.1,
                max_tokens=500
            )
            response = llm.invoke(prompt)
            content = str(response.content).strip()
            if "graph " in content or "flowchart " in content:
                match = re.search(r"```(?:mermaid)?\s*([\s\S]*?)```", content)
                if match:
                    code = match.group(1).strip()
                    return sanitize_mermaid_code(code, orientation)
                return sanitize_mermaid_code(content, orientation)
        except Exception as e:
            print(f"[Diagram Agent] Model {model_name} error: {e}. Trying next fallback...")
            continue

    return generate_domain_mermaid_diagram(topic, doc_type, title, orientation)

def run_diagram(state: ResearchState) -> dict:
    """Agent 10: Diagram Agent
    Evaluates diagram plan, synthesizes authentic, domain-relevant Mermaid.js flowcharts (vertical, combination, or horizontal), and embeds them into the appropriate section.
    """
    base_report = state.get("cited_report") or state.get("draft_report") or state.get("report") or ""
    raw_question = state.get("question", "")
    topic = clean_topic_prompt(raw_question)
    doc_type = state.get("doc_type", "research_paper") or "research_paper"
    
    diagram_required = state.get("diagram_required", True)
    diagram_plan = state.get("diagram_plan") or []

    # If the Planner determined that no diagram is required for this specific document, return report cleanly
    if not diagram_required:
        return {
            "mermaid_diagram": "",
            "report": base_report,
            "status": "completed"
        }

    api_key = os.getenv("GROQ_API_KEY")
    env_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    models_to_try = [env_model] + [m for m in FALLBACK_MODELS if m != env_model]

    # If diagram_plan is empty, synthesize a default relevant diagram spec
    if not diagram_plan:
        diagram_plan = [
            {
                "title": f"{topic} Execution Flowchart",
                "type": "flowchart",
                "orientation": "vertical",
                "target_section": "Core Technical Methodology & Execution Flow",
                "description": f"Workflow pipeline for {topic}"
            }
        ]

    final_report = base_report
    primary_diagram_code = ""

    # Generate and embed each planned diagram (can be 1 or multiple, vertical or combination or horizontal)
    for idx, d_info in enumerate(diagram_plan):
        d_title = d_info.get("title", f"{topic} Flowchart")
        target_section = d_info.get("target_section", "")
        orientation = d_info.get("orientation", "vertical")

        # Generate diagram code
        if api_key and api_key != "demo":
            diagram_code = generate_llm_diagram(topic, doc_type, d_info, api_key, models_to_try)
        else:
            diagram_code = generate_domain_mermaid_diagram(topic, doc_type, d_title, orientation)

        if idx == 0:
            primary_diagram_code = diagram_code

        # Attempt to insert directly under target_section
        inserted = False
        if target_section:
            pattern = re.compile(rf"(^##\s*{re.escape(target_section)}[^\n]*)", re.MULTILINE | re.IGNORECASE)
            match = pattern.search(final_report)
            if match:
                sec_header = match.group(1)
                parts = final_report.split(sec_header, 1)
                final_report = parts[0] + sec_header + f"\n\n{diagram_code}\n" + parts[1]
                inserted = True

        # Fallback candidate sections if target section was not matched
        if not inserted:
            candidate_keywords = ["pipeline", "flow", "architecture", "methodology", "design", "topology", "process", "framework"]
            lines = final_report.split("\n")
            for line_idx, line in enumerate(lines):
                if line.startswith("## ") and any(kw in line.lower() for kw in candidate_keywords):
                    if not any(skip in line.lower() for skip in ["summary", "abstract", "non-goal", "scope", "boundar", "milestone"]):
                        lines.insert(line_idx + 1, f"\n{diagram_code}\n")
                        final_report = "\n".join(lines)
                        inserted = True
                        break

        # Ultimate fallback: Append with a dedicated, professional section heading matching the diagram
        if not inserted:
            clean_sec_title = d_title.replace("Flowchart", "").replace("Diagram", "").strip()
            final_report += f"\n\n## {clean_sec_title} Pipeline & Architecture\n\n{diagram_code}\n"

    return {
        "mermaid_diagram": primary_diagram_code,
        "report": final_report,
        "status": "completed"
    }
