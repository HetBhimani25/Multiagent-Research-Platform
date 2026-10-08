"use client";

import React, { useState } from "react";
import { 
  KeyRound, 
  LogIn, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Sparkles,
  ArrowRight
} from "lucide-react";

interface JoinWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  authToken: string | null;
  onJoinedSuccess: (workspaceId: string) => void;
}

export default function JoinWorkspaceModal({
  isOpen,
  onClose,
  authToken,
  onJoinedSuccess,
}: JoinWorkspaceModalProps) {
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "preview">("input");
  const [workspacePreview, setWorkspacePreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("http://localhost:4000/api/invitations/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setWorkspacePreview(data.data);
        setStep("preview");
      } else {
        setErrorMsg(data.message || "Invalid or expired invitation code.");
      }
    } catch (err: any) {
      setErrorMsg("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCode = async () => {
    if (!authToken || !code.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("http://localhost:4000/api/invitations/accept-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        onJoinedSuccess(data.workspaceId);
        onClose();
      } else {
        setErrorMsg(data.message || "Failed to join workspace.");
      }
    } catch (err: any) {
      setErrorMsg("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4D2A00]/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[0_25px_60px_rgba(204,111,0,0.35)] space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CC6F00]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F2A900] border border-[#CC6F00]/40 flex items-center justify-center text-[#4D2A00]">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-[#4D2A00]">
              Join Research Workspace
            </h3>
          </div>

          <button onClick={onClose} className="p-1 hover:bg-[#F9E6A8] rounded-xl">
            <X className="w-4 h-4 text-[#4D2A00]" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Input Code */}
        {step === "input" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="text-xs font-extrabold text-[#4D2A00] block mb-1">
                Enter Invitation Code:
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="RSH-XXXX-YYYY"
                className="w-full bg-[#F9E6A8]/20 border-2 border-[#CC6F00]/30 rounded-2xl px-4 py-3 text-base font-mono font-black tracking-widest text-[#4D2A00] uppercase text-center focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
                required
                autoFocus
              />
              <span className="text-[10px] text-[#4D2A00]/60 font-semibold block mt-1.5 text-center">
                Provided by the Document Owner (e.g. <code>RSH-A41B-9F2C</code>)
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-sm border-2 border-[#CC6F00]/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              <span>{loading ? "Verifying Code..." : "Verify Invitation Code"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Workspace Preview & Confirmation */}
        {step === "preview" && workspacePreview && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-[#CC6F00] block">
                Workspace Found:
              </span>
              <h4 className="text-sm font-extrabold text-[#4D2A00]">
                {workspacePreview.workspaceName}
              </h4>
              <p className="text-xs text-[#4D2A00]/80 font-semibold line-clamp-2">
                Document: "{workspacePreview.documentTitle}"
              </p>

              <div className="flex items-center justify-between text-[11px] font-bold text-[#4D2A00]/70 pt-2 border-t border-[#CC6F00]/15">
                <span>Invited by: {workspacePreview.invitedBy}</span>
                <span className="px-2 py-0.5 rounded-md bg-[#F2A900] text-[#4D2A00]">
                  Role: {workspacePreview.assignedRole}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="flex-1 py-2.5 rounded-2xl border border-[#CC6F00]/30 text-xs font-bold text-[#4D2A00] hover:bg-[#F9E6A8]/30"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleAcceptCode}
                disabled={loading}
                className="flex-1 py-2.5 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs border border-[#CC6F00]/40 transition-all shadow-xs"
              >
                {loading ? "Joining..." : "Join Workspace"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
