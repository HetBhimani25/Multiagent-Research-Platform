"use client";

import React, { useState, useEffect, useRef } from "react";
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
  LayoutDashboard,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface AgentItem {
  id: number;
  name: string;
  role: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  inputState: string;
  outputState: string;
}

const AGENTS: AgentItem[] = [
  {
    id: 1,
    name: "Planner Agent",
    role: "Query & Strategy Planner",
    badge: "Stage 01 • Decomposition",
    icon: BrainCircuit,
    description: "Analyzes user research prompts and decomposes them into 3–5 targeted search sub-queries to maximize domain coverage and literature discovery.",
    inputState: "User Prompt / Research Topic",
    outputState: "Structured Sub-Queries List",
  },
  {
    id: 2,
    name: "Searcher Agent",
    role: "Web API Orchestrator",
    badge: "Stage 02 • Discovery",
    icon: Search,
    description: "Executes real-time web queries across Tavily and Brave Search APIs to discover high-authority research papers, articles, and technical docs.",
    inputState: "Sub-Queries List",
    outputState: "Discovered Web URLs & Metadata",
  },
  {
    id: 3,
    name: "Crawler Agent",
    badge: "Stage 03 • Extraction",
    role: "HTML Scraper & Cleaner",
    icon: Globe,
    description: "Crawls raw HTML from web pages, stripping away boilerplate elements like navigation bars, ads, and footers to isolate core body text.",
    inputState: "Web Page URLs",
    outputState: "Clean Raw Body Text",
  },
  {
    id: 4,
    name: "Chunker Agent",
    badge: "Stage 04 • Segmentation",
    role: "Semantic Text Splitter",
    icon: Scissors,
    description: "Splits raw body text into optimal 800-character semantic chunks with 100-character overlaps to preserve contextual relationships.",
    inputState: "Clean Body Text",
    outputState: "Structured Text Chunks",
  },
  {
    id: 5,
    name: "Vector RAG Agent",
    badge: "Stage 05 • Indexing",
    role: "pgvector Embedding Engine",
    icon: Database,
    description: "Generates 384-dimensional embeddings (all-MiniLM-L6-v2) and performs cosine similarity search inside PostgreSQL pgvector.",
    inputState: "Text Chunks",
    outputState: "Indexed Vectors & Context",
  },
  {
    id: 6,
    name: "Reasoner Agent",
    badge: "Stage 06 • Reasoning",
    role: "Analytical Synthesis Engine",
    icon: Cpu,
    description: "Synthesizes retrieved vector context into logical arguments, key technical insights, comparative metrics, and structured evidence.",
    inputState: "Retrieved Vector Context",
    outputState: "Synthesized Insights & Arguments",
  },
  {
    id: 7,
    name: "Writer Agent",
    badge: "Stage 07 • Drafting",
    role: "Academic Paper Writer",
    icon: PenTool,
    description: "Drafts formal paper sections (Abstract, Introduction, System Architecture, Analysis, Conclusion) formatted in clean Markdown.",
    inputState: "Synthesized Insights",
    outputState: "Drafted Academic Paper",
  },
  {
    id: 8,
    name: "Citation Agent",
    badge: "Stage 08 • Verification",
    role: "Citation & Fact Checker",
    icon: Link2,
    description: "Verifies inline claims against scraped web sources and appends clickable academic citations matching original web URLs.",
    inputState: "Draft Paper & Source URLs",
    outputState: "Verified Citations & Links",
  },
  {
    id: 9,
    name: "Reviewer Agent",
    badge: "Stage 09 • Self-Correction",
    role: "Peer Review Loop Engine",
    icon: CheckCircle2,
    description: "Evaluates draft quality against academic rigor criteria. If quality score is < 80%, triggers an automatic revision loop back to Writer.",
    inputState: "Cited Paper Draft",
    outputState: "Quality Score & Critiques",
  },
  {
    id: 10,
    name: "Diagram Agent",
    badge: "Stage 10 • Visualization",
    role: "Mermaid.js Chart Synthesizer",
    icon: GitFork,
    description: "Extracts system entities and architecture components, generating interactive Mermaid.js flowcharts embedded directly into the paper.",
    inputState: "Final Approved Paper",
    outputState: "Complete Paper + Mermaid Charts",
  },
];

interface AgentScrollLandingProps {
  onEnterDashboard: () => void;
}

export default function AgentScrollLanding({ onEnterDashboard }: AgentScrollLandingProps) {
  const { user } = useAuth();
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isButtonTriggered, setIsButtonTriggered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false);

  const triggerDashboardShutter = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsButtonTriggered(true);
    setTimeout(() => {
      onEnterDashboard();
    }, 500);
  };

  // Detect scroll position & dynamically update scroll-linked shutter progress past Card 10
  const handleScroll = () => {
    if (!containerRef.current || isTransitioningRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (!clientHeight) return;
    
    // Calculate active agent index (0 to 9)
    const index = Math.min(
      Math.floor((scrollTop + clientHeight / 2) / clientHeight),
      AGENTS.length - 1
    );
    setActiveAgentIndex(index);

    // Calculate interactive shutter progress past Card 10 (index 9) with crisp deadzone buffer
    const card10Top = (AGENTS.length - 1) * clientHeight;
    const blurThreshold = 180; // 180px deadzone buffer so Card 10 remains 100% crisp & unblurred initially

    if (scrollTop > card10Top + blurThreshold) {
      const activeScroll = scrollTop - (card10Top + blurThreshold);
      const scrollRange = Math.max(100, clientHeight - blurThreshold);
      const progress = Math.min(1, Math.max(0, activeScroll / scrollRange));
      setScrollProgress(progress);

      // If user has scrolled shutter almost completely out of view (95%+), switch to Dashboard
      if (progress >= 0.95) {
        isTransitioningRef.current = true;
        onEnterDashboard();
      }
    } else {
      if (scrollProgress !== 0) {
        setScrollProgress(0);
      }
    }
  };

  const shutterStyle: React.CSSProperties = isButtonTriggered
    ? {
        transform: "translateY(-100%)",
        filter: "blur(16px)",
        opacity: 0,
        transition: "transform 0.5s cubic-bezier(0.77, 0, 0.175, 1), filter 0.5s ease, opacity 0.5s ease",
      }
    : {
        transform: `translateY(-${scrollProgress * 100}%)`,
        filter: `blur(${scrollProgress * 16}px)`,
        opacity: 1 - scrollProgress * 0.85,
        transition: "none", // Direct realtime response to user scroll gesture
      };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#F9E6A8] text-[#4D2A00] flex flex-col overflow-hidden"
      style={shutterStyle}
    >
      {/* Top Floating Header */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#CC6F00]/20 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#F2A900]/20 border border-[#CC6F00]/30 text-[#CC6F00] rounded-xl">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-none bg-gradient-to-r from-[#4D2A00] via-[#CC6F00] to-[#4D2A00] bg-clip-text text-transparent">
              ResearchFlow AI Architecture Flow
            </h1>
            <p className="text-[11px] font-semibold text-[#4D2A00]/70 mt-0.5">
              10 Stateful AI Agents Orchestration
            </p>
          </div>
        </div>

        {/* User Badge */}
        {user && (
          <div className="flex items-center space-x-2 bg-[#F9E6A8]/40 border border-[#CC6F00]/30 rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 rounded-md bg-[#F2A900] text-[#4D2A00] font-extrabold text-xs flex items-center justify-center">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-[#4D2A00] hidden sm:inline">{user.fullName}</span>
          </div>
        )}
      </header>

      {/* Snap Scroll Container (1 Agent Card Per Screen) */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="snap-scroll-container w-full h-full pt-16 pb-20"
      >
        {AGENTS.map((agent, index) => {
          const Icon = agent.icon;
          const isCurrent = index === activeAgentIndex;

          return (
            <section
              key={agent.id}
              className="snap-scroll-section w-full px-6 flex flex-col items-center justify-center relative"
            >
              {/* Subtle Background Glow Accent */}
              <div className="absolute w-96 h-96 bg-[#F2A900]/15 rounded-full blur-3xl pointer-events-none"></div>

              {/* Eye-Catching Bright Glowing Agent Card Box */}
              <div className={`relative w-full max-w-2xl bg-white border-2 border-[#CC6F00]/40 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(204,111,0,0.35)] hover:shadow-[0_25px_60px_rgba(242,169,0,0.5)] transition-all duration-500 transform ${
                isCurrent ? "scale-100 opacity-100 translate-y-0 ring-4 ring-[#F2A900]/25" : "scale-95 opacity-60"
              }`}>
                
                {/* Header Badge & Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F2A900] to-[#CC6F00] p-1 shadow-lg shadow-[#CC6F00]/20">
                      <div className="w-full h-full bg-[#F9E6A8]/30 rounded-[12px] flex items-center justify-center border border-[#CC6F00]/20">
                        <Icon className="w-8 h-8 text-[#CC6F00]" />
                      </div>
                    </div>

                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F9E6A8] text-[#CC6F00] border border-[#CC6F00]/30 mb-1">
                        {agent.badge}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4D2A00]">
                        {agent.name}
                      </h2>
                      <p className="text-xs font-bold text-[#CC6F00]">{agent.role}</p>
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-2xl font-black text-[#F2A900]">
                      0{agent.id}
                    </span>
                    <span className="text-xs font-bold text-[#4D2A00]/40 block">/ 10</span>
                  </div>
                </div>

                {/* Description Body */}
                <div className="p-5 bg-[#F9E6A8]/20 border border-[#CC6F00]/20 rounded-2xl mb-6">
                  <p className="text-sm font-semibold text-[#4D2A00] leading-relaxed">
                    {agent.description}
                  </p>
                </div>

                {/* Data Flow Connector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-white border border-[#CC6F00]/20 rounded-xl shadow-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#CC6F00] block mb-1">
                      Input Data Passed
                    </span>
                    <p className="font-bold text-[#4D2A00] flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-[#F2A900]" />
                      {agent.inputState}
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-[#CC6F00]/20 rounded-xl shadow-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#CC6F00] block mb-1">
                      Output State Produced
                    </span>
                    <p className="font-bold text-[#4D2A00] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#CC6F00]" />
                      {agent.outputState}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* 11th Scroll-Linked Transition Section (Pull Shutter to Reveal Dashboard) */}
        <section className="snap-scroll-section w-full min-h-screen flex flex-col items-center justify-center relative pointer-events-none">
          <div className="text-center p-6 bg-white/80 backdrop-blur-md rounded-2xl border-2 border-[#CC6F00]/40 shadow-[0_20px_50px_rgba(204,111,0,0.35)]">
            <p className="text-sm font-black text-[#4D2A00] uppercase tracking-widest animate-pulse mb-1">
              Entering Dashboard...
            </p>
            <p className="text-xs font-bold text-[#CC6F00]">
              Keep scrolling to pull shutter up completely
            </p>
          </div>
        </section>
      </div>

      {/* Transparent Centered Ultra-Minimalist Bottom Controls (No White Background) */}
      <footer className="absolute bottom-0 left-0 right-0 z-40 bg-transparent px-8 py-4 flex items-center justify-center gap-8 sm:gap-12 pointer-events-auto">
        
        {/* Element 1: Centered Transparent Scroll Mouse Icon + SCROLL Text */}
        <div className="flex flex-col items-center gap-0.5 drop-shadow-sm">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#4D2A00]">
            SCROLL
          </span>
          <div className="w-5 h-8 border-2 border-[#4D2A00] rounded-full flex justify-center p-1 bg-white/30 backdrop-blur-xs">
            <div className="w-1 h-2 bg-[#CC6F00] rounded-full animate-bounce"></div>
          </div>
        </div>

        {/* Element 2: Centered Dashboard Button */}
        <button
          onClick={triggerDashboardShutter}
          className="px-6 py-2.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs transition-all shadow-[0_8px_25px_rgba(204,111,0,0.3)] flex items-center gap-2 border border-[#CC6F00]/40"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
}
