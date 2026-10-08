"use client";

import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Sparkles, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  Play
} from "lucide-react";

interface AgentRunItem {
  id: string;
  runType: string;
  agentName: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  startedAt: string;
  completedAt?: string;
  error?: string;
  initiator?: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface AIRunPanelProps {
  documentId: string;
  workspaceId: string;
  authToken: string | null;
  onClose?: () => void;
}

export default function AIRunPanel({
  documentId,
  workspaceId,
  authToken,
  onClose,
}: AIRunPanelProps) {
  const [runs, setRuns] = useState<AgentRunItem[]>([]);
  const [hasActiveRun, setHasActiveRun] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (documentId && authToken) {
      fetchRuns();
    }
  }, [documentId, authToken]);

  const fetchRuns = async () => {
    if (!authToken || !documentId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/documents/${documentId}/agent-runs?workspaceId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        console.warn(`[AIRunPanel] Agent runs API returned HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setRuns(data.data.runs);
        setHasActiveRun(data.data.hasActiveRun);
      }
    } catch (err) {
      console.error("Failed to fetch agent runs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case "RUNNING":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#F2A900] text-[#4D2A00] border border-[#CC6F00]/40 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin text-[#4D2A00]" />
            <span>Executing...</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Header */}
      <div className="p-4 bg-[#F9E6A8]/40 border-b border-[#CC6F00]/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#CC6F00]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#4D2A00]">
            AI Agent Execution Runs ({runs.length})
          </h4>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-[#F9E6A8] rounded-lg">
            <X className="w-4 h-4 text-[#4D2A00]" />
          </button>
        )}
      </div>

      {/* Active Run Banner */}
      {hasActiveRun && (
        <div className="p-3 bg-[#F2A900]/20 border-b border-[#CC6F00]/30 flex items-center gap-2 text-xs font-semibold text-[#4D2A00] animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-[#CC6F00]" />
          <span>An autonomous AI research pipeline is currently running on this document.</span>
        </div>
      )}

      {/* Runs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9E6A8]/10">
        {loading ? (
          <div className="text-center py-10 text-xs text-[#4D2A00]/60 font-semibold">
            Loading agent runs...
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#4D2A00]/60 font-semibold">
            No AI agent runs triggered yet.
          </div>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              className="p-3.5 bg-white border border-[#CC6F00]/30 rounded-2xl flex flex-col gap-2 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-[#F2A900]/20 text-[#CC6F00]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-[#4D2A00]">
                      {run.agentName || "10-Agent Pipeline"}
                    </h5>
                    <span className="text-[10px] text-[#4D2A00]/60 font-bold">
                      Mode: {run.runType}
                    </span>
                  </div>
                </div>

                {getStatusBadge(run.status)}
              </div>

              {/* Attribution */}
              <div className="flex items-center justify-between text-[10px] font-semibold text-[#4D2A00]/70 pt-1.5 border-t border-[#CC6F00]/15">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-[#CC6F00]" />
                  <span>Initiated by: <strong>{run.initiator ? run.initiator.fullName : "User"}</strong></span>
                </span>

                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#CC6F00]" />
                  <span>{new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
