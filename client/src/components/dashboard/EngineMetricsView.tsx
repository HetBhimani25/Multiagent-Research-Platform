"use client";

import React from "react";
import { BarChart3, Cpu, Database, Zap, ShieldCheck, Activity } from "lucide-react";

export default function EngineMetricsView() {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F9E6A8] text-[#CC6F00] border border-[#CC6F00]/30 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#F2A900]" />
              System Performance Diagnostics
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#4D2A00]">
            LangGraph Engine & RAG Metrics
          </h2>
          <p className="text-xs font-semibold text-[#4D2A00]/70 mt-0.5">
            Real-time latency metrics, vector database status, and LLM inference diagnostics.
          </p>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-[#4D2A00] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#CC6F00]" />
              Groq Llama-3.3-70B
            </span>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              Active
            </span>
          </div>
          <p className="text-3xl font-black text-[#4D2A00]">1,280 <span className="text-xs font-bold text-[#CC6F00]">tok/sec</span></p>
          <p className="text-xs font-semibold text-[#4D2A00]/70 mt-2">Average LLM inference latency ~ 420ms</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-[#4D2A00] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#CC6F00]" />
              PostgreSQL pgvector
            </span>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              Indexed
            </span>
          </div>
          <p className="text-3xl font-black text-[#4D2A00]">384 <span className="text-xs font-bold text-[#CC6F00]">dim</span></p>
          <p className="text-xs font-semibold text-[#4D2A00]/70 mt-2">all-MiniLM-L6-v2 cosine RAG similarity</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-[#4D2A00] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#CC6F00]" />
              LangGraph State DAG
            </span>
            <span className="text-[10px] font-black text-[#4D2A00] bg-[#F2A900] px-2 py-0.5 rounded-full border border-[#CC6F00]/30">
              Stateful
            </span>
          </div>
          <p className="text-3xl font-black text-[#4D2A00]">10 <span className="text-xs font-bold text-[#CC6F00]">Agents</span></p>
          <p className="text-xs font-semibold text-[#4D2A00]/70 mt-2">Planner $\rightarrow$ Searcher $\rightarrow$ Writer DAG</p>
        </div>

      </div>
    </div>
  );
}
