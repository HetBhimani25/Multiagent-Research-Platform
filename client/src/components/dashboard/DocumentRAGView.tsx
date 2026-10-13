"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Database,
  FileText,
  CheckCircle2,
  Upload,
  FileUp,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  Layers,
  BookOpen,
  AlertCircle,
  HelpCircle,
  X
} from "lucide-react";
import { SavedPaper } from "./SavedPapersModal";

interface RetrievedSource {
  chunk_id: string;
  doc_id: string;
  doc_title: string;
  text: string;
  chunk_index: number;
  source_type: string;
  score: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: RetrievedSource[];
  confidence?: number;
  totalChunks?: number;
  timestamp: string;
}

interface RAGStats {
  total_documents: number;
  total_chunks: number;
  documents: Array<{
    id: string;
    title: string;
    source_type: string;
    chunk_count: number;
    char_count: number;
  }>;
}

interface DocumentRAGViewProps {
  savedPapers: SavedPaper[];
  initialPaper?: SavedPaper | null;
}

const SAMPLE_PAPER = {
  id: "sample_autonomous_agents_2026",
  topic: "Autonomous Multi-Agent Architecture for Real-Time Traffic Optimization",
  report: `# Autonomous Multi-Agent Architecture for Real-Time Traffic Optimization

## Executive Summary
Urban transit networks suffer from significant throughput bottlenecks under static signal control regimes. This paper proposes an autonomous multi-agent state graph architecture leveraging cooperative LangGraph pipelines, localized edge inference, and asynchronous vector indexing.

## Core Architectural Components
1. **Perception & Telemetry Ingestion Node**: Collects continuous radar, camera, and loop-detector telemetry at 50Hz.
2. **State Graph Orchestration**: Evaluates dynamic phase durations using decentralized reinforcement learning.
3. **Fail-Safe Fallback Interlock**: Guarantees deterministic signal timing constraints even during cloud network disconnections.

## Empirical Evaluation & Results
In simulated multi-intersection metropolitan corridors (SUMO simulation suite):
- Average vehicular wait times decreased by **34.2%** during peak congestion.
- Carbon emissions and idling fuel consumption decreased by **19.8%**.
- State convergence was achieved within **120 iterations** under high stochastic traffic variability.

## Limitations & Future Directions
Current models assume fully compliant autonomous and connected vehicles. Future iterations will incorporate mixed-autonomy driving behaviors and dynamic emergency vehicle preemption routing.`
};

export default function DocumentRAGView({ savedPapers, initialPaper }: DocumentRAGViewProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialPaper ? initialPaper.id : "all"
  );

  const [stats, setStats] = useState<RAGStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "👋 Welcome to your **Personal Document RAG Assistant**!\n\nI perform **dense vector similarity and BM25 hybrid retrieval** across your research library. You can query your saved research papers, upload new PDF/TXT documents, or select a specific paper as your context store.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [chatInput, setChatInput] = useState("");
  const [querying, setQuerying] = useState(false);
  const [expandedSources, setExpandedSources] = useState<{ [msgId: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync saved papers to RAG vector store on mount or when savedPapers changes
  useEffect(() => {
    syncLibraryToRAG();
  }, [savedPapers]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, querying]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("http://localhost:8000/api/rag/stats");
      if (res.ok) {
        const json = await res.json();
        setStats(json.data);
      }
    } catch (e) {
      console.warn("Failed to fetch RAG stats:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const syncLibraryToRAG = async () => {
    if (!savedPapers || savedPapers.length === 0) {
      await fetchStats();
      return;
    }
    try {
      setLoadingStats(true);
      await fetch("http://localhost:8000/api/rag/sync-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          papers: savedPapers.map(p => ({
            id: p.id,
            topic: p.topic,
            report: p.report,
            depth: p.depth,
            docType: p.docType
          }))
        })
      });
      await fetchStats();
    } catch (err) {
      console.error("Error syncing library with RAG engine:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("http://localhost:8000/api/rag/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_id: SAMPLE_PAPER.id,
          title: SAMPLE_PAPER.topic,
          content: SAMPLE_PAPER.report,
          source_type: "sample_paper"
        })
      });
      if (res.ok) {
        setSelectedDocId(SAMPLE_PAPER.id);
        await fetchStats();
        setChatMessages(prev => [
          ...prev,
          {
            id: `sample_${Date.now()}`,
            sender: "ai",
            text: `📄 **Sample Paper Loaded:** *"Autonomous Multi-Agent Architecture for Real-Time Traffic Optimization"*\n\nIt has been indexed into semantic vector chunks. Ask a question or click one of the suggested prompts below!`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } catch (err) {
      console.error("Error loading sample paper:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/rag/upload", {
        method: "POST",
        body: formData
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || "Failed to process document upload.");
      }

      setUploadModalOpen(false);
      setSelectedDocId(json.doc_id);
      await fetchStats();

      setChatMessages(prev => [
        ...prev,
        {
          id: `upload_${Date.now()}`,
          sender: "ai",
          text: `✅ **Successfully Uploaded & Indexed:** *"${json.title}"*\n\n- **File**: \`${json.filename}\`\n- **Extracted Content**: ${json.char_count.toLocaleString()} characters\n- **Vector Chunks Generated**: **${json.chunks_created}** chunks\n\nYou can now query this document directly!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || querying) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setQuerying(true);

    try {
      const res = await fetch("http://localhost:8000/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          doc_id: selectedDocId,
          top_k: 5
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || "Error querying RAG assistant.");
      }

      const ragData = json.data;
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: ragData.answer,
        sources: ragData.sources,
        confidence: ragData.confidence,
        totalChunks: ragData.total_chunks_evaluated,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "ai",
          text: `⚠️ **RAG Query Error**: ${err.message || "Could not retrieve response from AI Engine."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setQuerying(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Build combined document options (saved papers + uploaded documents from stats)
  const allDocOptions = [
    { id: "all", title: `🌐 Entire Knowledge Base (${stats?.total_documents || savedPapers.length} docs, ${stats?.total_chunks || 0} chunks)` }
  ];

  if (stats && stats.documents) {
    stats.documents.forEach(d => {
      allDocOptions.push({
        id: d.id,
        title: `${d.source_type === "uploaded_file" ? "📁" : "📄"} ${d.title.substring(0, 45)} (${d.chunk_count} chunks)`
      });
    });
  } else {
    savedPapers.forEach(p => {
      allDocOptions.push({
        id: p.id,
        title: `📄 ${p.topic.substring(0, 45)}`
      });
    });
  }

  const selectedDocTitle = allDocOptions.find(o => o.id === selectedDocId)?.title || "Entire Library";

  const suggestedPrompts = [
    "What are the primary findings and contributions?",
    "Explain the system architecture and implementation details",
    "What empirical benchmarks and evaluation metrics are reported?",
    "What limitations and future directions are identified?"
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* ── Header & RAG Controller ── */}
      <div className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F9E6A8] text-[#CC6F00] border border-[#CC6F00]/30 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#F2A900]" />
              Hybrid Vector RAG (Dense + BM25)
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {stats ? `${stats.total_chunks} Chunks Indexed` : "Indexing Active"}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#4D2A00]">
            Personal Document RAG Assistant
          </h2>
          <p className="text-xs font-semibold text-[#4D2A00]/70 mt-0.5">
            Query across your synthesized research papers and uploaded external documents with semantic grounding.
          </p>
        </div>

        {/* Action Controls & Scope Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Document Scope Selector */}
          <div className="min-w-[240px]">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#CC6F00] block mb-1">
              Active Context Store:
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full bg-[#F9E6A8]/30 border-2 border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-extrabold text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900] truncate"
            >
              {allDocOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.title}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Button */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white text-xs font-extrabold border-2 border-[#CC6F00]/40 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap mt-auto"
              title="Upload PDF, TXT or Markdown file"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload Doc</span>
            </button>

            <button
              onClick={syncLibraryToRAG}
              disabled={loadingStats}
              className="p-2 rounded-xl bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] text-[#CC6F00] border-2 border-[#CC6F00]/30 transition-all flex items-center justify-center shadow-sm mt-auto disabled:opacity-50"
              title="Sync Library Documents"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`} />
            </button>
          </div>

        </div>
      </div>

      {/* ── Active Context & Quick Actions Banner ── */}
      <div className="p-4 bg-[#F9E6A8]/35 border-2 border-[#CC6F00]/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs font-extrabold text-[#4D2A00]">
          <div className="p-1.5 bg-[#F2A900]/40 rounded-lg">
            <FileText className="w-4 h-4 text-[#CC6F00]" />
          </div>
          <div>
            <span className="text-[#CC6F00] uppercase text-[10px] tracking-wider block font-black">
              Query Scope
            </span>
            <span className="font-extrabold text-xs">
              {selectedDocTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(!stats || stats.total_documents === 0) && (
            <button
              onClick={handleLoadSample}
              disabled={loadingStats}
              className="px-3 py-1.5 rounded-xl bg-[#CC6F00] text-white hover:bg-[#B35F00] text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Load Sample Research Paper</span>
            </button>
          )}

          <button
            onClick={() => setChatMessages([chatMessages[0]])}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-red-50 text-[#4D2A00]/70 hover:text-red-700 text-[11px] font-bold border border-[#CC6F00]/20 transition-all"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* ── Main Chat Thread & Interaction Console ── */}
      <div className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)] flex flex-col gap-4 min-h-[520px]">
        
        {/* Messages Feed */}
        <div className="flex-1 bg-[#F9E6A8]/15 border border-[#CC6F00]/20 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-h-[380px] max-h-[520px] overflow-y-auto">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-[90%] sm:max-w-[85%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                  msg.sender === "user"
                    ? "bg-[#F2A900] text-[#4D2A00]"
                    : "bg-[#CC6F00] text-white"
                }`}
              >
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-1.5 max-w-full">
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                    msg.sender === "user"
                      ? "bg-[#F2A900] text-[#4D2A00] rounded-tr-none"
                      : "bg-white border border-[#CC6F00]/30 text-[#4D2A00] rounded-tl-none"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="prose prose-xs max-w-none text-[#4D2A00] leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* AI Grounding Evidence Accordion */}
                {msg.sender === "ai" && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 flex flex-col gap-1.5">
                    <button
                      onClick={() => toggleSources(msg.id)}
                      className="self-start px-2.5 py-1 rounded-lg bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] border border-[#CC6F00]/30 text-[10px] font-black text-[#CC6F00] flex items-center gap-1.5 transition-all"
                    >
                      <Layers className="w-3 h-3 text-[#F2A900]" />
                      <span>{msg.sources.length} Retrieved Evidence Chunks</span>
                      {msg.confidence !== undefined && (
                        <span className="text-emerald-700 font-extrabold ml-1">
                          • {msg.confidence}% Match
                        </span>
                      )}
                      {expandedSources[msg.id] ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {/* Collapsible Chunks Details */}
                    {expandedSources[msg.id] && (
                      <div className="p-3 bg-amber-50/70 border border-[#CC6F00]/20 rounded-xl flex flex-col gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#CC6F00]">
                          Retrieved Context Passages:
                        </span>
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={src.chunk_id || sIdx}
                            className="p-2.5 bg-white border border-[#CC6F00]/20 rounded-lg flex flex-col gap-1 text-[11px]"
                          >
                            <div className="flex items-center justify-between text-[10px] font-black text-[#4D2A00]/80">
                              <span className="text-[#CC6F00] font-extrabold">
                                📌 [Source {sIdx + 1}]: {src.doc_title} (Chunk #{src.chunk_index})
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black">
                                {Math.round(src.score * 100)}% Match
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-[#4D2A00]/90 italic bg-[#F9E6A8]/10 p-1.5 rounded leading-normal border-l-2 border-[#F2A900]">
                              "{src.text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer bar with Timestamp & Copy */}
                <div className="flex items-center gap-2 text-[10px] text-[#4D2A00]/60 px-1">
                  <span>{msg.timestamp}</span>
                  {msg.sender === "ai" && (
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="hover:text-[#CC6F00] transition-colors flex items-center gap-0.5 ml-2"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {querying && (
            <div className="flex items-center gap-3 p-3 bg-white border border-[#CC6F00]/30 rounded-2xl self-start max-w-md shadow-xs animate-pulse">
              <div className="w-7 h-7 rounded-xl bg-[#CC6F00] text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin text-[#F2A900]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[#4D2A00]">
                  Retrieving Chunks & Synthesizing Answer...
                </span>
                <span className="text-[10px] font-bold text-[#CC6F00]">
                  Executing Cosine Dense + BM25 Vector Search on Qwen 3.8
                </span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* ── Suggested Prompts Chips ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#CC6F00] whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#F2A900]" />
            Suggested:
          </span>
          {suggestedPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleQuery(prompt)}
              disabled={querying}
              className="px-3 py-1 rounded-full bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] border border-[#CC6F00]/30 text-[11px] font-bold text-[#4D2A00] whitespace-nowrap transition-all shadow-2xs hover:scale-[1.02] disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* ── Input Box Form ── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(chatInput);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`Ask a question across ${selectedDocId === "all" ? "all documents" : "the selected paper"}...`}
            disabled={querying}
            className="flex-1 bg-[#F9E6A8]/20 border-2 border-[#CC6F00]/30 rounded-2xl px-4 py-3 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900] placeholder:text-[#4D2A00]/50"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || querying}
            className="px-6 py-3 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white text-xs font-black border-2 border-[#CC6F00]/40 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Query RAG</span>
          </button>
        </form>

      </div>

      {/* ── Document Upload Modal ── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-3 border-[#CC6F00] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#CC6F00]/20 pb-3">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-[#CC6F00]" />
                <h3 className="text-lg font-black text-[#4D2A00]">
                  Upload to Vector Knowledge Base
                </h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-[#4D2A00]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-[#4D2A00]/80">
              Upload research documents (PDF, TXT, Markdown). Files will be parsed, split into semantic overlapping chunks, and indexed into vector embeddings for instant semantic search.
            </p>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Drag & Drop / File Input Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#CC6F00]/40 hover:border-[#CC6F00] bg-[#F9E6A8]/20 hover:bg-[#F9E6A8]/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F2A900] text-[#4D2A00] flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="text-xs font-black text-[#4D2A00] block">
                  Click to select or drag & drop file
                </span>
                <span className="text-[10px] font-bold text-[#CC6F00] block mt-0.5">
                  Supported: .PDF, .TXT, .MD
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.markdown"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {uploading && (
              <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-xl text-xs font-bold text-[#CC6F00]">
                <Sparkles className="w-4 h-4 animate-spin text-[#F2A900]" />
                <span>Parsing file & generating vector chunks...</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                disabled={uploading}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-[#4D2A00] hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
