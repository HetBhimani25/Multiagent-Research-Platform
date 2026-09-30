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
  Lightbulb
} from "lucide-react";

export type ResearchDepth = "fast" | "balanced" | "deep";
export type OutputFormat = "markdown" | "ieee_pdf" | "latex";

interface ResearchInputConsoleProps {
  question: string;
  setQuestion: (val: string) => void;
  loading: boolean;
  researchDepth: ResearchDepth;
  setResearchDepth: (depth: ResearchDepth) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (fmt: OutputFormat) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const TEMPLATES = [
  "Technical overview of Multi-Agent RAG architectures & pgvector optimization",
  "Comparative analysis of Groq Llama-3.3 vs Claude 3.5 in autonomous code generation",
  "Stateful multi-agent orchestrations in LangGraph vs AutoGen frameworks",
  "Retrieval-Augmented Generation for academic literature synthesis & citation verification"
];

export default function ResearchInputConsole({
  question,
  setQuestion,
  loading,
  researchDepth,
  setResearchDepth,
  outputFormat,
  setOutputFormat,
  onSubmit
}: ResearchInputConsoleProps) {
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
        Specify your research prompt or academic paper goal. ResearchFlow AI will orchestrate stateful agents to query live web sources, index vectors into pgvector, synthesize insights, and generate verifiable citations.
      </p>

      {/* Quick Starter Templates */}
      <div className="mb-6">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#CC6F00] flex items-center gap-1.5 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-[#F2A900]" />
          Quick Topic Starter Templates:
        </span>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tmpl, idx) => (
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

      {/* Input Form */}
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {/* Textarea Input */}
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Write a comprehensive technical overview of Multi-Agent RAG architectures, vector indexing strategies, and automated peer-review loops..."
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
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-8 py-3 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold shadow-[0_10px_25px_rgba(204,111,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm border-2 border-[#CC6F00]/40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#4D2A00]" />
                Executing LangGraph Pipeline...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Launch Multi-Agent Research
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
