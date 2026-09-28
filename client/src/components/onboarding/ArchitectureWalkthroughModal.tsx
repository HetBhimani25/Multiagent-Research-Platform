"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  Sparkles, 
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
  ArrowRight
} from "lucide-react";

interface AgentStep {
  id: number;
  name: string;
  badge: string;
  role: string;
  icon: React.ElementType;
  description: string;
  inputData: string;
  outputData: string;
}

const AGENTS: AgentStep[] = [
  {
    id: 1,
    name: "Planner Agent",
    badge: "Decomposition",
    role: "Prompt & Goal Planner",
    icon: BrainCircuit,
    description: "Analyzes the research prompt and decomposes it into 3–5 targeted, distinct web search sub-queries to maximize domain coverage.",
    inputData: "User Prompt / Topic",
    outputData: "List of Search Queries",
  },
  {
    id: 2,
    name: "Searcher Agent",
    badge: "Web Discovery",
    role: "Search API Orchestrator",
    icon: Search,
    description: "Executes real-time web queries via Tavily and Brave Search APIs to discover authoritative papers, articles, and documentation.",
    inputData: "Sub-Queries List",
    outputData: "Raw Web URLs & Metadata",
  },
  {
    id: 3,
    name: "Crawler Agent",
    badge: "Scraping",
    role: "HTML Scraper & Cleaner",
    icon: Globe,
    description: "Fetches full HTML content from web sources, stripping away boilerplate navigation bars, footers, scripts, and advertisements.",
    inputData: "Discovered Web URLs",
    outputData: "Clean Raw Text Content",
  },
  {
    id: 4,
    name: "Chunker Agent",
    badge: "Segmentation",
    role: "Semantic Text Splitter",
    icon: Scissors,
    description: "Splits raw scraped text into optimal 800-character semantic chunks with 100-character overlaps to preserve context boundaries.",
    inputData: "Raw Web Text",
    outputData: "Structured Text Chunks",
  },
  {
    id: 5,
    name: "Vector RAG Agent",
    badge: "Indexing",
    role: "pgvector Indexer & Retriever",
    icon: Database,
    description: "Generates 384-dimensional embeddings (all-MiniLM-L6-v2) and performs cosine similarity search inside PostgreSQL pgvector.",
    inputData: "Text Chunks",
    outputData: "Indexed Vectors & Context",
  },
  {
    id: 6,
    name: "Reasoner Agent",
    badge: "Synthesis",
    role: "Analytical Synthesis Engine",
    icon: Cpu,
    description: "Analyzes top vector context chunks to synthesize core logical arguments, evidence, comparative metrics, and technical insights.",
    inputData: "Retrieved Vector Context",
    outputData: "Synthesized Insights & Arguments",
  },
  {
    id: 7,
    name: "Writer Agent",
    badge: "Drafting",
    role: "Academic Section Writer",
    icon: PenTool,
    description: "Drafts formal paper sections (Abstract, Introduction, System Architecture, Performance Analysis, Conclusion) in Markdown format.",
    inputData: "Synthesized Insights",
    outputData: "Drafted Academic Paper",
  },
  {
    id: 8,
    name: "Citation Agent",
    badge: "Verification",
    role: "Citation & Fact Checker",
    icon: Link2,
    description: "Cross-checks every inline claim against scraped sources and appends clickable inline academic citations matching original web URLs.",
    inputData: "Draft Paper & Source URLs",
    outputData: "Verified Citations & Links",
  },
  {
    id: 9,
    name: "Reviewer Agent",
    badge: "Self-Correction",
    role: "Peer Review Loop",
    icon: CheckCircle2,
    description: "Evaluates draft quality against academic rigor criteria. If quality score is < 80%, triggers an automatic revision loop back to Writer.",
    inputData: "Cited Paper Draft",
    outputData: "Quality Score & Critiques",
  },
  {
    id: 10,
    name: "Diagram Agent",
    badge: "Visualization",
    role: "Mermaid.js Diagram Synthesizer",
    icon: GitFork,
    description: "Extracts system entities and architecture components, generating interactive Mermaid.js flowcharts embedded directly into the paper.",
    inputData: "Final Approved Paper",
    outputData: "Complete Paper + Mermaid Charts",
  },
];

interface WalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchitectureWalkthroughModal({ isOpen, onClose }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= AGENTS.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3500); // 3.5s per step during auto-play
    }
    return () => clearInterval(timer);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const currentAgent = AGENTS[currentStep];
  const IconComponent = currentAgent.icon;

  const handleNext = () => {
    if (currentStep < AGENTS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-none">
                ResearchFlow AI — 10-Agent Architecture Walkthrough
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                LangGraph Stateful Multi-Agent Orchestration Flow
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-all shadow-sm"
              title={isPlaying ? "Pause Auto-play" : "Start Auto-play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 10-Step Pipeline Visual Progress Bar */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[600px] gap-1">
            {AGENTS.map((agent, idx) => {
              const StepIcon = agent.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;

              return (
                <button
                  key={agent.id}
                  onClick={() => { setCurrentStep(idx); setIsPlaying(false); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105"
                      : isPast
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                  }`}
                  title={`${agent.id}. ${agent.name}`}
                >
                  <StepIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-semibold">{agent.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Agent Details Card */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="flex flex-col gap-6">
            
            {/* Active Agent Badge & Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/15">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center border border-indigo-100">
                    <IconComponent className="w-8 h-8 text-indigo-600" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Agent {currentAgent.id} of 10 • {currentAgent.badge}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900">{currentAgent.name}</h3>
                  <p className="text-xs font-semibold text-indigo-600">{currentAgent.role}</p>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-400">STATEFUL NODE</span>
                <p className="text-xs font-semibold text-slate-700">LangGraph StateGraph</p>
              </div>
            </div>

            {/* Description Box */}
            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {currentAgent.description}
              </p>
            </div>

            {/* Data Flow Input / Output Connector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  Input State Received
                </span>
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                  {currentAgent.inputData}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                  Output State Produced
                </span>
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {currentAgent.outputData}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Controls Bar */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold text-slate-400">
              Step {currentStep + 1} of {AGENTS.length}
            </span>

            {currentStep < AGENTS.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/20 transition-all"
              >
                <span>Next Agent</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
              >
                <span>Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
