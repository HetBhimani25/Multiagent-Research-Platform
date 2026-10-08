"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Share2, 
  Link2, 
  KeyRound, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Users, 
  ShieldCheck, 
  Sparkles,
  AlertCircle
} from "lucide-react";

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  documentTitle: string;
  isOwner: boolean;
  authToken: string | null;
}

interface InvitationItem {
  id: string;
  inviteType: "LINK" | "CODE";
  role: string;
  inviteCode?: string;
  tokenHash?: string;
  expiresAt: string;
  usesCount: number;
  maxUses: number;
  status: string;
  createdAt: string;
}

export default function ShareDocumentModal({
  isOpen,
  onClose,
  workspaceId,
  documentTitle,
  isOwner,
  authToken,
}: ShareDocumentModalProps) {
  const [activeTab, setActiveTab] = useState<"link" | "code" | "active">("link");
  
  // Link generation form
  const [linkRole, setLinkRole] = useState("EDITOR");
  const [linkExpiry, setLinkExpiry] = useState("7");
  const [linkMaxUses, setLinkMaxUses] = useState("5");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Code generation form
  const [codeRole, setCodeRole] = useState("EDITOR");
  const [codeExpiry, setCodeExpiry] = useState("24");
  const [codeMaxUses, setCodeMaxUses] = useState("10");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Invitations list
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workspaceId && isOwner && authToken) {
      fetchInvitations();
    }
  }, [isOpen, workspaceId, isOwner, authToken]);

  const fetchInvitations = async () => {
    if (!authToken || !workspaceId) return;
    setLoadingInvites(true);
    try {
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/invitations`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setInvitations(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!authToken || !workspaceId) return;
    setIsGeneratingLink(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/invitations/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          role: linkRole,
          expiresInDays: parseInt(linkExpiry, 10),
          maxUses: parseInt(linkMaxUses, 10),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGeneratedLink(data.data.inviteLink);
        fetchInvitations();
      } else {
        setErrorMsg(data.message || "Failed to generate invite link.");
      }
    } catch (err: any) {
      setErrorMsg("Network error: " + err.message);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!authToken || !workspaceId) return;
    setIsGeneratingCode(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/invitations/code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          role: codeRole,
          expiresInHours: parseInt(codeExpiry, 10),
          maxUses: parseInt(codeMaxUses, 10),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGeneratedCode(data.data.inviteCode);
        fetchInvitations();
      } else {
        setErrorMsg(data.message || "Failed to generate invite code.");
      }
    } catch (err: any) {
      setErrorMsg("Network error: " + err.message);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!authToken || !workspaceId) return;
    try {
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        fetchInvitations();
      }
    } catch (err) {
      console.error("Failed to revoke invitation:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4D2A00]/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl w-full max-w-2xl shadow-[0_25px_60px_rgba(204,111,0,0.35)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#F9E6A8] border-b-2 border-[#CC6F00]/30 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F2A900] border-2 border-[#CC6F00]/40 flex items-center justify-center text-[#4D2A00] font-black shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#4D2A00]">
                  Share Research Document
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#F2A900] text-[#4D2A00] border border-[#CC6F00]/30">
                  {isOwner ? "Owner" : "Collaborator"}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#4D2A00]/70 truncate max-w-md">
                "{documentTitle}"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white hover:bg-rose-50 border-2 border-[#CC6F00]/30 text-[#4D2A00] hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#CC6F00]/20 bg-[#F9E6A8]/30 px-6 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("link")}
            className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-1.5 border-t-2 border-x-2 ${
              activeTab === "link"
                ? "bg-white text-[#4D2A00] border-[#CC6F00]/30 shadow-xs"
                : "border-transparent text-[#4D2A00]/70 hover:bg-[#F9E6A8]/60"
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>Invite Link</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-1.5 border-t-2 border-x-2 ${
              activeTab === "code"
                ? "bg-white text-[#4D2A00] border-[#CC6F00]/30 shadow-xs"
                : "border-transparent text-[#4D2A00]/70 hover:bg-[#F9E6A8]/60"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>Invite Code</span>
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-1.5 border-t-2 border-x-2 ${
                activeTab === "active"
                  ? "bg-white text-[#4D2A00] border-[#CC6F00]/30 shadow-xs"
                : "border-transparent text-[#4D2A00]/70 hover:bg-[#F9E6A8]/60"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#CC6F00]" />
              <span>Active Invites ({invitations.filter(i => i.status === 'ACTIVE').length})</span>
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isOwner && (
            <div className="p-3.5 rounded-2xl bg-[#F9E6A8]/40 border border-[#CC6F00]/30 text-xs font-semibold text-[#4D2A00] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#CC6F00] shrink-0" />
              <span>Only the Document Owner can generate new invite links and codes. Ask the owner for an invite.</span>
            </div>
          )}

          {/* TAB 1: INVITE LINK */}
          {activeTab === "link" && isOwner && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Role */}
                <div>
                  <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                    Assigned Role:
                  </label>
                  <select
                    value={linkRole}
                    onChange={(e) => setLinkRole(e.target.value)}
                    className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-extrabold text-[#4D2A00] focus:outline-none focus:border-[#F2A900]"
                  >
                    <option value="EDITOR">Editor (Can edit)</option>
                    <option value="RESEARCHER">Researcher (Notes/Sources)</option>
                    <option value="REVIEWER">Reviewer (Comment/Review)</option>
                    <option value="VIEWER">Viewer (Read only)</option>
                  </select>
                </div>

                {/* Expiry */}
                <div>
                  <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                    Link Expiration:
                  </label>
                  <select
                    value={linkExpiry}
                    onChange={(e) => setLinkExpiry(e.target.value)}
                    className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-extrabold text-[#4D2A00] focus:outline-none focus:border-[#F2A900]"
                  >
                    <option value="1">1 Day</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>

                {/* Max Uses */}
                <div>
                  <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                    Maximum Uses:
                  </label>
                  <select
                    value={linkMaxUses}
                    onChange={(e) => setLinkMaxUses(e.target.value)}
                    className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-extrabold text-[#4D2A00] focus:outline-none focus:border-[#F2A900]"
                  >
                    <option value="1">1 Person</option>
                    <option value="5">5 People</option>
                    <option value="20">20 People</option>
                    <option value="100">100 People</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                className="w-full py-2.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-2 border border-[#CC6F00]/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingLink ? "Generating Secure Link..." : "Generate Invite Link"}</span>
              </button>

              {generatedLink && (
                <div className="p-3.5 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl space-y-2 animate-in fade-in">
                  <span className="text-[10px] font-extrabold uppercase text-[#CC6F00] block">
                    Shareable Invitation Link (Ready to Copy):
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 bg-white border border-[#CC6F00]/30 rounded-xl px-3 py-1.5 text-xs font-mono text-[#4D2A00] focus:outline-none select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] text-xs font-extrabold flex items-center gap-1 border border-[#CC6F00]/30"
                    >
                      {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{linkCopied ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INVITE CODE */}
          {activeTab === "code" && isOwner && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Role */}
                <div>
                  <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                    Assigned Role:
                  </label>
                  <select
                    value={codeRole}
                    onChange={(e) => setCodeRole(e.target.value)}
                    className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-extrabold text-[#4D2A00] focus:outline-none focus:border-[#F2A900]"
                  >
                    <option value="EDITOR">Editor (Can edit)</option>
                    <option value="RESEARCHER">Researcher (Notes/Sources)</option>
                    <option value="REVIEWER">Reviewer (Comment/Review)</option>
                    <option value="VIEWER">Viewer (Read only)</option>
                  </select>
                </div>

                {/* Expiry */}
                <div>
                  <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                    Code Expiration:
                  </label>
                  <select
                    value={codeExpiry}
                    onChange={(e) => setCodeExpiry(e.target.value)}
                    className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-extrabold text-[#4D2A00] focus:outline-none focus:border-[#F2A900]"
                  >
                    <option value="6">6 Hours</option>
                    <option value="24">24 Hours</option>
                    <option value="72">3 Days</option>
                  </select>
                </div>

                {/* Max Uses */}
                <div>
                  <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                    Maximum Uses:
                  </label>
                  <select
                    value={codeMaxUses}
                    onChange={(e) => setCodeMaxUses(e.target.value)}
                    className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-extrabold text-[#4D2A00] focus:outline-none focus:border-[#F2A900]"
                  >
                    <option value="1">1 Person</option>
                    <option value="5">5 People</option>
                    <option value="10">10 People</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                className="w-full py-2.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-2 border border-[#CC6F00]/40"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isGeneratingCode ? "Generating Code..." : "Generate 12-Digit Workspace Code"}</span>
              </button>

              {generatedCode && (
                <div className="p-4 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl flex items-center justify-between animate-in fade-in">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#CC6F00] block">
                      Invitation Code:
                    </span>
                    <span className="text-xl font-mono font-black text-[#4D2A00] tracking-wider">
                      {generatedCode}
                    </span>
                    <p className="text-[10px] text-[#4D2A00]/70 font-semibold mt-0.5">
                      Collaborators can join via "Join Research Workspace" menu.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] text-xs font-extrabold flex items-center gap-1.5 border border-[#CC6F00]/30 shadow-xs"
                  >
                    {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{codeCopied ? "Copied Code!" : "Copy Code"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE INVITATIONS LIST */}
          {activeTab === "active" && isOwner && (
            <div className="space-y-3">
              {loadingInvites ? (
                <div className="text-center py-8 text-xs text-[#4D2A00]/60 font-semibold">
                  Loading invitations...
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#4D2A00]/60 font-semibold bg-[#F9E6A8]/20 rounded-2xl border border-[#CC6F00]/20">
                  No active invitation links or codes yet.
                </div>
              ) : (
                invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 bg-white border border-[#CC6F00]/30 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#F2A900] text-[#4D2A00]">
                          {inv.inviteType}
                        </span>
                        <span className="text-xs font-extrabold text-[#4D2A00]">
                          Role: {inv.role}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          inv.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#4D2A00]/70 flex items-center gap-3">
                        {inv.inviteCode && <span className="font-mono font-bold text-[#CC6F00]">{inv.inviteCode}</span>}
                        <span>Uses: {inv.usesCount}/{inv.maxUses}</span>
                        <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {inv.status === "ACTIVE" && (
                      <button
                        onClick={() => handleRevokeInvitation(inv.id)}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all flex items-center gap-1"
                        title="Revoke invitation"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
