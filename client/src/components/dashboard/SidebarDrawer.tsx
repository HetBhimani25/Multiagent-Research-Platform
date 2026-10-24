"use client";

import React from "react";
import { 
  BrainCircuit, 
  FileText, 
  PlusCircle, 
  Users, 
  Bot, 
  Compass, 
  Settings, 
  LogOut,
  ChevronRight,
  Bell,
  KeyRound,
  PanelLeftClose
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export type DashboardView = 
  | "documents" 
  | "generate" 
  | "reader" 
  | "collaboration" 
  | "rag_assistant";

interface SidebarDrawerProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
  onExploreAgents: () => void;
  onOpenSettings: () => void;
  savedPapersCount: number;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  isNotificationsOpen?: boolean;
  onOpenJoinWorkspace?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SidebarDrawer({
  currentView,
  setCurrentView,
  onExploreAgents,
  onOpenSettings,
  savedPapersCount,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  isNotificationsOpen = false,
  onOpenJoinWorkspace,
  isOpen = true,
  onClose,
}: SidebarDrawerProps) {
  const { user, logout } = useAuth();

  const NAV_ITEMS = [
    {
      id: "documents" as DashboardView,
      label: "My Documents & Papers",
      icon: FileText,
      badge: savedPapersCount > 0 ? savedPapersCount : undefined,
    },
    {
      id: "generate" as DashboardView,
      label: "Generate New Document",
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: "rag_assistant" as DashboardView,
      label: "Document RAG Assistant",
      icon: Bot,
    },
    {
      id: "collaboration" as DashboardView,
      label: "Collaborative Workspaces",
      icon: Users,
      badge: "Multi-User",
    },
  ];

  return (
    <aside className="w-64 sm:w-72 h-full bg-white border-r-2 border-[#CC6F00]/30 flex flex-col justify-between p-4 sm:p-5 shadow-[5px_0_30px_rgba(204,111,0,0.15)] z-30 shrink-0">
      
      {/* Top Header: Brand Logo & Title + Scrollable Navigation Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-1.5 py-1">
        {/* Main Logo and Project Title */}
        <div className="flex items-center space-x-3 pb-1 shrink-0">
          <div className="p-2.5 bg-[#F2A900]/20 border border-[#CC6F00]/30 text-[#CC6F00] rounded-2xl shadow-xs shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-black text-lg leading-tight bg-gradient-to-r from-[#4D2A00] via-[#CC6F00] to-[#4D2A00] bg-clip-text text-transparent truncate">
              ResearchFlow AI
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 py-2.5 border-y border-[#CC6F00]/20 my-2 shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] border border-[#CC6F00]/30 text-[#4D2A00] hover:text-[#CC6F00] transition-all hover:scale-105 active:scale-95 shadow-2xs"
              title="Collapse Sidebar / Full Screen (Ctrl+B)"
              aria-label="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-[#CC6F00]" />
            </button>
          )}

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className={`relative p-2.5 rounded-2xl border transition-all hover:scale-105 active:scale-95 shadow-2xs ${
                isNotificationsOpen
                  ? "bg-[#F2A900] border-[#CC6F00] text-[#4D2A00] ring-2 ring-[#CC6F00]/30 shadow-sm"
                  : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] border-[#CC6F00]/30 text-[#4D2A00]"
              }`}
              title={isNotificationsOpen ? "Close Notifications" : "Open Notifications"}
              aria-label={isNotificationsOpen ? "Close Notifications" : "Open Notifications"}
              aria-expanded={isNotificationsOpen}
            >
              <Bell className={`w-4 h-4 ${isNotificationsOpen ? "text-[#4D2A00]" : "text-[#CC6F00]"}`} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#CC6F00] text-white font-black text-[9px] flex items-center justify-center animate-pulse shadow-sm">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}
          
        </div>

        {/* Main Navigation Menu Links */}
        <div className="mt-3 flex flex-col space-y-1.5 flex-1 pb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#CC6F00] px-2 mb-1">
            Platform Views
          </span>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all ${
                  isActive
                    ? "bg-[#F2A900] text-[#4D2A00] shadow-[0_4px_15px_rgba(242,169,0,0.4)] border-2 border-[#CC6F00]/50 font-black"
                    : item.highlight
                    ? "bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] text-[#4D2A00] border border-[#CC6F00]/30"
                    : "text-[#4D2A00]/80 hover:bg-[#F9E6A8]/40 hover:text-[#4D2A00]"
                }`}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0 mr-1">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#4D2A00]" : "text-[#CC6F00]"}`} />
                  <span className="text-[11px] sm:text-xs font-extrabold truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                    isActive 
                      ? "bg-[#4D2A00] text-[#F9E6A8]" 
                      : "bg-[#F9E6A8] text-[#CC6F00] border border-[#CC6F00]/30"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="my-2 border-t border-[#CC6F00]/20"></div>

          {/* Join Research Workspace (via Code) */}
          {onOpenJoinWorkspace && (
            <button
              onClick={onOpenJoinWorkspace}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-extrabold text-[#4D2A00] bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] transition-all border border-[#CC6F00]/30 shadow-2xs"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <KeyRound className="w-4 h-4 text-[#CC6F00] shrink-0" />
                <span className="truncate">Join via Invite Code</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#CC6F00] shrink-0 ml-1" />
            </button>
          )}

          {/* Explore Agents Flow (Landing View Overlay) */}
          <button
            onClick={onExploreAgents}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-extrabold text-[#4D2A00]/80 hover:bg-[#F9E6A8]/40 hover:text-[#4D2A00] transition-all border border-dashed border-[#CC6F00]/30 mt-1"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Compass className="w-4 h-4 text-[#CC6F00] shrink-0" />
              <span className="truncate">Explore 10 Agents Flow</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#CC6F00] shrink-0 ml-1" />
          </button>
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="pt-3 border-t border-[#CC6F00]/20 shrink-0 bg-white">
        {user && (
          <div className="bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-2 text-left flex-1 truncate hover:opacity-80 transition-opacity min-w-0"
            >
              <div className="w-8 h-8 rounded-xl bg-[#F2A900] text-[#4D2A00] font-black text-xs flex items-center justify-center border border-[#CC6F00]/30 shrink-0">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-extrabold text-[#4D2A00] truncate">{user.fullName}</p>
                <p className="text-[10px] font-bold text-[#CC6F00] truncate">{user.email}</p>
              </div>
            </button>

            <div className="flex items-center space-x-1 shrink-0 ml-1">
              <button
                onClick={onOpenSettings}
                title="Account Settings"
                className="p-1.5 text-[#CC6F00] hover:text-[#4D2A00] transition-colors rounded-lg hover:bg-[#F9E6A8]/50"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-[#CC6F00] hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </aside>
  );
}
