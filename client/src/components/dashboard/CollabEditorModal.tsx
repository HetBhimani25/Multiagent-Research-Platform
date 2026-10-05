"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Copy, Check, Users, Send, FileText, MessageSquare, Sparkles, Wifi, ShieldCheck, Edit3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { io, Socket } from "socket.io-client";

interface UserPresence {
  socketId: string;
  name: string;
  avatar: string;
  color: string;
}

interface ChatMessage {
  id: string;
  user: {
    name: string;
    avatar: string;
    color: string;
  };
  text: string;
  timestamp: string;
}

interface CollabEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  initialTopic?: string;
  initialContent?: string;
}

export default function CollabEditorModal({
  isOpen,
  onClose,
  roomId,
  initialTopic = "Collaborative Research Document",
  initialContent = "",
}: CollabEditorModalProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [content, setContent] = useState<string>(initialContent);
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [lastEditor, setLastEditor] = useState<string | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<"preview" | "chat">("preview");
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Current user representation
  const currentUserRef = useRef({
    name: "Het Bhimani",
    avatar: "👨‍💻",
    color: "#F2A900",
  });

  useEffect(() => {
    if (!isOpen || !roomId) return;

    // Connect to Node Gateway socket server on port 4000
    const socketInstance = io("http://localhost:4000", {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      socketInstance.emit("join_room", {
        roomId,
        user: currentUserRef.current,
      });
    });

    socketInstance.on("room_joined", (data: { documentContent: string; users: UserPresence[]; messages: ChatMessage[] }) => {
      if (data.documentContent) {
        setContent(data.documentContent);
      } else if (initialContent) {
        setContent(initialContent);
        socketInstance.emit("document_update", {
          roomId,
          content: initialContent,
          updatedBy: currentUserRef.current.name,
        });
      }
      setUsers(data.users || []);
      setMessages(data.messages || []);
    });

    socketInstance.on("presence_update", (updatedUsers: UserPresence[]) => {
      setUsers(updatedUsers);
    });

    socketInstance.on("document_sync", (data: { content: string; updatedBy: string }) => {
      setContent(data.content);
      setLastEditor(data.updatedBy);
      setTimeout(() => setLastEditor(null), 3000);
    });

    socketInstance.on("new_room_message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socketInstance.emit("leave_room", { roomId });
      socketInstance.disconnect();
    };
  }, [isOpen, roomId, initialContent]);

  useEffect(() => {
    if (activeRightTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeRightTab]);

  if (!isOpen) return null;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (socket && isConnected) {
      socket.emit("document_update", {
        roomId,
        content: newContent,
        updatedBy: currentUserRef.current.name,
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !isConnected) return;

    socket.emit("send_room_message", {
      roomId,
      message: {
        user: currentUserRef.current,
        text: chatInput.trim(),
      },
    });

    setChatInput("");
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4D2A00]/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white border-2 border-[#CC6F00]/40 w-full max-w-7xl h-[92vh] rounded-3xl shadow-[0_25px_60px_rgba(204,111,0,0.35)] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-[#F9E6A8] border-b-2 border-[#CC6F00]/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F2A900] border-2 border-[#CC6F00]/40 flex items-center justify-center text-[#4D2A00] font-black shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#4D2A00] line-clamp-1">
                  {initialTopic}
                </h2>
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isConnected ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                }`}>
                  <Wifi className="w-3 h-3 animate-pulse" />
                  {isConnected ? "Real-Time Sync Active" : "Connecting..."}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-[#4D2A00]/80">Workspace Code:</span>
                <button
                  onClick={copyInviteCode}
                  className="px-2.5 py-0.5 rounded-lg bg-white/80 hover:bg-white border border-[#CC6F00]/40 text-xs font-mono font-extrabold text-[#4D2A00] flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#CC6F00]" />
                      <span>{roomId}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Co-Authors & Close Button */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/80 border border-[#CC6F00]/30 px-3 py-1.5 rounded-2xl">
              <span className="text-xs font-extrabold text-[#4D2A00]/80 mr-1">Co-Authors ({users.length}):</span>
              <div className="flex items-center -space-x-2">
                {users.map((u, i) => (
                  <div
                    key={u.socketId || i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm shadow-sm"
                    style={{ backgroundColor: u.color || "#F2A900" }}
                    title={u.name}
                  >
                    {u.avatar || "👨‍💻"}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-white hover:bg-rose-50 border-2 border-[#CC6F00]/30 text-[#4D2A00] hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {lastEditor && (
          <div className="bg-[#F2A900]/20 border-b border-[#CC6F00]/20 px-6 py-1.5 flex items-center gap-2 text-xs font-semibold text-[#4D2A00] animate-in fade-in">
            <Edit3 className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span><strong>{lastEditor}</strong> is actively making changes to the document...</span>
          </div>
        )}

        {/* Main Split-Screen Editor Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-[#F9E6A8]/10">
          
          {/* Left Panel: Markdown Input Editor */}
          <div className="flex flex-col border-r-2 border-[#CC6F00]/20 h-full overflow-hidden bg-white">
            <div className="bg-[#F9E6A8]/40 border-b border-[#CC6F00]/20 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#4D2A00] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#CC6F00]" />
                Live Markdown Co-Authoring Editor
              </span>
              <span className="text-[10px] font-semibold text-[#4D2A00]/60">
                Auto-sync enabled
              </span>
            </div>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Type research markdown content here... All connected co-authors will see your edits in real time!"
              className="flex-1 w-full p-6 text-sm font-mono text-[#4D2A00] bg-transparent resize-none focus:outline-none leading-relaxed overflow-y-auto"
            />
          </div>

          {/* Right Panel: Rendered Preview OR Live Chat */}
          <div className="flex flex-col h-full overflow-hidden bg-white">
            
            {/* Panel Header Navigation */}
            <div className="bg-[#F9E6A8]/40 border-b border-[#CC6F00]/20 px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveRightTab("preview")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    activeRightTab === "preview"
                      ? "bg-[#F2A900] text-[#4D2A00] shadow-2xs border border-[#CC6F00]/30"
                      : "text-[#4D2A00]/70 hover:bg-[#F9E6A8]/60"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#4D2A00]" />
                  <span>Live Rendered Preview</span>
                </button>
                <button
                  onClick={() => setActiveRightTab("chat")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    activeRightTab === "chat"
                      ? "bg-[#F2A900] text-[#4D2A00] shadow-2xs border border-[#CC6F00]/30"
                      : "text-[#4D2A00]/70 hover:bg-[#F9E6A8]/60"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#4D2A00]" />
                  <span>Co-Author Chat ({messages.length})</span>
                </button>
              </div>
            </div>

            {/* Panel Tab 1: Live Rendered Preview */}
            {activeRightTab === "preview" && (
              <div className="flex-1 p-6 overflow-y-auto prose prose-amber max-w-none text-[#4D2A00]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || "_No document content yet. Start typing on the left!_"}
                </ReactMarkdown>
              </div>
            )}

            {/* Panel Tab 2: Co-Author Live Chat */}
            {activeRightTab === "chat" && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Chat Messages Log */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F9E6A8]/10">
                  {messages.length === 0 ? (
                    <div className="text-center py-10 text-xs text-[#4D2A00]/60 font-semibold">
                      No chat messages yet. Start the conversation with your co-authors!
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 border border-[#CC6F00]/30 shadow-2xs"
                          style={{ backgroundColor: msg.user?.color || "#F2A900" }}
                        >
                          {msg.user?.avatar || "👨‍💻"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-extrabold text-[#4D2A00]">
                              {msg.user?.name}
                            </span>
                            <span className="text-[10px] font-semibold text-[#4D2A00]/50">
                              {msg.timestamp}
                            </span>
                          </div>
                          <div className="bg-white border border-[#CC6F00]/30 p-2.5 rounded-2xl rounded-tl-none text-xs font-semibold text-[#4D2A00] shadow-2xs">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Message Input Form */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#CC6F00]/20 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message to co-authors..."
                    className="flex-1 px-4 py-2 rounded-xl border border-[#CC6F00]/30 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:border-[#F2A900] bg-[#F9E6A8]/20"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 border border-[#CC6F00]/40 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
