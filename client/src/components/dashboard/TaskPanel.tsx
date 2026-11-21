"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  X,
  Filter,
  Users
} from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
  sectionId?: string;
  dueDate?: string;
  creator: {
    id: string;
    fullName: string;
  };
  assignee?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

interface MemberOption {
  userId: string;
  fullName: string;
  role?: string;
  email?: string;
}

interface TaskPanelProps {
  documentId: string;
  workspaceId: string;
  authToken: string | null;
  currentUserId: string;
  isOwner?: boolean;
  ownerId?: string;
  members?: MemberOption[];
  onClose?: () => void;
}

export default function TaskPanel({
  documentId,
  workspaceId,
  authToken,
  currentUserId,
  isOwner = false,
  ownerId,
  members = [],
  onClose,
}: TaskPanelProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "MY" | "TODO" | "COMPLETED">("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Collaborators for assigning tasks
  const [workspaceMembers, setWorkspaceMembers] = useState<MemberOption[]>([]);
  const [workspaceOwnerId, setWorkspaceOwnerId] = useState<string | null>(ownerId || null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // New task form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const effectiveWorkspaceId = workspaceId || documentId;

  useEffect(() => {
    if (documentId && authToken) {
      fetchTasks();
      fetchMembers();
    }
  }, [documentId, workspaceId, authToken]);

  useEffect(() => {
    if (showCreateModal && authToken && effectiveWorkspaceId) {
      fetchMembers();
    }
  }, [showCreateModal]);

  const fetchMembers = async () => {
    const targetId = workspaceId || documentId;
    if (!authToken || !targetId) return;
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`http://localhost:4000/api/workspaces/${targetId}/members`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        console.warn(`[TaskPanel] Members API returned HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        if (data.ownerId) {
          setWorkspaceOwnerId(data.ownerId);
        }
        const mapped: MemberOption[] = data.data.map((m: any) => ({
          userId: m.userId || m.user?.id || m.id,
          fullName: m.user?.fullName || m.fullName || m.user?.email || "Collaborator",
          role: m.role || "MEMBER",
          email: m.user?.email,
        }));
        setWorkspaceMembers(mapped);
      }
    } catch (err) {
      console.error("Failed to load members in TaskPanel:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchTasks = async () => {
    if (!authToken || !documentId) return;
    try {
      const res = await fetch(`http://localhost:4000/api/documents/${documentId}/tasks?workspaceId=${effectiveWorkspaceId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        console.warn(`[TaskPanel] Tasks API returned HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !authToken || !documentId) return;

    setIsCreating(true);
    try {
      const res = await fetch(`http://localhost:4000/api/documents/${documentId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          workspaceId: effectiveWorkspaceId,
          title: newTitle.trim(),
          description: newDesc.trim(),
          priority: newPriority,
          assignedTo: newAssignee || null,
          dueDate: newDueDate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle("");
        setNewDesc("");
        setNewAssignee("");
        setNewDueDate("");
        setShowCreateModal(false);
        fetchTasks();
      }
    } catch (err) {
      console.error("Create task error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (task: TaskItem) => {
    if (!authToken) return;
    const nextStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";

    try {
      const res = await fetch(`http://localhost:4000/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Update task status error:", err);
    }
  };

  const handleUpdateAssignee = async (taskId: string, assigneeUserId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`http://localhost:4000/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ assignedTo: assigneeUserId || null }),
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Update task assignee error:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!authToken || !confirm("Delete this task?")) return;
    try {
      const res = await fetch(`http://localhost:4000/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  // Combine fetched workspaceMembers and any members passed via props
  const candidateMembers = workspaceMembers.length > 0 ? workspaceMembers : (members || []);

  // Filter out the OWNER of the document:
  // "it should don't show the name of the Owner of the Document coz he/she will assign the task to member ."
  const assignableCollaborators = candidateMembers.filter((m) => {
    const isOwnerRole = m.role?.toUpperCase() === "OWNER";
    const isDocOwnerId = (workspaceOwnerId && m.userId === workspaceOwnerId) || (ownerId && m.userId === ownerId);
    const isCurrentOwnerUser = isOwner && m.userId === currentUserId;
    return !isOwnerRole && !isDocOwnerId && !isCurrentOwnerUser;
  });

  const filteredTasks = tasks.filter((t) => {
    if (filter === "MY") return t.assignee?.id === currentUserId;
    if (filter === "TODO") return t.status !== "COMPLETED";
    if (filter === "COMPLETED") return t.status === "COMPLETED";
    return true;
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "URGENT": return "bg-rose-100 text-rose-800 border-rose-300";
      case "HIGH": return "bg-amber-100 text-amber-800 border-amber-300";
      case "MEDIUM": return "bg-[#F9E6A8] text-[#4D2A00] border-[#CC6F00]/30";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatRole = (r?: string) => {
    if (!r) return "";
    return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Header */}
      <div className="p-4 bg-[#F9E6A8]/40 border-b border-[#CC6F00]/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#CC6F00]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#4D2A00]">
            Research Tasks ({tasks.length})
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-2.5 py-1 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-[11px] rounded-xl border border-[#CC6F00]/30 flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>

          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-[#F9E6A8] rounded-lg">
              <X className="w-4 h-4 text-[#4D2A00]" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-[#CC6F00]/15 flex items-center gap-1 bg-[#F9E6A8]/20 shrink-0">
        {(["ALL", "MY", "TODO", "COMPLETED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
              filter === f
                ? "bg-[#F2A900] text-[#4D2A00] shadow-2xs"
                : "text-[#4D2A00]/70 hover:bg-white"
            }`}
          >
            {f === "ALL" ? "All Tasks" : f === "MY" ? "My Tasks" : f === "TODO" ? "Pending" : "Completed"}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9E6A8]/10">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#4D2A00]/60 font-semibold">
            No {filter.toLowerCase()} tasks found.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === "COMPLETED";

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                  isCompleted
                    ? "bg-slate-50 border-slate-200 opacity-70"
                    : "bg-white border-[#CC6F00]/30 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="mt-0.5 text-[#CC6F00] hover:text-[#4D2A00] shrink-0"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <h5 className={`text-xs font-extrabold text-[#4D2A00] ${isCompleted ? "line-through text-slate-500" : ""}`}>
                        {task.title}
                      </h5>
                      {task.description && (
                        <p className="text-[11px] text-[#4D2A00]/70 mt-0.5 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                {/* Footer Details: Assignee & Due Date */}
                <div className="flex items-center justify-between text-[10px] font-semibold text-[#4D2A00]/70 pt-1.5 border-t border-[#CC6F00]/10">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-[#CC6F00]" />
                      {assignableCollaborators.length > 0 ? (
                        <select
                          value={task.assignee?.id || ""}
                          onChange={(e) => handleUpdateAssignee(task.id, e.target.value)}
                          className="bg-transparent hover:bg-[#F9E6A8]/40 border border-transparent hover:border-[#CC6F00]/30 rounded-md px-1 py-0.5 text-[10px] font-bold text-[#4D2A00] cursor-pointer focus:outline-none focus:bg-[#F9E6A8]/50"
                          title="Click to change assignee"
                        >
                          <option value="">Unassigned</option>
                          {assignableCollaborators.map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.fullName} ({formatRole(m.role)})
                            </option>
                          ))}
                          {task.assignee && !assignableCollaborators.some((m) => m.userId === task.assignee?.id) && (
                            <option value={task.assignee.id}>
                              {task.assignee.fullName} (Assigned)
                            </option>
                          )}
                        </select>
                      ) : (
                        <span className={task.assignee ? "text-[#4D2A00] font-bold" : "text-[#4D2A00]/60"}>
                          {task.assignee ? task.assignee.fullName : "Unassigned"}
                        </span>
                      )}
                    </div>

                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#CC6F00]" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-rose-600 hover:text-rose-700 p-0.5 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4D2A00]/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border-2 border-[#CC6F00]/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#CC6F00]/20 pb-3">
              <h4 className="text-sm font-extrabold text-[#4D2A00]">Create Research Task</h4>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-[#F9E6A8] rounded-xl cursor-pointer">
                <X className="w-4 h-4 text-[#4D2A00]" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                  Task Title:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Verify Citation #12 or Add Benchmark Chart"
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                  Description (Optional):
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Details for assignee..."
                  rows={2}
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl p-3 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:border-[#CC6F00] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                    Priority:
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-2 py-1.5 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                    Assignee:
                  </label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-2 py-1.5 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  >
                    <option value="">Unassigned</option>
                    {assignableCollaborators.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName} ({formatRole(m.role)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {assignableCollaborators.length === 0 && !isLoadingMembers && (
                <div className="p-2.5 rounded-xl bg-[#F9E6A8]/30 border border-[#CC6F00]/20 text-[11px] text-[#4D2A00]/80 flex items-start gap-2">
                  <Users className="w-4 h-4 text-[#CC6F00] shrink-0 mt-0.5" />
                  <span>
                    No collaborated members have joined this document yet. Use the <strong>Share</strong> button on the document header to generate an invite link or 12-digit code for your team.
                  </span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-extrabold text-[#4D2A00] block mb-1">
                  Due Date:
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#CC6F00]/30 text-xs font-bold text-[#4D2A00] cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs border border-[#CC6F00]/40 disabled:opacity-50 cursor-pointer transition-colors shadow-2xs"
                >
                  {isCreating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
