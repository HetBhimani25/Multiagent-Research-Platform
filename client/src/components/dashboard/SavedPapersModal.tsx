"use client";

import React, { useState } from "react";
import { X, BookOpen, Clock, Trash2, ArrowUpRight, Search } from "lucide-react";

export interface SavedPaper {
  id: string;
  topic: string;
  report: string;
  createdAt: string;
  depth: string;
  format: string;
  docType?: string;
  workspaceId?: string;
  workspaceName?: string;
  status?: string;
  role?: string;
  isOwner?: boolean;
  owner?: { id: string; fullName: string; email: string };
  collaboratorCount?: number;
  members?: Array<{ id: string; userId: string; role: string; user?: { fullName: string } }>;
}

interface SavedPapersModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPapers: SavedPaper[];
  onSelectPaper: (paper: SavedPaper) => void;
  onDeletePaper: (id: string) => void;
}

export default function SavedPapersModal({
  isOpen,
  onClose,
  savedPapers,
  onSelectPaper,
  onDeletePaper
}: SavedPapersModalProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [paperToDelete, setPaperToDelete] = useState<SavedPaper | null>(null);

  if (!isOpen) return null;

  const filteredPapers = savedPapers.filter(p => 
    p.topic.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.report.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CC6F00]/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F2A900]/20 border border-[#CC6F00]/30 rounded-xl text-[#CC6F00]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#4D2A00]">
                Saved Research Papers Library
              </h3>
              <p className="text-xs font-semibold text-[#4D2A00]/70">
                {savedPapers.length} papers saved in local workspace
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

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-[#CC6F00] absolute left-3 top-3" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search saved papers by topic keyword..."
            className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
          />
        </div>

        {/* Papers List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {filteredPapers.length === 0 ? (
            <div className="text-center py-12 p-6 bg-[#F9E6A8]/20 rounded-2xl border border-[#CC6F00]/20">
              <BookOpen className="w-10 h-10 text-[#CC6F00]/50 mx-auto mb-2" />
              <p className="text-sm font-extrabold text-[#4D2A00]">No saved papers found</p>
              <p className="text-xs font-semibold text-[#4D2A00]/70 mt-1">
                Generated research papers will automatically save to your workspace library.
              </p>
            </div>
          ) : (
            filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="p-4 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl hover:border-[#CC6F00] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {paper.docType && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#F9E6A8] text-[#CC6F00] px-2 py-0.5 rounded-md border border-[#CC6F00]/30">
                        {paper.docType.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#F2A900] text-[#4D2A00] px-2 py-0.5 rounded-md border border-[#CC6F00]/30">
                      {paper.depth || "Deep"} Depth
                    </span>
                    <span className="text-[10px] font-bold text-[#CC6F00] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-[#4D2A00] line-clamp-1">
                    {paper.topic}
                  </h4>
                  <p className="text-xs font-semibold text-[#4D2A00]/70 line-clamp-2 mt-1">
                    {paper.report.substring(0, 140)}...
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      onSelectPaper(paper);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white text-xs font-extrabold border border-[#CC6F00]/30 transition-all flex items-center gap-1"
                  >
                    <span>View</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setPaperToDelete(paper)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                    title="Delete saved paper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Inner Delete Confirmation Dialog */}
        {paperToDelete && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-xs rounded-3xl flex items-center justify-center p-4">
            <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 border border-rose-300 rounded-2xl text-rose-600">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#4D2A00]">
                    Delete Saved Paper?
                  </h3>
                  <p className="text-xs font-semibold text-[#4D2A00]/70 mt-0.5">
                    Confirmation required
                  </p>
                </div>
              </div>

              <p className="text-xs font-semibold text-[#4D2A00]/80 bg-[#F9E6A8]/30 p-3.5 rounded-2xl border border-[#CC6F00]/20 leading-relaxed">
                Are you sure you want to delete <span className="font-extrabold text-[#4D2A00]">"{paperToDelete.topic}"</span>? This will remove the document permanently from your workspace.
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
                    const idToDelete = paperToDelete.id;
                    setPaperToDelete(null);
                    onDeletePaper(idToDelete);
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Document</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
