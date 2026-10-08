"use client";

import React from "react";
import { 
  Sparkles, 
  Bot, 
  Loader2, 
  Zap, 
  Scale, 
  GraduationCap, 
  FileText, 
  FileCode, 
  FileDown,
  Lightbulb,
  Wrench,
  Layers,
  BarChart3,
  BookOpen,
  CheckCircle2
} from "lucide-react";

export type ResearchDepth = "fast" | "balanced" | "deep";
export type OutputFormat = "markdown" | "ieee_pdf" | "latex";
export type DocumentType = 
  | "research_paper" 
  | "technical_approach" 
  | "system_design" 
  | "comparative_analysis" 
  | "executive_summary" 
  | "literature_review";

interface ResearchInputConsoleProps {
  question: string;
  setQuestion: (val: string) => void;
  loading: boolean;
  docType: DocumentType;
  setDocType: (type: DocumentType) => void;
  researchDepth: ResearchDepth;
  setResearchDepth: (depth: ResearchDepth) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (fmt: OutputFormat) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const DOCUMENT_TYPES = [
  {
    id: "research_paper" as DocumentType,
    name: "Research Paper",
    icon: GraduationCap,
    desc: "Academic methodology, empirical findings & formal citations",
    badge: "Academic",
  },
  {
    id: "technical_approach" as DocumentType,
    name: "Technical Approach",
    icon: Wrench,
    desc: "Engineering RFC, architecture design & deployment plan",
    badge: "Engineering RFC",
  },
  {
    id: "system_design" as DocumentType,
    name: "System Design",
    icon: Layers,
    desc: "Distributed topology, service specs & storage strategy",
    badge: "Architecture",
  },
  {
    id: "comparative_analysis" as DocumentType,
    name: "Comparative Analysis",
    icon: Scale,
    desc: "Head-to-head benchmarks & trade-off decision matrix",
    badge: "Benchmark",
  },
  {
    id: "executive_summary" as DocumentType,
    name: "Executive Whitepaper",
    icon: BarChart3,
    desc: "Strategic briefing, market drivers & business ROI",
    badge: "Executive",
  },
  {
    id: "literature_review" as DocumentType,
    name: "Literature Review",
    icon: BookOpen,
    desc: "Comprehensive state-of-the-art survey & taxonomies",
    badge: "Survey",
  },
];

const TEMPLATES_BY_TYPE: Record<DocumentType, string[]> = {
  research_paper: [
    "Empirical analysis of state synchronization in multi-agent LLM runtime graphs",
    "Vision Transformers vs Convolutional Networks in edge inference latency",
    "Self-supervised representation learning for sparse graph topologies",
    "Retrieval-Augmented Generation for academic literature synthesis & citation verification"
  ],
  technical_approach: [
    "Technical approach for high-throughput distributed event streaming with Apache Kafka",
    "Zero-trust mutual TLS service-to-service authentication architecture",
    "LocalHost service communication & security isolation deployment plan",
    "Automated CI/CD blue-green deployment pipeline with Kubernetes & ArgoCD"
  ],
  system_design: [
    "High-availability distributed vector database topology with pgvector clustering",
    "Event-driven CQRS architecture for multi-tenant financial transaction ledgers",
    "Global real-time WebSocket communication infrastructure with Redis pub/sub",
    "Scalable multi-region video transcoding & streaming platform architecture"
  ],
  comparative_analysis: [
    "Comparative analysis: Groq LPU vs NVIDIA H100 in production LLM inference latency",
    "Comparative benchmark: pgvector vs Pinecone vs ChromaDB in enterprise vector retrieval",
    "Stateful multi-agent orchestrations in LangGraph vs AutoGen frameworks",
    "REST vs GraphQL vs gRPC: Latency, developer velocity, and scalability trade-offs"
  ],
  executive_summary: [
    "Executive whitepaper on enterprise agentic AI adoption, governance & risk mitigation",
    "Strategic analysis of cloud-native infrastructure modernization & cost optimization",
    "AI-driven research automation: Productivity gains and organizational roadmap",
    "Enterprise data sovereignty and privacy compliance in large language model deployments"
  ],
  literature_review: [
    "Literature survey of autonomous multi-agent systems and stateful reasoning loops",
    "State-of-the-art review of parameter-efficient fine-tuning (LoRA, QLoRA, Prefix Tuning)",
    "Taxonomy of modern vector indexing algorithms: HNSW, IVF, and product quantization",
    "Comprehensive survey of hallucination detection & citation grounding in generative AI"
  ],
};

export default function ResearchInputConsole({
  question,
  setQuestion,
  loading,
  docType,
  setDocType,
  researchDepth,
  setResearchDepth,
  outputFormat,
  setOutputFormat,
  onSubmit
}: ResearchInputConsoleProps) {
  const currentTemplates = TEMPLATES_BY_TYPE[docType] || TEMPLATES_BY_TYPE.research_paper;

  return (
    <section className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(204,111,0,0.25)] relative overflow-hidden transition-all">
      {/* Warm Background Glow Accent */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#F2A900]/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Title & Subtitle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold text-[#4D2A00] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#CC6F00]" />
          Autonomous Research Execution Console
        </h2>
        <span className="text-xs font-bold text-[#CC6F00] bg-[#F9E6A8] px-3 py-1 rounded-full border border-[#CC6F00]/30">
          Powered by LangGraph & Groq AI
        </span>
      </div>

      <p className="text-xs sm:text-sm font-semibold text-[#4D2A00]/80 mb-6">
        Select your target document type and specify your research topic. ResearchFlow AI will orchestrate stateful agents to query live web sources, index vectors into pgvector, synthesize insights, and generate verifiable citations tailored to your objective.
      </p>

      {/* 1. DOCUMENT TYPE / FILTRATION OPTIONS SELECTOR */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-[#4D2A00] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#CC6F00]"></span>
            Select Document Type & Objective (Filtration):
          </label>
          <span className="text-[10px] font-bold text-[#CC6F00]">
            Customizes structure, tone & flowchart
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {DOCUMENT_TYPES.map((typeItem) => {
            const Icon = typeItem.icon;
            const isSelected = docType === typeItem.id;

            return (
              <button
                key={typeItem.id}
                type="button"
                onClick={() => setDocType(typeItem.id)}
                disabled={loading}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-[#F2A900] border-2 border-[#CC6F00] text-[#4D2A00] font-black shadow-md scale-[1.02]"
                    : "bg-[#F9E6A8]/20 hover:bg-[#F9E6A8]/50 border-[#CC6F00]/25 text-[#4D2A00]/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-[#4D2A00]" : "text-[#CC6F00]"}`} />
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                      isSelected ? "bg-[#4D2A00] text-[#F9E6A8]" : "bg-[#F9E6A8] text-[#CC6F00] border border-[#CC6F00]/20"
                    }`}>
                      {typeItem.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-black leading-tight line-clamp-1 mb-1">
                    {typeItem.name}
                  </h4>
                </div>

                <p className={`text-[10px] leading-tight line-clamp-2 mt-1 ${
                  isSelected ? "text-[#4D2A00]/90 font-bold" : "text-[#4D2A00]/60 font-semibold"
                }`}>
                  {typeItem.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DYNAMIC TOPIC STARTER TEMPLATES */}
      <div className="mb-6">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#CC6F00] flex items-center gap-1.5 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-[#F2A900]" />
          Topic Starter Templates for {DOCUMENT_TYPES.find(d => d.id === docType)?.name}:
        </span>
        <div className="flex flex-wrap gap-2">
          {currentTemplates.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuestion(tmpl)}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] border border-[#CC6F00]/30 text-[#4D2A00] transition-all text-left truncate max-w-full sm:max-w-md disabled:opacity-50"
            >
              💡 {tmpl}
            </button>
          ))}
        </div>
      </div>

      {/* 3. INPUT FORM */}
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {/* Textarea Input */}
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`e.g. Specify your ${DOCUMENT_TYPES.find(d => d.id === docType)?.name.toLowerCase()} topic, scope, or system requirements...`}
            className="w-full bg-[#F9E6A8]/20 border-2 border-[#CC6F00]/30 rounded-2xl p-4 pr-12 text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900] min-h-[120px] resize-y transition-all font-semibold shadow-inner"
            disabled={loading}
          />
          <div className="absolute bottom-3 right-4 text-[10px] font-extrabold text-[#CC6F00]">
            {question.length} chars
          </div>
        </div>

        {/* Configuration Row: Depth Selector & Output Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#F9E6A8]/30 p-4 rounded-2xl border border-[#CC6F00]/20">
          
          {/* Research Depth Selector */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#4D2A00] block mb-2">
              Research Pipeline Depth
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Fast Mode */}
              <button
                type="button"
                onClick={() => setResearchDepth("fast")}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  researchDepth === "fast"
                    ? "bg-[#F2A900] border-[#CC6F00] text-[#4D2A00] font-extrabold shadow-sm"
                    : "bg-white border-[#CC6F00]/20 text-[#4D2A00]/80 hover:bg-[#F9E6A8]/50"
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <Zap className="w-3.5 h-3.5 text-[#CC6F00]" />
                  <span>Fast</span>
                </div>
                <span className="text-[10px] text-[#4D2A00]/70 font-semibold mt-1">3 Agents • Direct</span>
              </button>

              {/* Balanced Mode */}
              <button
                type="button"
                onClick={() => setResearchDepth("balanced")}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  researchDepth === "balanced"
                    ? "bg-[#F2A900] border-[#CC6F00] text-[#4D2A00] font-extrabold shadow-sm"
                    : "bg-white border-[#CC6F00]/20 text-[#4D2A00]/80 hover:bg-[#F9E6A8]/50"
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <Scale className="w-3.5 h-3.5 text-[#CC6F00]" />
                  <span>Balanced</span>
                </div>
                <span className="text-[10px] text-[#4D2A00]/70 font-semibold mt-1">7 Agents • 1 Loop</span>
              </button>

              {/* Deep Academic Mode */}
              <button
                type="button"
                onClick={() => setResearchDepth("deep")}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  researchDepth === "deep"
                    ? "bg-[#F2A900] border-[#CC6F00] text-[#4D2A00] font-extrabold shadow-sm"
                    : "bg-white border-[#CC6F00]/20 text-[#4D2A00]/80 hover:bg-[#F9E6A8]/50"
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <GraduationCap className="w-3.5 h-3.5 text-[#CC6F00]" />
                  <span>Deep</span>
                </div>
                <span className="text-[10px] text-[#4D2A00]/70 font-semibold mt-1">10 Agents • Full</span>
              </button>
            </div>
          </div>

          {/* Output Format Switcher (Markdown, IEEE PDF, LaTeX) */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#4D2A00] block mb-2">
              Primary Target Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Markdown */}
              <button
                type="button"
                onClick={() => setOutputFormat("markdown")}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                  outputFormat === "markdown"
                    ? "bg-[#F2A900] border-[#CC6F00] text-[#4D2A00] shadow-sm"
                    : "bg-white border-[#CC6F00]/20 text-[#4D2A00]/80 hover:bg-[#F9E6A8]/50"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#CC6F00]" />
                <span>Markdown</span>
              </button>

              {/* IEEE Academic PDF */}
              <button
                type="button"
                onClick={() => setOutputFormat("ieee_pdf")}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                  outputFormat === "ieee_pdf"
                    ? "bg-[#F2A900] border-[#CC6F00] text-[#4D2A00] shadow-sm"
                    : "bg-white border-[#CC6F00]/20 text-[#4D2A00]/80 hover:bg-[#F9E6A8]/50"
                }`}
              >
                <FileDown className="w-3.5 h-3.5 text-[#CC6F00]" />
                <span>IEEE PDF</span>
              </button>

              {/* LaTeX (.tex) */}
              <button
                type="button"
                onClick={() => setOutputFormat("latex")}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                  outputFormat === "latex"
                    ? "bg-[#F2A900] border-[#CC6F00] text-[#4D2A00] shadow-sm"
                    : "bg-white border-[#CC6F00]/20 text-[#4D2A00]/80 hover:bg-[#F9E6A8]/50"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#CC6F00]" />
                <span>LaTeX (.tex)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-[#CC6F00]/20 flex-wrap gap-4">
          <div className="text-xs font-bold text-[#CC6F00] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#F2A900]" />
            <span>Ready to generate {DOCUMENT_TYPES.find(d => d.id === docType)?.name} via 10-Agent pipeline</span>
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white font-black text-sm sm:text-base shadow-[0_12px_30px_rgba(204,111,0,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5 border-2 border-[#CC6F00] cursor-pointer active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Executing LangGraph Pipeline...</span>
              </>
            ) : (
              <>
                <Bot className="w-5 h-5" />
                <span>Launch Multi-Agent Research</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
