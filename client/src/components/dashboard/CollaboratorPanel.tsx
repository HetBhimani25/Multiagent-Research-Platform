"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Crown, 
  UserMinus, 
  ShieldAlert, 
  Check, 
  X, 
  MoreVertical,
  LogOut,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface Member {
  id: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface CollaboratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  isOwner: boolean;
  currentUserId: string;
  authToken: string | null;
  onlineUserIds?: string[];
  onOpenShareModal?: () => void;
}

export default function CollaboratorPanel({
  isOpen,
  onClose,
  workspaceId,
  isOwner,
  currentUserId,
  authToken,
  onlineUserIds = [],
  onOpenShareModal,
}: CollaboratorPanelProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    if (isOpen && workspaceId && authToken) {
      fetchMembers();
    }
  }, [isOpen, workspaceId, authToken]);

  const fetchMembers = async () => {
    if (!authToken || !workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/members`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMembers(data.data);
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!authToken || !workspaceId || !isOwner) return;
    try {
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error("Role change error:", err);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!authToken || !workspaceId || !isOwner) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this research workspace?`)) return;

    try {
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error("Remove member error:", err);
    }
  };

  const handleTransferOwnership = async () => {
    if (!authToken || !workspaceId || !transferTargetId) return;
    setTransferLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/transfer-ownership`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ targetUserId: transferTargetId }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmTransfer(false);
        setTransferTargetId(null);
        fetchMembers();
        alert("Ownership transferred successfully.");
      } else {
        alert(data.message || "Failed to transfer ownership.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l-2 border-[#CC6F00]/40 shadow-[-10px_0_40px_rgba(204,111,0,0.25)] flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="bg-[#F9E6A8] border-b-2 border-[#CC6F00]/30 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F2A900] border border-[#CC6F00]/40 flex items-center justify-center text-[#4D2A00]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#4D2A00]">
              Workspace Team ({members.length})
            </h3>
            <span className="text-[10px] font-bold text-[#CC6F00]">
              Active Collaborators & Roles
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 border border-[#CC6F00]/30 text-[#4D2A00] hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Member List */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3">
        {loading ? (
          <div className="text-center py-10 text-xs text-[#4D2A00]/60 font-semibold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#CC6F00]" />
            <span>Loading members...</span>
          </div>
        ) : (
          members.map((member) => {
            const isMe = member.userId === currentUserId;
            const isMemberOwner = member.role === "OWNER";
            const isOnline = onlineUserIds.includes(member.userId);

            return (
              <div
                key={member.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                  isMemberOwner
                    ? "bg-[#F9E6A8]/30 border-[#CC6F00]/40 shadow-xs"
                    : "bg-white border-[#CC6F00]/20 hover:border-[#CC6F00]/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-[#F2A900] text-[#4D2A00] font-black text-xs flex items-center justify-center border border-[#CC6F00]/30 shrink-0">
                        {member.user?.fullName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      {/* Online dot */}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        isOnline ? "bg-emerald-500" : "bg-slate-300"
                      }`} title={isOnline ? "Online now" : "Offline"} />
                    </div>

                    <div className="truncate min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-[#4D2A00] truncate">
                          {member.user?.fullName}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-bold text-[#CC6F00] bg-[#F9E6A8] px-1.5 py-0.2 rounded-md">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#4D2A00]/60 truncate block">
                        {member.user?.email}
                      </span>
                    </div>
                  </div>

                  {/* Role Badge or Selector */}
                  <div className="shrink-0">
                    {isMemberOwner ? (
                      <span className="px-2.5 py-1 rounded-xl bg-[#F2A900] text-[#4D2A00] text-[10px] font-black border border-[#CC6F00]/40 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-[#4D2A00]" />
                        <span>OWNER</span>
                      </span>
                    ) : isOwner ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="bg-[#F9E6A8]/40 border border-[#CC6F00]/30 rounded-xl px-2 py-1 text-[10px] font-extrabold text-[#4D2A00] focus:outline-none focus:border-[#F2A900]"
                      >
                        <option value="EDITOR">EDITOR</option>
                        <option value="RESEARCHER">RESEARCHER</option>
                        <option value="REVIEWER">REVIEWER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-[#F9E6A8]/40 text-[#4D2A00] text-[10px] font-extrabold border border-[#CC6F00]/20">
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>

                {/* Owner Actions for Non-Owner Member */}
                {isOwner && !isMemberOwner && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#CC6F00]/10 text-[10px]">
                    <button
                      onClick={() => {
                        setTransferTargetId(member.userId);
                        setConfirmTransfer(true);
                      }}
                      className="text-[#CC6F00] hover:underline font-bold"
                    >
                      Transfer Ownership
                    </button>
                    <span className="text-[#CC6F00]/40">•</span>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.user?.fullName)}
                      className="text-rose-600 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-[#F9E6A8]/30 border-t border-[#CC6F00]/20 space-y-2 shrink-0">
        {isOwner && onOpenShareModal && (
          <button
            onClick={onOpenShareModal}
            className="w-full py-2.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 border border-[#CC6F00]/40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Invite More Collaborators</span>
          </button>
        )}
      </div>

      {/* Transfer Ownership Confirmation Dialog */}
      {confirmTransfer && (
        <div className="absolute inset-0 z-50 bg-[#4D2A00]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="text-sm font-extrabold text-[#4D2A00]">Transfer Workspace Ownership</h4>
            </div>
            <p className="text-xs text-[#4D2A00]/80 leading-relaxed font-semibold">
              Are you sure? You will surrender Owner privileges and become an <strong>Editor</strong>. The new owner will have full control.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setConfirmTransfer(false);
                  setTransferTargetId(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#CC6F00]/30 text-xs font-bold text-[#4D2A00]"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferOwnership}
                disabled={transferLoading}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold"
              >
                {transferLoading ? "Transferring..." : "Yes, Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
