"use client";

import React, { useState } from "react";
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Clock, 
  ArrowUpRight, 
  Trash2, 
  MessageSquare, 
  Share2, 
  Sparkles,
  FileDown,
  BookOpen
} from "lucide-react";
import { SavedPaper } from "./SavedPapersModal";

interface MyDocumentsViewProps {
  savedPapers: SavedPaper[];
  onSelectPaper: (paper: SavedPaper) => void;
  onDeletePaper: (id: string) => void;
  onNavigateToGenerate: () => void;
  onNavigateToRAG: (paper: SavedPaper) => void;
}

export default function MyDocumentsView({
  savedPapers,
  onSelectPaper,
  onDeletePaper,
  onNavigateToGenerate,
  onNavigateToRAG
}: MyDocumentsViewProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [paperToDelete, setPaperToDelete] = useState<SavedPaper | null>(null);

  const filteredPapers = savedPapers.filter(p => 
    p.topic.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.report.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Title & Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F9E6A8] text-[#CC6F00] border border-[#CC6F00]/30">
              Personal Workspace Library
            </span>
            <span className="text-xs font-bold text-[#4D2A00]/70">
              {savedPapers.length} Documents
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#4D2A00]">
            My Research Documents & Papers
          </h2>
          <p className="text-xs font-semibold text-[#4D2A00]/70 mt-0.5">
            Manage your autonomous research papers, chat with vector context, and collaborate with team members.
          </p>
        </div>

        <button
          onClick={onNavigateToGenerate}
          className="px-6 py-3 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-sm shadow-[0_10px_25px_rgba(204,111,0,0.3)] transition-all flex items-center gap-2 border-2 border-[#CC6F00]/40 shrink-0 self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate New Paper</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      {savedPapers.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-[#CC6F00] absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search documents by topic title or keyword..."
            className="w-full bg-white border-2 border-[#CC6F00]/30 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-semibold text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-xs"
          />
        </div>
      )}

      {/* Empty State Hero (If 0 Papers Exist) */}
      {savedPapers.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#CC6F00]/40 rounded-3xl p-10 sm:p-16 text-center flex flex-col items-center justify-center gap-4 shadow-[0_20px_50px_rgba(204,111,0,0.15)] relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#F2A900] to-[#CC6F00] p-1 shadow-lg shadow-[#CC6F00]/20 flex items-center justify-center mb-2">
            <div className="w-full h-full bg-[#F9E6A8] rounded-[20px] flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-[#CC6F00]" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[#4D2A00]">
              No Research Papers Generated Yet
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-[#4D2A00]/70 max-w-md mx-auto mt-1 leading-relaxed">
              Start your first autonomous research journey with ResearchFlow AI. Our 10-Agent LangGraph engine will decompose topics, query live web sources, index vectors, and synthesize academic reports for you!
            </p>
          </div>

          <button
            onClick={onNavigateToGenerate}
            className="mt-2 px-8 py-3.5 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-sm shadow-[0_12px_30px_rgba(204,111,0,0.35)] transition-all flex items-center gap-2 border-2 border-[#CC6F00]/40"
          >
            <Sparkles className="w-4 h-4 text-[#CC6F00]" />
            <span>Generate Your First Research Paper</span>
          </button>
        </div>
      ) : (
        /* Document Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)] hover:border-[#CC6F00] hover:shadow-[0_20px_55px_rgba(242,169,0,0.35)] transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#F2A900] text-[#4D2A00] px-2.5 py-0.5 rounded-full border border-[#CC6F00]/30">
                    {paper.depth || "Deep"} Depth
                  </span>
                  <span className="text-[10px] font-bold text-[#CC6F00] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(paper.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Title & Preview */}
                <h3 className="text-base font-extrabold text-[#4D2A00] line-clamp-2 leading-snug group-hover:text-[#CC6F00] transition-colors mb-2">
                  {paper.topic}
                </h3>
                <p className="text-xs font-semibold text-[#4D2A00]/70 line-clamp-3 leading-relaxed mb-4">
                  {paper.report.substring(0, 160)}...
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="pt-4 border-t border-[#CC6F00]/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {/* Read Paper */}
                  <button
                    onClick={() => onSelectPaper(paper)}
                    className="px-3 py-1.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white text-xs font-extrabold transition-all shadow-xs flex items-center gap-1 border border-[#CC6F00]/30"
                  >
                    <span>Read</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Chat RAG */}
                  <button
                    onClick={() => onNavigateToRAG(paper)}
                    className="p-1.5 rounded-xl bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] text-[#4D2A00] border border-[#CC6F00]/30 transition-all"
                    title="Chat with Document Vector Context"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#CC6F00]" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {/* Delete Paper Trigger Confirmation */}
                  <button
                    onClick={() => setPaperToDelete(paper)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {paperToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 border border-rose-300 rounded-2xl text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#4D2A00]">
                  Delete Research Paper?
                </h3>
                <p className="text-xs font-semibold text-[#4D2A00]/70 mt-0.5">
                  Confirmation required
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold text-[#4D2A00]/80 bg-[#F9E6A8]/30 p-3.5 rounded-2xl border border-[#CC6F00]/20 leading-relaxed">
              Are you sure you want to delete <span className="font-extrabold text-[#4D2A00]">"{paperToDelete.topic}"</span>? This action cannot be undone and will remove the paper and its pgvector RAG context.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPaperToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeletePaper(paperToDelete.id);
                  setPaperToDelete(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
