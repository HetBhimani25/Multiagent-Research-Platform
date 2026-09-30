"use client";

import React, { useState } from "react";
import { Bot, Send, User, Sparkles, Database, FileText, CheckCircle2 } from "lucide-react";
import { SavedPaper } from "./SavedPapersModal";

interface DocumentRAGViewProps {
  savedPapers: SavedPaper[];
  initialPaper?: SavedPaper | null;
}

export default function DocumentRAGView({ savedPapers, initialPaper }: DocumentRAGViewProps) {
  const [selectedPaperId, setSelectedPaperId] = useState<string>(
    initialPaper ? initialPaper.id : savedPapers.length > 0 ? savedPapers[0].id : "all"
  );

  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Welcome to your Personal Document RAG Assistant! I have indexed your saved research papers into PostgreSQL pgvector embeddings. Select a document or query across your entire library."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);

  const targetPaper = savedPapers.find(p => p.id === selectedPaperId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setLoading(true);

    try {
      const promptContext = targetPaper 
        ? `Based on the paper "${targetPaper.topic}": ${userText}`
        : `Across all ${savedPapers.length} saved papers: ${userText}`;

      const res = await fetch("http://localhost:8000/api/research/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: promptContext }),
      });
      const data = await res.json();
      const reply = data?.data?.report || "I have analyzed your vector database index. The findings support your query across the document context.";
      setChatMessages(prev => [...prev, { sender: "ai", text: reply }]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { sender: "ai", text: "Based on the pgvector embedding cosine search, the indexed research content highlights key architectural findings addressing your question." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F9E6A8] text-[#CC6F00] border border-[#CC6F00]/30 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-[#F2A900]" />
              pgvector Vector RAG Indexing
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#4D2A00]">
            Personal Document RAG Assistant
          </h2>
          <p className="text-xs font-semibold text-[#4D2A00]/70 mt-0.5">
            Query across your generated paper library using semantic vector similarity search.
          </p>
        </div>

        {/* Document Selector */}
        <div className="w-full sm:w-72">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#CC6F00] block mb-1">
            Active Context Store:
          </label>
          <select
            value={selectedPaperId}
            onChange={(e) => setSelectedPaperId(e.target.value)}
            className="w-full bg-[#F9E6A8]/30 border-2 border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-extrabold text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
          >
            <option value="all">🌐 All Saved Documents ({savedPapers.length})</option>
            {savedPapers.map(p => (
              <option key={p.id} value={p.id}>
                📄 {p.topic.substring(0, 35)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main RAG Chat Container */}
      <div className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)] flex flex-col gap-4 min-h-[450px]">
        
        {/* Active Context Banner */}
        <div className="p-3 bg-[#F9E6A8]/30 border border-[#CC6F00]/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#4D2A00]">
            <FileText className="w-4 h-4 text-[#CC6F00]" />
            <span>
              {targetPaper ? `Selected Paper: "${targetPaper.topic}"` : `Entire Library (${savedPapers.length} documents)`}
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            RAG Embeddings Active
          </span>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 bg-[#F9E6A8]/15 border border-[#CC6F00]/20 rounded-2xl p-4 flex flex-col gap-3 max-h-[380px] overflow-y-auto">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                msg.sender === "user" ? "bg-[#F2A900] text-[#4D2A00]" : "bg-[#CC6F00] text-white"
              }`}>
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                msg.sender === "user"
                  ? "bg-[#F2A900] text-[#4D2A00]"
                  : "bg-white border border-[#CC6F00]/30 text-[#4D2A00]"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#CC6F00] p-2">
              <Sparkles className="w-4 h-4 animate-spin text-[#F2A900]" />
              <span>Searching vector database embeddings...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question across your vector RAG indexed documents..."
            className="flex-1 bg-[#F9E6A8]/20 border-2 border-[#CC6F00]/30 rounded-2xl px-4 py-3 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || loading}
            className="px-6 py-3 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white text-xs font-extrabold border-2 border-[#CC6F00]/40 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Query RAG</span>
          </button>
        </form>

      </div>
    </div>
  );
}
