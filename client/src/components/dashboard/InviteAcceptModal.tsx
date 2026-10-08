"use client";

import React, { useState, useEffect } from "react";
import { 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  X,
  Sparkles
} from "lucide-react";

interface InviteAcceptModalProps {
  token: string | null;
  onClose: () => void;
  authToken: string | null;
  onAccepted: (workspaceId: string) => void;
}

export default function InviteAcceptModal({
  token,
  onClose,
  authToken,
  onAccepted,
}: InviteAcceptModalProps) {
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`http://localhost:4000/api/invitations/${token}`);
      const data = await res.json();
      if (data.success && data.data) {
        setInviteData(data.data);
      } else {
        setErrorMsg(data.message || "Invalid or expired invitation link.");
      }
    } catch (err: any) {
      setErrorMsg("Failed to connect to server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token || !authToken) return;
    setIsAccepting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`http://localhost:4000/api/invitations/${token}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        onAccepted(data.workspaceId);
        onClose();
      } else {
        setErrorMsg(data.message || "Failed to accept invitation.");
      }
    } catch (err: any) {
      setErrorMsg("Error: " + err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  if (!token) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4D2A00]/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[0_25px_60px_rgba(204,111,0,0.35)] space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CC6F00]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F2A900] border border-[#CC6F00]/40 flex items-center justify-center text-[#4D2A00]">
              <Link2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-[#4D2A00]">
              Workspace Invitation
            </h3>
          </div>

          <button onClick={onClose} className="p-1 hover:bg-[#F9E6A8] rounded-xl">
            <X className="w-4 h-4 text-[#4D2A00]" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-[#4D2A00]/70 font-semibold">
            Validating secure invitation token...
          </div>
        ) : errorMsg ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : inviteData ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-[#CC6F00] block">
                Research Workspace:
              </span>
              <h4 className="text-sm font-extrabold text-[#4D2A00]">
                {inviteData.workspaceName}
              </h4>
              <p className="text-xs text-[#4D2A00]/80 font-semibold line-clamp-2">
                Document: "{inviteData.documentTitle}"
              </p>

              <div className="flex items-center justify-between text-[11px] font-bold text-[#4D2A00]/70 pt-2 border-t border-[#CC6F00]/15">
                <span>Invited by: {inviteData.invitedBy}</span>
                <span className="px-2 py-0.5 rounded-md bg-[#F2A900] text-[#4D2A00]">
                  Role: {inviteData.assignedRole}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-2xl border border-[#CC6F00]/30 text-xs font-bold text-[#4D2A00] hover:bg-[#F9E6A8]/30"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={isAccepting}
                className="flex-1 py-2.5 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs border border-[#CC6F00]/40 transition-all shadow-xs"
              >
                {isAccepting ? "Accepting..." : "Accept Invitation"}
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
