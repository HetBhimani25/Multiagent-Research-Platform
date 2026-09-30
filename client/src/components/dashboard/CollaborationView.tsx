"use client";

import React, { useState } from "react";
import { Users, Plus, Share2, Copy, Check, Lock, ShieldCheck, UserCheck, Sparkles } from "lucide-react";
import { SavedPaper } from "./SavedPapersModal";

interface CollaborationViewProps {
  savedPapers: SavedPaper[];
}

export default function CollaborationView({ savedPapers }: CollaborationViewProps) {
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedRoomId(code);
    setTimeout(() => setCopiedRoomId(null), 2000);
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

        <button
          className="px-6 py-3 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-sm shadow-[0_10px_25px_rgba(204,111,0,0.3)] transition-all flex items-center gap-2 border-2 border-[#CC6F00]/40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Shared Workspace</span>
        </button>
      </div>

      {/* Active Workspaces List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {savedPapers.length === 0 ? (
          <div className="col-span-full bg-white border-2 border-dashed border-[#CC6F00]/30 rounded-3xl p-10 text-center">
            <Users className="w-12 h-12 text-[#CC6F00]/50 mx-auto mb-2" />
            <h3 className="text-base font-extrabold text-[#4D2A00]">No Collaborative Workspaces Active</h3>
            <p className="text-xs font-semibold text-[#4D2A00]/70 mt-1">
              Generate a research paper first to create a multi-user collaboration session with team members.
            </p>
          </div>
        ) : (
          savedPapers.map((paper, idx) => {
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
                      Active Collaborators:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#F2A900] text-[#4D2A00] font-black text-xs flex items-center justify-center border border-[#CC6F00]/30" title="Workspace Owner">
                        U1
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-[#CC6F00] text-white font-black text-xs flex items-center justify-center border border-[#CC6F00]/30" title="Peer Editor">
                        E2
                      </div>
                      <span className="text-xs font-semibold text-[#4D2A00]/70">
                        + Invite more researchers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Share Link Actions */}
                <div className="pt-4 border-t border-[#CC6F00]/20 flex items-center justify-between gap-2">
                  <button
                    onClick={() => copyRoomCode(roomCode)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] border border-[#CC6F00]/30 text-xs font-extrabold text-[#4D2A00] transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {copiedRoomId === roomCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Invite Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-[#CC6F00]" />
                        <span>Copy Share Code</span>
                      </>
                    )}
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
