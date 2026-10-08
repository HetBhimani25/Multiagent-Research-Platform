"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  User, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  CheckSquare, 
  ShieldCheck, 
  Clock, 
  RotateCcw,
  X
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  metadata: any;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface ActivityFeedProps {
  workspaceId: string;
  authToken: string | null;
  onClose?: () => void;
}

export default function ActivityFeed({
  workspaceId,
  authToken,
  onClose,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workspaceId && authToken) {
      fetchActivities();
    }
  }, [workspaceId, authToken]);

  const fetchActivities = async () => {
    if (!authToken || !workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/activity?limit=50`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        console.warn(`[ActivityFeed] Activity API returned HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setActivities(data.data);
      }
    } catch (err) {
      console.error("Failed to load activity:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionDetails = (act: ActivityItem) => {
    const actor = act.user ? act.user.fullName : "System";

    switch (act.action) {
      case "WORKSPACE_CREATED":
        return { icon: ShieldCheck, text: `${actor} created this research workspace.`, color: "text-[#CC6F00]" };
      case "MEMBER_INVITED":
        return { icon: User, text: `${actor} generated a ${act.metadata?.type || "member"} invitation.`, color: "text-[#F2A900]" };
      case "INVITE_ACCEPTED":
        return { icon: User, text: `${actor} joined the workspace as ${act.metadata?.role || "collaborator"}.`, color: "text-emerald-700" };
      case "ROLE_CHANGED":
        return { icon: ShieldCheck, text: `${actor} changed ${act.metadata?.targetUser || "a member"}'s role to ${act.metadata?.newRole}.`, color: "text-[#CC6F00]" };
      case "MEMBER_REMOVED":
        return { icon: User, text: `${actor} removed ${act.metadata?.targetUser || "a member"} from workspace.`, color: "text-rose-600" };
      case "MEMBER_LEFT":
        return { icon: User, text: `${actor} left the workspace.`, color: "text-slate-600" };
      case "DOCUMENT_EDITED":
        return { icon: FileText, text: `${actor} updated the document (v${act.metadata?.version || ""}).`, color: "text-[#4D2A00]" };
      case "STATUS_CHANGED":
      case "DOCUMENT_FINALIZED":
      case "DOCUMENT_REOPENED":
        return { icon: FileText, text: `${actor} changed document status to ${act.metadata?.newStatus || act.action}.`, color: "text-[#CC6F00]" };
      case "COMMENT_CREATED":
        return { icon: MessageSquare, text: `${actor} commented on Section: ${act.metadata?.sectionId || "General"}.`, color: "text-[#F2A900]" };
      case "COMMENT_RESOLVED":
        return { icon: MessageSquare, text: `${actor} resolved a comment thread.`, color: "text-emerald-700" };
      case "TASK_CREATED":
        return { icon: CheckSquare, text: `${actor} created task: "${act.metadata?.title || "Research Task"}".`, color: "text-[#4D2A00]" };
      case "TASK_COMPLETED":
        return { icon: CheckSquare, text: `${actor} completed task: "${act.metadata?.title || "Task"}".`, color: "text-emerald-700" };
      case "AI_RUN_STARTED":
        return { icon: Sparkles, text: `${actor} launched AI Research execution (${act.metadata?.agentName || "10 Agents"}).`, color: "text-[#F2A900]" };
      case "AI_RUN_COMPLETED":
        return { icon: Sparkles, text: `AI Research execution completed successfully.`, color: "text-emerald-700" };
      case "VERSION_CREATED":
        return { icon: RotateCcw, text: `${actor} saved Version snapshot v${act.metadata?.versionNumber || ""}.`, color: "text-[#CC6F00]" };
      case "VERSION_RESTORED":
        return { icon: RotateCcw, text: `${actor} restored document to Version ${act.metadata?.restoredFrom}.`, color: "text-amber-800" };
      case "OWNERSHIP_TRANSFERRED":
        return { icon: ShieldCheck, text: `${actor} transferred workspace ownership.`, color: "text-[#CC6F00]" };
      default:
        return { icon: Activity, text: `${actor} performed ${act.action.replace(/_/g, " ").toLowerCase()}.`, color: "text-[#4D2A00]" };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Header */}
      <div className="p-4 bg-[#F9E6A8]/40 border-b border-[#CC6F00]/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#CC6F00]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#4D2A00]">
            Workspace Audit & Activity Feed
          </h4>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-[#F9E6A8] rounded-lg">
            <X className="w-4 h-4 text-[#4D2A00]" />
          </button>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9E6A8]/10">
        {loading ? (
          <div className="text-center py-10 text-xs text-[#4D2A00]/60 font-semibold">
            Loading activity log...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#4D2A00]/60 font-semibold">
            No activity recorded yet.
          </div>
        ) : (
          activities.map((act) => {
            const { icon: ActionIcon, text, color } = getActionDetails(act);

            return (
              <div
                key={act.id}
                className="p-3 bg-white border border-[#CC6F00]/20 rounded-2xl flex items-start gap-3 shadow-2xs transition-all hover:border-[#CC6F00]/40"
              >
                <div className="p-1.5 rounded-xl bg-[#F9E6A8]/40 border border-[#CC6F00]/20 shrink-0 mt-0.5">
                  <ActionIcon className={`w-3.5 h-3.5 ${color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#4D2A00] leading-snug">
                    {text}
                  </p>
                  <span className="text-[10px] text-[#4D2A00]/50 font-bold block mt-1">
                    {new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
