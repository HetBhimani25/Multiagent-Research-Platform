"use client";

import React from "react";
import { X, BarChart3, Cpu, Database, Zap, ShieldCheck } from "lucide-react";

interface EngineMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EngineMetricsModal({ isOpen, onClose }: EngineMetricsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CC6F00]/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F2A900]/20 border border-[#CC6F00]/30 rounded-xl text-[#CC6F00]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#4D2A00]">
                LangGraph Multi-Agent Engine Metrics
              </h3>
              <p className="text-xs font-semibold text-[#4D2A00]/70">
                Live performance diagnostics & vector database health
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: LLM Engine */}
          <div className="p-4 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[#4D2A00] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#CC6F00]" />
                Groq Llama-3.3-70B
              </span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                Active
              </span>
            </div>
            <p className="text-2xl font-black text-[#4D2A00]">1,280 <span className="text-xs font-bold text-[#CC6F00]">tok/sec</span></p>
            <p className="text-[10px] font-semibold text-[#4D2A00]/70 mt-1">Average LLM inference latency ~ 420ms</p>
          </div>

          {/* Card 2: Vector DB */}
          <div className="p-4 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[#4D2A00] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#CC6F00]" />
                PostgreSQL pgvector
              </span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                Indexed
              </span>
            </div>
            <p className="text-2xl font-black text-[#4D2A00]">384 <span className="text-xs font-bold text-[#CC6F00]">dim</span></p>
            <p className="text-[10px] font-semibold text-[#4D2A00]/70 mt-1">all-MiniLM-L6-v2 cosine RAG similarity</p>
          </div>

          {/* Card 3: Agents Count */}
          <div className="p-4 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[#4D2A00] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#CC6F00]" />
                LangGraph State Machine
              </span>
              <span className="text-[10px] font-black text-[#4D2A00] bg-[#F2A900] px-2 py-0.5 rounded-md border border-[#CC6F00]/30">
                Stateful
              </span>
            </div>
            <p className="text-2xl font-black text-[#4D2A00]">10 <span className="text-xs font-bold text-[#CC6F00]">Agents</span></p>
            <p className="text-[10px] font-semibold text-[#4D2A00]/70 mt-1">Planner $\rightarrow$ Searcher $\rightarrow$ Writer DAG</p>
          </div>

          {/* Card 4: Security & Quotas */}
          <div className="p-4 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[#4D2A00] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#CC6F00]" />
                API Key Protection
              </span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                Secured
              </span>
            </div>
            <p className="text-2xl font-black text-[#4D2A00]">100% <span className="text-xs font-bold text-[#CC6F00]">Local</span></p>
            <p className="text-[10px] font-semibold text-[#4D2A00]/70 mt-1">Zero third-party code push policy</p>
          </div>

        </div>
      </div>
    </div>
  );
}
