"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  CheckCheck, 
  User, 
  CheckSquare, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  X,
  ExternalLink
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  workspaceId?: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  authToken: string | null;
  onNotificationCountChange?: (count: number) => void;
}

export default function NotificationPanel({
  isOpen,
  onClose,
  authToken,
  onNotificationCountChange,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authToken) {
      fetchNotifications();
    }
  }, [authToken, isOpen]);

  const fetchNotifications = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/notifications", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
        if (onNotificationCountChange) {
          onNotificationCountChange(data.data.unreadCount);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!authToken) return;
    try {
      await fetch(`http://localhost:4000/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!authToken) return;
    try {
      await fetch("http://localhost:4000/api/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "MENTION":
      case "COMMENT_REPLY":
        return <MessageSquare className="w-4 h-4 text-[#F2A900]" />;
      case "TASK_ASSIGNED":
      case "TASK_COMPLETED":
        return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case "MEMBER_JOINED":
      case "ROLE_CHANGED":
        return <User className="w-4 h-4 text-[#CC6F00]" />;
      case "AI_COMPLETE":
        return <Sparkles className="w-4 h-4 text-[#F2A900]" />;
      default:
        return <Bell className="w-4 h-4 text-[#CC6F00]" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l-2 border-[#CC6F00]/40 shadow-[-10px_0_40px_rgba(204,111,0,0.25)] flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="bg-[#F9E6A8] border-b-2 border-[#CC6F00]/30 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F2A900] border border-[#CC6F00]/40 flex items-center justify-center text-[#4D2A00]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#4D2A00]">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <span className="text-[10px] font-bold text-[#CC6F00]">
              Collaboration Alerts & Updates
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#F9E6A8] border border-[#CC6F00]/30 text-[10px] font-extrabold text-[#4D2A00] flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3 text-emerald-600" />
              <span>Read All</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 border border-[#CC6F00]/30 text-[#4D2A00] hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#F9E6A8]/10">
        {loading ? (
          <div className="text-center py-10 text-xs text-[#4D2A00]/60 font-semibold">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#4D2A00]/60 font-semibold">
            You're all caught up! No notifications.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                notif.isRead
                  ? "bg-white border-[#CC6F00]/20 opacity-75"
                  : "bg-white border-[#CC6F00]/40 shadow-xs ring-2 ring-[#F2A900]/30"
              }`}
            >
              <div className="p-2 rounded-xl bg-[#F9E6A8]/40 border border-[#CC6F00]/20 shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h5 className="text-xs font-extrabold text-[#4D2A00] truncate">
                    {notif.title}
                  </h5>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#F2A900] shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-[#4D2A00]/80 font-semibold leading-relaxed">
                  {notif.message}
                </p>
                <span className="text-[9px] text-[#4D2A00]/50 font-bold block mt-1">
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
