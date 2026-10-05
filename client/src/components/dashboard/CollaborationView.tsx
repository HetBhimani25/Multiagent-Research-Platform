"use client";

import React, { useState } from "react";
import { Users, Plus, Share2, Copy, Check, UserCheck, LogIn, ExternalLink, Sparkles } from "lucide-react";
import { SavedPaper } from "./SavedPapersModal";

interface CollaborationViewProps {
  savedPapers: SavedPaper[];
  onOpenCollab?: (paper: SavedPaper | null, roomId: string) => void;
}

export default function CollaborationView({ savedPapers, onOpenCollab }: CollaborationViewProps) {
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState<boolean>(false);
  const [inviteCodeInput, setInviteCodeInput] = useState<string>("");

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedRoomId(code);
    setTimeout(() => setCopiedRoomId(null), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    const cleanCode = inviteCodeInput.trim().toUpperCase();
    setJoinModalOpen(false);
    setInviteCodeInput("");
    if (onOpenCollab) {
      onOpenCollab(null, cleanCode);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F2A900] text-[#4D2A00] border border-[#CC6F00]/30">
              Multi-User Real-time Collaboration
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#4D2A00]">
            Collaborative Research Workspaces
          </h2>
          <p className="text-xs font-semibold text-[#4D2A00]/70 mt-0.5">
            Invite co-authors, researchers, and peer reviewers to edit and refine research papers together in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setJoinModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white hover:bg-[#F9E6A8]/50 text-[#4D2A00] font-extrabold text-sm border-2 border-[#CC6F00]/40 shadow-sm transition-all flex items-center gap-2"
          >
            <LogIn className="w-4 h-4 text-[#CC6F00]" />
            <span>Join with Code</span>
          </button>

          {savedPapers.length > 0 && (
            <button
              onClick={() => {
                const firstPaper = savedPapers[0];
                const code = `RF-COLLAB-${firstPaper.id.substring(0, 6).toUpperCase()}`;
                if (onOpenCollab) onOpenCollab(firstPaper, code);
              }}
              className="px-6 py-3 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-sm shadow-[0_10px_25px_rgba(204,111,0,0.3)] transition-all flex items-center gap-2 border-2 border-[#CC6F00]/40"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Shared Workspace</span>
            </button>
          )}
        </div>
      </div>

      {/* Join Room Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4D2A00]/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl p-6 max-w-md w-full shadow-[0_20px_50px_rgba(204,111,0,0.3)]">
            <h3 className="text-lg font-extrabold text-[#4D2A00] mb-1">Join Collaborative Workspace</h3>
            <p className="text-xs font-semibold text-[#4D2A00]/70 mb-4">
              Enter the unique Workspace Invite Code (e.g. <code className="font-mono text-[#CC6F00] font-extrabold">RF-COLLAB-8F29A1</code>) provided by your co-author.
            </p>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-[#4D2A00] block mb-1">
                  Invite Code:
                </label>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="RF-COLLAB-XXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CC6F00]/30 font-mono uppercase text-sm font-extrabold text-[#4D2A00] bg-[#F9E6A8]/20 focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#CC6F00]/30 text-xs font-extrabold text-[#4D2A00] hover:bg-[#F9E6A8]/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inviteCodeInput.trim()}
                  className="px-5 py-2 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs border border-[#CC6F00]/40 disabled:opacity-50"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Workspaces List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {savedPapers.length === 0 ? (
          <div className="col-span-full bg-white border-2 border-dashed border-[#CC6F00]/30 rounded-3xl p-10 text-center">
            <Users className="w-12 h-12 text-[#CC6F00]/50 mx-auto mb-2" />
            <h3 className="text-base font-extrabold text-[#4D2A00]">No Collaborative Workspaces Active</h3>
            <p className="text-xs font-semibold text-[#4D2A00]/70 mt-1 mb-4">
              Generate a research document first or click "Join with Code" to connect to an existing co-author session.
            </p>
            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs border border-[#CC6F00]/40 inline-flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Join via Invite Code</span>
            </button>
          </div>
        ) : (
          savedPapers.map((paper) => {
            const roomCode = `RF-COLLAB-${paper.id.substring(0, 6).toUpperCase()}`;

            return (
              <div
                key={paper.id}
                className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#F9E6A8] text-[#CC6F00] px-2.5 py-0.5 rounded-full border border-[#CC6F00]/30 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-[#F2A900]" />
                      Multi-User Ready
                    </span>
                    <span className="text-[10px] font-mono font-extrabold text-[#4D2A00] bg-[#F9E6A8]/40 px-2 py-0.5 rounded-md border border-[#CC6F00]/20">
                      {roomCode}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#4D2A00] line-clamp-1 mb-2">
                    {paper.topic}
                  </h3>

                  {/* Active Collaborators Badges */}
                  <div className="mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#CC6F00] block mb-1.5">
                      Active Workspace Session:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#F2A900] text-[#4D2A00] font-black text-xs flex items-center justify-center border border-[#CC6F00]/30" title="Workspace Owner (Het Bhimani)">
                        👨‍💻
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-[#CC6F00] text-white font-black text-xs flex items-center justify-center border border-[#CC6F00]/30" title="Peer Researcher">
                        🔬
                      </div>
                      <span className="text-xs font-semibold text-[#4D2A00]/70">
                        Live WebSockets Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Share Link & Launch Actions */}
                <div className="pt-4 border-t border-[#CC6F00]/20 flex items-center justify-between gap-2">
                  <button
                    onClick={() => copyRoomCode(roomCode)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] border border-[#CC6F00]/30 text-xs font-extrabold text-[#4D2A00] transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {copiedRoomId === roomCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-[#CC6F00]" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onOpenCollab && onOpenCollab(paper, roomCode)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white border border-[#CC6F00]/40 text-xs font-extrabold text-[#4D2A00] transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Enter Workspace</span>
                  </button>
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}
