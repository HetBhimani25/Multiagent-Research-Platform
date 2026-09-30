"use client";

import React from "react";
import { 
  BrainCircuit, 
  Search, 
  Globe, 
  Scissors, 
  Database, 
  Cpu, 
  PenTool, 
  Link2, 
  CheckCircle2, 
  GitFork, 
  Loader2,
  ListFilter
} from "lucide-react";

export type AgentStep = 
  | "idle" 
  | "planning" 
  | "searching" 
  | "crawling" 
  | "chunking" 
  | "vector_rag" 
  | "reasoning" 
  | "writing" 
  | "citation" 
  | "reviewing" 
  | "diagramming" 
  | "completed";

interface AgentPipelineTrackerProps {
  activeStep: AgentStep;
  loading: boolean;
  queries?: string[];
}

const PIPELINE_AGENTS = [
  { id: "planning", stepNum: 1, name: "Planner Agent", icon: BrainCircuit, desc: "Query Decomposition" },
  { id: "searching", stepNum: 2, name: "Searcher Agent", icon: Search, desc: "Tavily Web Discovery" },
  { id: "crawling", stepNum: 3, name: "Crawler Agent", icon: Globe, desc: "HTML Scraping" },
  { id: "chunking", stepNum: 4, name: "Chunker Agent", icon: Scissors, desc: "Text Segmentation" },
  { id: "vector_rag", stepNum: 5, name: "Vector RAG Agent", icon: Database, desc: "pgvector Embeddings" },
  { id: "reasoning", stepNum: 6, name: "Reasoner Agent", icon: Cpu, desc: "Context Synthesis" },
  { id: "writing", stepNum: 7, name: "Writer Agent", icon: PenTool, desc: "Academic Paper Draft" },
  { id: "citation", stepNum: 8, name: "Citation Agent", icon: Link2, desc: "URL Verification" },
  { id: "reviewing", stepNum: 9, name: "Reviewer Agent", icon: CheckCircle2, desc: "Quality Feedback Loop" },
  { id: "diagramming", stepNum: 10, name: "Diagram Agent", icon: GitFork, desc: "Mermaid Flowcharts" },
];

export default function AgentPipelineTracker({ activeStep, loading, queries = [] }: AgentPipelineTrackerProps) {
  if (activeStep === "idle" && !loading) return null;

  // Helper to determine step status
  const getStepStatus = (agentId: string, stepIndex: number) => {
    const stepOrder = ["planning", "searching", "crawling", "chunking", "vector_rag", "reasoning", "writing", "citation", "reviewing", "diagramming", "completed"];
    const currentIndex = stepOrder.indexOf(activeStep);
    
    if (activeStep === agentId) return "active";
    if (currentIndex > stepIndex || activeStep === "completed") return "completed";
    return "pending";
  };

  return (
    <section className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)]">
      <div className="flex items-center justify-between mb-4 border-b border-[#CC6F00]/20 pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-[#CC6F00]" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#4D2A00]">
            Live LangGraph 10-Agent Pipeline Execution
          </h3>
        </div>
        <span className="text-xs font-bold text-[#CC6F00] flex items-center gap-1.5">
          {activeStep === "completed" ? (
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Pipeline Complete
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#4D2A00] bg-[#F9E6A8] px-2.5 py-0.5 rounded-full border border-[#CC6F00]/30">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#CC6F00]" />
              Active Node: {activeStep.toUpperCase()}
            </span>
          )}
        </span>
      </div>

      {/* Generated Sub-Queries Drawer (if available from Planner) */}
      {queries.length > 0 && (
        <div className="mb-5 p-3.5 bg-[#F9E6A8]/30 border border-[#CC6F00]/20 rounded-2xl">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#CC6F00] flex items-center gap-1 mb-1.5">
            <ListFilter className="w-3.5 h-3.5 text-[#F2A900]" />
            Decomposed Sub-Queries (Planner Output):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {queries.map((q, idx) => (
              <span key={idx} className="text-xs font-bold text-[#4D2A00] bg-white px-2.5 py-1 rounded-lg border border-[#CC6F00]/20 shadow-xs">
                🔍 {q}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Responsive 10-Agent Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {PIPELINE_AGENTS.map((agent, index) => {
          const status = getStepStatus(agent.id, index);
          const Icon = agent.icon;

          return (
            <div
              key={agent.id}
              className={`p-3 rounded-2xl border transition-all duration-300 ${
                status === "active"
                  ? "bg-[#F9E6A8] border-2 border-[#CC6F00] text-[#4D2A00] shadow-md scale-102"
                  : status === "completed"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#CC6F00]">
                  0{agent.stepNum}
                </span>
                {status === "active" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#CC6F00]" />
                ) : status === "completed" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>

              <p className="text-xs font-extrabold truncate text-[#4D2A00] leading-tight">
                {agent.name}
              </p>
              <p className="text-[10px] font-semibold text-[#4D2A00]/70 truncate mt-0.5">
                {agent.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
