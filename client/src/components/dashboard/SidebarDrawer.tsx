"use client";

import React from "react";
import { 
  BrainCircuit, 
  FileText, 
  PlusCircle, 
  Users, 
  Bot, 
  Compass, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export type DashboardView = 
  | "documents" 
  | "generate" 
  | "reader" 
  | "collaboration" 
  | "rag_assistant" 
  | "metrics";

interface SidebarDrawerProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
  onExploreAgents: () => void;
  onOpenSettings: () => void;
  savedPapersCount: number;
}

export default function SidebarDrawer({
  currentView,
  setCurrentView,
  onExploreAgents,
  onOpenSettings,
  savedPapersCount
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
      label: "Generate New Paper",
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: "collaboration" as DashboardView,
      label: "Collaborative Workspaces",
      icon: Users,
      badge: "Multi-User",
    },
    {
      id: "rag_assistant" as DashboardView,
      label: "Document RAG Assistant",
      icon: Bot,
    },
    {
      id: "metrics" as DashboardView,
      label: "System Metrics",
      icon: BarChart3,
    },
  ];

  return (
    <aside className="w-64 sm:w-72 bg-white border-r-2 border-[#CC6F00]/30 min-h-screen flex flex-col justify-between p-4 sm:p-5 shadow-[5px_0_30px_rgba(204,111,0,0.15)] z-30 shrink-0">
      
      {/* Top Header: Brand Logo & Title */}
      <div>
        <div className="flex items-center space-x-3 pb-6 border-b border-[#CC6F00]/20">
          <div className="p-2.5 bg-[#F2A900]/20 border border-[#CC6F00]/30 text-[#CC6F00] rounded-2xl shadow-xs">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-none bg-gradient-to-r from-[#4D2A00] via-[#CC6F00] to-[#4D2A00] bg-clip-text text-transparent">
              ResearchFlow AI
            </h1>
            <p className="text-[10px] font-bold text-[#CC6F00] mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#F2A900]" />
              v2.0 Multi-Agent Platform
            </p>
          </div>
        </div>

        {/* Main Navigation Menu Links */}
        <div className="mt-6 flex flex-col space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#CC6F00] px-3 mb-1">
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
                    ? "bg-[#F2A900] text-[#4D2A00] shadow-[0_4px_15px_rgba(242,169,0,0.4)] border border-[#CC6F00]/40 scale-[1.02]"
                    : item.highlight
                    ? "bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] text-[#4D2A00] border border-[#CC6F00]/30"
                    : "text-[#4D2A00]/80 hover:bg-[#F9E6A8]/40 hover:text-[#4D2A00]"
                }`}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0 mr-1">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#4D2A00]" : "text-[#CC6F00]"}`} />
                  <span className="whitespace-nowrap text-[11px] sm:text-xs font-extrabold truncate">{item.label}</span>
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

          {/* Explore Agents Flow (Landing View Overlay) */}
          <button
            onClick={onExploreAgents}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold text-[#4D2A00]/80 hover:bg-[#F9E6A8]/40 hover:text-[#4D2A00] transition-all border border-dashed border-[#CC6F00]/30"
          >
            <div className="flex items-center space-x-2.5">
              <Compass className="w-4 h-4 text-[#CC6F00]" />
              <span>Explore 10 Agents Flow</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#CC6F00]" />
          </button>
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="pt-4 border-t border-[#CC6F00]/20">
        {user && (
          <div className="bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-2 text-left flex-1 truncate hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-xl bg-[#F2A900] text-[#4D2A00] font-black text-xs flex items-center justify-center border border-[#CC6F00]/30 shrink-0">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
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
