"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  RotateCcw, 
  Trash2, 
  Tag, 
  CornerDownRight, 
  X,
  Filter
} from "lucide-react";

interface CommentReply {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
  };
}

interface CommentItem {
  id: string;
  sectionId: string;
  content: string;
  commentType: string;
  status: "OPEN" | "RESOLVED" | "DELETED";
  createdAt: string;
  author: {
    id: string;
    fullName: string;
  };
  resolver?: {
    id: string;
    fullName: string;
  };
  replies?: CommentReply[];
}

interface CommentPanelProps {
  documentId: string;
  workspaceId: string;
  authToken: string | null;
  currentUserId: string;
  sections?: string[];
  onClose?: () => void;
}

export default function CommentPanel({
  documentId,
  workspaceId,
  authToken,
  currentUserId,
  sections = ["Abstract", "Introduction", "Literature Review", "System Design", "Analysis", "Conclusion"],
  onClose,
}: CommentPanelProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedSection, setSelectedSection] = useState("Introduction");
  const [selectedType, setSelectedType] = useState("GENERAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Replying state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (documentId && authToken) {
      fetchComments();
    }
  }, [documentId, authToken]);

  const fetchComments = async () => {
    if (!authToken || !documentId) return;
    try {
      const res = await fetch(`http://localhost:4000/api/documents/${documentId}/comments?workspaceId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        console.warn(`[CommentPanel] Comments API returned HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setComments(data.data);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !authToken || !documentId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:4000/api/documents/${documentId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          content: newCommentText.trim(),
          sectionId: selectedSection,
          commentType: selectedType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCommentText("");
        fetchComments();
      }
    } catch (err) {
      console.error("Create comment error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateReply = async (parentCommentId: string) => {
    if (!replyText.trim() || !authToken || !documentId) return;

    try {
      const res = await fetch(`http://localhost:4000/api/documents/${documentId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          content: replyText.trim(),
          parentCommentId,
          commentType: "GENERAL",
        }),
      });
      if (res.ok) {
        setReplyText("");
        setReplyingToId(null);
        fetchComments();
      }
    } catch (err) {
      console.error("Create reply error:", err);
    }
  };

  const handleToggleResolve = async (commentId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`http://localhost:4000/api/comments/${commentId}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error("Toggle resolve error:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!authToken || !confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`http://localhost:4000/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  const filteredComments = comments.filter((c) => {
    if (filterStatus === "OPEN") return c.status === "OPEN";
    if (filterStatus === "RESOLVED") return c.status === "RESOLVED";
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Header */}
      <div className="p-4 bg-[#F9E6A8]/40 border-b border-[#CC6F00]/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#CC6F00]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#4D2A00]">
            Section Discussions ({comments.length})
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-[#CC6F00]/20 rounded-xl p-0.5 text-[10px] font-extrabold">
            {(["ALL", "OPEN", "RESOLVED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  filterStatus === status
                    ? "bg-[#F2A900] text-[#4D2A00]"
                    : "text-[#4D2A00]/60 hover:text-[#4D2A00]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-[#F9E6A8] rounded-lg">
              <X className="w-4 h-4 text-[#4D2A00]" />
            </button>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F9E6A8]/10">
        {filteredComments.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#4D2A00]/60 font-semibold">
            No {filterStatus.toLowerCase()} comments yet. Start a discussion below!
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                comment.status === "RESOLVED"
                  ? "bg-slate-50 border-slate-200 opacity-75"
                  : "bg-white border-[#CC6F00]/30 shadow-xs"
              }`}
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#F2A900] text-[#4D2A00] font-black text-[10px] flex items-center justify-center border border-[#CC6F00]/30">
                    {comment.author?.fullName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#4D2A00]">
                      {comment.author?.fullName}
                    </span>
                    <span className="text-[10px] text-[#4D2A00]/50 ml-1.5">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#F9E6A8] text-[#CC6F00] border border-[#CC6F00]/20">
                    {comment.sectionId}
                  </span>
                  <span className="text-[9px] font-bold text-[#4D2A00]/70">
                    {comment.commentType}
                  </span>
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-xs font-semibold text-[#4D2A00] leading-relaxed mb-2">
                {comment.content}
              </p>

              {/* Action Buttons: Reply, Resolve, Delete */}
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#CC6F00]/15">
                <button
                  onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                  className="text-[#CC6F00] hover:underline font-extrabold flex items-center gap-1"
                >
                  <CornerDownRight className="w-3 h-3" />
                  <span>Reply</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleResolve(comment.id)}
                    className={`font-extrabold flex items-center gap-1 ${
                      comment.status === "RESOLVED"
                        ? "text-slate-600 hover:text-[#4D2A00]"
                        : "text-emerald-700 hover:text-emerald-800"
                    }`}
                  >
                    {comment.status === "RESOLVED" ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>Reopen</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>Resolve</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-rose-600 hover:text-rose-700 p-0.5"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Replies Thread */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2.5 pl-3 border-l-2 border-[#CC6F00]/30 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-[#F9E6A8]/20 p-2 rounded-xl text-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-extrabold text-[#4D2A00] text-[11px]">
                          {reply.author?.fullName}
                        </span>
                        <span className="text-[9px] text-[#4D2A00]/50">
                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4D2A00] font-semibold">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input Form */}
              {replyingToId === comment.id && (
                <div className="mt-2 pt-2 border-t border-[#CC6F00]/20 flex items-center gap-1.5 animate-in fade-in">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 bg-white border border-[#CC6F00]/30 rounded-xl px-2.5 py-1 text-xs font-semibold text-[#4D2A00] focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateReply(comment.id);
                    }}
                  />
                  <button
                    onClick={() => handleCreateReply(comment.id)}
                    className="px-2.5 py-1 bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white rounded-xl text-xs font-extrabold"
                  >
                    Send
                  </button>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* New Comment Input Composer */}
      <form onSubmit={handleCreateComment} className="p-3.5 bg-white border-t border-[#CC6F00]/20 space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Section Selector */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="flex-1 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-xl px-2 py-1 text-[11px] font-extrabold text-[#4D2A00] focus:outline-none"
          >
            {sections.map((s) => (
              <option key={s} value={s}>
                Section: {s}
              </option>
            ))}
          </select>

          {/* Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-xl px-2 py-1 text-[11px] font-extrabold text-[#4D2A00] focus:outline-none"
          >
            <option value="GENERAL">General</option>
            <option value="QUESTION">Question</option>
            <option value="SUGGESTION">Suggestion</option>
            <option value="ISSUE">Issue</option>
            <option value="CITATION_REVIEW">Citation</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Type comment or @mention a collaborator..."
            className="flex-1 bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:border-[#F2A900]"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || isSubmitting}
            className="px-4 py-2 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs rounded-xl border border-[#CC6F00]/40 transition-all flex items-center gap-1 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </div>
      </form>

    </div>
  );
}
