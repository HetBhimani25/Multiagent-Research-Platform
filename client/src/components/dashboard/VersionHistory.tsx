"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  RotateCcw, 
  Camera, 
  Clock, 
  User, 
  CheckCircle, 
  X,
  FileText
} from "lucide-react";

interface VersionItem {
  id: string;
  versionNumber: number;
  content: string;
  changeSummary: string;
  createdAt: string;
  creator: {
    id: string;
    fullName: string;
  };
}

interface VersionHistoryProps {
  documentId: string;
  workspaceId: string;
  authToken: string | null;
  onRestoreVersion?: (content: string, versionNumber: number) => void;
  onClose?: () => void;
}

export default function VersionHistory({
  documentId,
  workspaceId,
  authToken,
  onRestoreVersion,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [snapshotSummary, setSnapshotSummary] = useState("");
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);

  useEffect(() => {
    if (documentId && authToken) {
      fetchVersions();
    }
  }, [documentId, authToken]);

  const fetchVersions = async () => {
    if (!authToken || !documentId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/documents/${documentId}/versions?workspaceId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        console.warn(`[VersionHistory] Versions API returned HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setVersions(data.data);
      }
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !documentId) return;

    try {
      const res = await fetch(`http://localhost:4000/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          changeSummary: snapshotSummary.trim() || "Manual milestone snapshot",
        }),
      });
      if (res.ok) {
        setSnapshotSummary("");
        setShowSnapshotModal(false);
        fetchVersions();
      }
    } catch (err) {
      console.error("Create snapshot error:", err);
    }
  };

  const handleRestore = async (version: VersionItem) => {
    if (!authToken || !confirm(`Restore Document to Version ${version.versionNumber}? This will create a new version with its content.`)) return;

    try {
      const res = await fetch(`http://localhost:4000/api/documents/${documentId}/versions/${version.id}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchVersions();
        if (onRestoreVersion) {
          onRestoreVersion(version.content, version.versionNumber);
        }
        alert(`Document restored to Version ${version.versionNumber}!`);
      }
    } catch (err) {
      console.error("Restore version error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Header */}
      <div className="p-4 bg-[#F9E6A8]/40 border-b border-[#CC6F00]/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#CC6F00]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#4D2A00]">
            Version History ({versions.length})
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSnapshotModal(true)}
            className="px-2.5 py-1 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-[11px] rounded-xl border border-[#CC6F00]/30 flex items-center gap-1 transition-all shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Save Snapshot</span>
          </button>

          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-[#F9E6A8] rounded-lg">
              <X className="w-4 h-4 text-[#4D2A00]" />
            </button>
          )}
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9E6A8]/10">
        {loading ? (
          <div className="text-center py-10 text-xs text-[#4D2A00]/60 font-semibold">
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#4D2A00]/60 font-semibold">
            No versions saved yet.
          </div>
        ) : (
          versions.map((ver, idx) => (
            <div
              key={ver.id}
              className={`p-3.5 rounded-2xl border transition-all bg-white ${
                idx === 0
                  ? "border-[#CC6F00]/40 shadow-xs"
                  : "border-[#CC6F00]/20 hover:border-[#CC6F00]/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-[#F2A900] text-[#4D2A00]">
                    v{ver.versionNumber}
                  </span>
                  {idx === 0 && (
                    <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-[#4D2A00]/60 font-bold">
                  <Clock className="w-3 h-3 text-[#CC6F00]" />
                  <span>{new Date(ver.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>

              <p className="text-xs font-semibold text-[#4D2A00] leading-snug mb-2">
                {ver.changeSummary || "Document update"}
              </p>

              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#CC6F00]/15">
                <span className="text-[10px] font-bold text-[#4D2A00]/70 flex items-center gap-1">
                  <User className="w-3 h-3 text-[#CC6F00]" />
                  <span>{ver.creator ? ver.creator.fullName : "System"}</span>
                </span>

                {idx !== 0 && (
                  <button
                    onClick={() => handleRestore(ver)}
                    className="text-[#CC6F00] hover:text-[#4D2A00] font-extrabold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Snapshot Modal */}
      {showSnapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4D2A00]/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-3">
            <h4 className="text-sm font-extrabold text-[#4D2A00]">Create Milestone Snapshot</h4>
            <p className="text-xs text-[#4D2A00]/70 font-semibold">
              Save the current document state as a named historical version.
            </p>

            <form onSubmit={handleTakeSnapshot} className="space-y-3">
              <input
                type="text"
                value={snapshotSummary}
                onChange={(e) => setSnapshotSummary(e.target.value)}
                placeholder="e.g. Completed Literature Review & Citations"
                className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-semibold text-[#4D2A00] focus:outline-none"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSnapshotModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#CC6F00]/30 text-xs font-bold text-[#4D2A00]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs"
                >
                  Save Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
