"use client";

import { useState, useEffect } from "react";
import { PanelLeftOpen, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../components/SplashScreen";
import LoginView from "../components/auth/LoginView";
import SignUpView from "../components/auth/SignUpView";
import UserProfileModal from "../components/UserProfileModal";
import AgentScrollLanding from "../components/landing/AgentScrollLanding";

// Dashboard Architecture Components
import SidebarDrawer, { DashboardView } from "../components/dashboard/SidebarDrawer";
import MyDocumentsView from "../components/dashboard/MyDocumentsView";
import ResearchInputConsole, { ResearchDepth, OutputFormat, DocumentType } from "../components/dashboard/ResearchInputConsole";
import AgentPipelineTracker, { AgentStep } from "../components/dashboard/AgentPipelineTracker";
import PaperWorkspace from "../components/dashboard/PaperWorkspace";
import CollaborationView from "../components/dashboard/CollaborationView";
import CollabEditorModal from "../components/dashboard/CollabEditorModal";
import DocumentRAGView from "../components/dashboard/DocumentRAGView";
import { SavedPaper } from "../components/dashboard/SavedPapersModal";

// Collaboration Modals
import NotificationPanel from "../components/dashboard/NotificationPanel";
import JoinWorkspaceModal from "../components/dashboard/JoinWorkspaceModal";
import InviteAcceptModal from "../components/dashboard/InviteAcceptModal";

export default function Home() {
  const { user, token } = useAuth();
  
  const [showSplash, setShowSplash] = useState(true);
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [viewMode, setViewMode] = useState<"landing" | "dashboard">("landing");
  
  // Real-Time Collaboration Modal State (Legacy quick-room editor)
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [collabRoomId, setCollabRoomId] = useState("");
  const [collabTopic, setCollabTopic] = useState("");
  const [collabContent, setCollabContent] = useState("");
  
  // Collaboration System Modals
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isJoinWorkspaceOpen, setIsJoinWorkspaceOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  // Active Sidebar View (Default Home Screen = "documents")
  const [currentView, setCurrentView] = useState<DashboardView>("documents");

  // Left Sidebar Drawer State (Collapsible / Full Screen Mode)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Hydrate sidebar state from localStorage and default to collapsed on mobile
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("researchflow_sidebar_open");
      if (saved !== null) {
        setIsSidebarOpen(saved === "true");
      } else {
        setIsSidebarOpen(window.innerWidth >= 1024);
      }
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("researchflow_sidebar_open", String(next));
      }
      return next;
    });
  };

  const toggleNotificationPanel = () => {
    setIsNotificationPanelOpen((prev) => !prev);
  };

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Research Console States
  const [question, setQuestion] = useState("");
  const [currentResearchTopic, setCurrentResearchTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<AgentStep>("idle");
  const [docType, setDocType] = useState<DocumentType>("research_paper");
  const [researchDepth, setResearchDepth] = useState<ResearchDepth>("deep");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("markdown");
  
  const [report, setReport] = useState("");
  const [queries, setQueries] = useState<string[]>([]);
  
  // Persistent Research Documents & Workspaces
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<SavedPaper | null>(null);
  const [selectedPaperForRAG, setSelectedPaperForRAG] = useState<SavedPaper | null>(null);

  // Check URL query parameters for invite token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const invite = urlParams.get("invite");
      if (invite) {
        setInviteToken(invite);
      }
    }
  }, []);

  // Fetch documents from PostgreSQL & migrate any local storage papers
  useEffect(() => {
    if (token) {
      migrateAndFetchDocuments();
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("researchflow_saved_papers");
      setSavedPapers([]);
      setSelectedPaper(null);
      setReport("");
    }
  }, [token]);

  const migrateAndFetchDocuments = async () => {
    if (!token) return;

    // Check localStorage for old papers to migrate to PostgreSQL
    try {
      const stored = localStorage.getItem("researchflow_saved_papers");
      if (stored) {
        const localPapers = JSON.parse(stored);
        if (Array.isArray(localPapers) && localPapers.length > 0) {
          await fetch("http://localhost:4000/api/documents/migrate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ papers: localPapers }),
          });
          // Clear migrated papers from localStorage
          localStorage.removeItem("researchflow_saved_papers");
        }
      }
    } catch (e) {
      console.error("Migration error:", e);
    }

    // Fetch from backend PostgreSQL
    fetchUserDocuments();
  };

  const fetchUserDocuments = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:4000/api/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSavedPapers(data.data.all || []);
      }
    } catch (err) {
      console.error("Failed to load documents from backend:", err);
    }
  };

  const handleDeletePaper = async (id: string) => {
    if (!token) return;
    try {
      // Optimistically remove from state so the card instantly vanishes in UI
      setSavedPapers((prev) => prev.filter((p) => p.id !== id));
      if (selectedPaper?.id === id) {
        setSelectedPaper(null);
        setReport("");
        setCurrentView("documents");
      }

      const res = await fetch(`http://localhost:4000/api/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchUserDocuments();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to delete paper on backend:", errorData);
        // Revert by re-fetching
        fetchUserDocuments();
      }
    } catch (err) {
      console.error("Failed to delete paper:", err);
      fetchUserDocuments();
    }
  };

  // 1. Show Splash Screen on initial launch
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Unauthenticated State: Show Login or Sign Up View
  if (!user) {
    if (authView === "login") {
      return <LoginView onSwitchToSignUp={() => setAuthView("signup")} />;
    } else {
      return <SignUpView onSwitchToLogin={() => setAuthView("login")} />;
    }
  }

  // 3. Execution Handler for Research Engine
  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const activeTopic = question.trim();
    setCurrentResearchTopic(activeTopic);
    setQuestion(""); // Clean old input instantly so input section is blank

    setLoading(true);
    setReport("");
    setQueries([]);
    setActiveStep("planning");

    let streamedSuccess = false;
    let finalResultData: any = null;

    try {
      // Step A: Attempt real-time SSE stream from FastAPI AI Engine
      try {
        const streamRes = await fetch("http://localhost:8000/api/research/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            question: activeTopic, 
            depth: researchDepth,
            doc_type: docType,
            initiated_by: user.id
          }),
        });

        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() || "";

            for (const part of parts) {
              const trimmed = part.trim();
              if (trimmed.startsWith("data:")) {
                try {
                  const event = JSON.parse(trimmed.replace(/^data:\s*/, ""));
                  if (event.type === "step_start" && event.step) {
                    setActiveStep(event.step as AgentStep);
                  } else if (event.type === "step_complete") {
                    if (event.search_queries && Array.isArray(event.search_queries)) {
                      setQueries(event.search_queries);
                    }
                  } else if (event.type === "pipeline_complete" && event.data) {
                    finalResultData = event.data;
                    streamedSuccess = true;
                  }
                } catch (parseErr) {
                  console.error("Error parsing stream chunk:", parseErr);
                }
              }
            }
          }
        }
      } catch (streamErr) {
        console.warn("Real-time stream connection failed, falling back to standard API:", streamErr);
      }

      // Step B: Fallback to standard synchronous execution with step progression ticker
      if (!streamedSuccess || !finalResultData) {
        const stepsForDepth: AgentStep[] = 
          researchDepth === "fast"
            ? ["planning", "searching", "writing"]
            : researchDepth === "balanced"
            ? ["planning", "searching", "crawling", "chunking", "vector_rag", "reasoning", "writing"]
            : ["planning", "searching", "crawling", "chunking", "vector_rag", "reasoning", "writing", "citation", "reviewing", "diagramming"];

        let stepIndex = 0;
        setActiveStep(stepsForDepth[0]);

        const ticker = setInterval(() => {
          if (stepIndex < stepsForDepth.length - 1) {
            stepIndex++;
            setActiveStep(stepsForDepth[stepIndex]);
          }
        }, 1200);

        try {
          const res = await fetch("http://localhost:8000/api/research/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              question: activeTopic, 
              depth: researchDepth,
              doc_type: docType,
              initiated_by: user.id
            }),
          });

          const responseData = await res.json();
          clearInterval(ticker);

          if (responseData.status === "success" && responseData.data) {
            finalResultData = responseData.data;
          }
        } catch (fetchErr) {
          clearInterval(ticker);
          throw fetchErr;
        }
      }

      // Step C: Process final report and persist to PostgreSQL
      if (finalResultData) {
        if (finalResultData.search_queries && Array.isArray(finalResultData.search_queries)) {
          setQueries(finalResultData.search_queries);
        }

        const generatedReport = 
          (finalResultData.report && finalResultData.report.trim()) || 
          (finalResultData.cited_report && finalResultData.cited_report.trim()) || 
          (finalResultData.draft_report && finalResultData.draft_report.trim()) || 
          "No report content generated.";

        setReport(generatedReport);
        setActiveStep("completed");

        // Save Document to PostgreSQL Database (Auto-creates Workspace & Owner role)
        if (token && generatedReport) {
          try {
            const saveRes = await fetch("http://localhost:4000/api/documents", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                topic: activeTopic,
                report: generatedReport,
                depth: researchDepth,
                format: outputFormat,
                docType: docType,
                status: "COLLABORATING",
                mermaidDiagram: finalResultData.mermaid_diagram || null,
              }),
            });
            const saveData = await saveRes.json();
            if (saveData.success && saveData.data) {
              const newDoc = saveData.data.document;
              const newWorkspace = saveData.data.workspace;
              setSelectedPaper({
                id: newDoc.id,
                topic: newDoc.topic,
                report: newDoc.report,
                depth: newDoc.depth,
                format: newDoc.format,
                docType: newDoc.docType || docType,
                createdAt: newDoc.createdAt,
                workspaceId: newWorkspace.id,
                workspaceName: newWorkspace.name,
                status: newDoc.status,
                role: "OWNER",
                isOwner: true,
              });
              fetchUserDocuments();
            }
          } catch (saveErr) {
            console.error("Error saving to PostgreSQL:", saveErr);
          }
        }

        // Brief delay so user sees "Pipeline Complete" with all green checkmarks before switching to reader
        setTimeout(() => {
          setCurrentView("reader");
        }, 1400);

      } else {
        setReport("Failed to generate research report. Please check API keys.");
        setActiveStep("idle");
      }
    } catch (err: any) {
      console.error("Research execution error:", err);
      setReport(`Error connecting to AI Engine: ${err.message}. Make sure Python FastAPI is running on port 8000.`);
      setActiveStep("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#F9E6A8] text-[#4D2A00] flex overflow-hidden fixed inset-0">
      
      {/* 10-Agent Architecture Snap-Scroll Landing Overlay */}
      {viewMode === "landing" && (
        <AgentScrollLanding onEnterDashboard={() => setViewMode("dashboard")} />
      )}
      
      {/* Account Settings Modal */}
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => toggleSidebar()}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Left Sidebar Navigation Drawer Container */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-30 h-full transition-all duration-300 ease-in-out shrink-0 flex ${
          isSidebarOpen
            ? "w-64 sm:w-72 translate-x-0 opacity-100"
            : "w-0 -translate-x-full lg:translate-x-0 lg:w-0 opacity-0 pointer-events-none overflow-hidden"
        }`}
      >
        <SidebarDrawer
          currentView={currentView}
          setCurrentView={(view) => {
            if (view === "generate") {
              setQuestion("");
            }
            setCurrentView(view);
            // On mobile / small screens, auto-close drawer upon navigation
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              setIsSidebarOpen(false);
            }
          }}
          onExploreAgents={() => setViewMode("landing")}
          onOpenSettings={() => setIsProfileModalOpen(true)}
          savedPapersCount={savedPapers.length}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={toggleNotificationPanel}
          isNotificationsOpen={isNotificationPanelOpen}
          onOpenJoinWorkspace={() => setIsJoinWorkspaceOpen(true)}
          isOpen={isSidebarOpen}
          onClose={toggleSidebar}
        />
      </div>

      {/* Main Workspace View Container */}
      <main
        className={`flex-1 h-full min-h-0 p-4 sm:p-6 lg:p-8 ${
          !isSidebarOpen ? "max-w-none" : "max-w-7xl"
        } w-full mx-auto flex flex-col gap-4 sm:gap-6 overflow-y-auto transition-all duration-300`}
      >
        {/* Top Control Bar when Drawer is Collapsed (Full Screen Mode) */}
        {!isSidebarOpen && (
          <div className="flex items-center justify-between gap-3 shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 bg-white border-2 border-[#CC6F00]/30 shadow-xs rounded-2xl p-1.5 transition-all">
              <button
                onClick={toggleSidebar}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F9E6A8]/50 hover:bg-[#F2A900] text-[#4D2A00] font-extrabold text-xs border border-[#CC6F00]/30 transition-all hover:scale-105 active:scale-95 shadow-2xs group"
                title="Open Navigation Drawer (Ctrl+B)"
                aria-label="Open Navigation Drawer"
              >
                <PanelLeftOpen className="w-4 h-4 text-[#CC6F00] group-hover:text-[#4D2A00] transition-colors" />
                <span className="font-extrabold text-xs text-[#4D2A00]">Menu</span>
              </button>

              <div className="h-4 w-px bg-[#CC6F00]/30 mx-0.5" />

              {/* Adjusted Notification Bell with Ball Badge */}
              <button
                onClick={toggleNotificationPanel}
                className={`relative p-1.5 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-2xs ${
                  isNotificationPanelOpen
                    ? "bg-[#F2A900] border-[#CC6F00] text-[#4D2A00] ring-2 ring-[#CC6F00]/30 shadow-sm"
                    : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] border-[#CC6F00]/30 text-[#4D2A00]"
                }`}
                title={isNotificationPanelOpen ? "Close Notifications" : "Open Notifications"}
                aria-label={isNotificationPanelOpen ? "Close Notifications" : "Open Notifications"}
                aria-expanded={isNotificationPanelOpen}
              >
                <Bell className={`w-4 h-4 ${isNotificationPanelOpen ? "text-[#4D2A00]" : "text-[#CC6F00]"}`} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#CC6F00] text-white font-black text-[9px] flex items-center justify-center animate-pulse shadow-sm">
                    {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* View 1: My Documents & Papers (Default Home View) */}
        {currentView === "documents" && (
          <MyDocumentsView
            savedPapers={savedPapers}
            onSelectPaper={(paper) => {
              setSelectedPaper(paper);
              setReport(paper.report);
              if (paper.docType) setDocType(paper.docType as DocumentType);
              setCurrentView("reader");
            }}
            onDeletePaper={handleDeletePaper}
            onNavigateToGenerate={() => {
              setQuestion("");
              setCurrentView("generate");
            }}
            onNavigateToRAG={(paper) => {
              setSelectedPaperForRAG(paper);
              setCurrentView("rag_assistant");
            }}
            authToken={token}
            currentUserId={user.id}
          />
        )}

        {/* View 2: Generate New Paper Console */}
        {currentView === "generate" && (
          <div className="flex flex-col gap-6">
            <ResearchInputConsole
              question={question}
              setQuestion={setQuestion}
              loading={loading}
              docType={docType}
              setDocType={setDocType}
              researchDepth={researchDepth}
              setResearchDepth={setResearchDepth}
              outputFormat={outputFormat}
              setOutputFormat={setOutputFormat}
              onSubmit={handleRunResearch}
            />

            <AgentPipelineTracker
              activeStep={activeStep}
              loading={loading}
              queries={queries}
              depth={researchDepth}
            />
          </div>
        )}

        {/* View 3: Document Reader / Collaborative Workspace View */}
        {currentView === "reader" && (
          report ? (
            <PaperWorkspace
              report={report}
              topic={selectedPaper?.topic || currentResearchTopic || question}
              docType={selectedPaper?.docType || docType}
              documentId={selectedPaper?.id || ""}
              workspaceId={selectedPaper?.workspaceId || ""}
              isOwner={selectedPaper ? selectedPaper.isOwner !== false : true}
              currentRole={selectedPaper?.role || "OWNER"}
              authToken={token}
              currentUserId={user.id}
              status={selectedPaper?.status || "COLLABORATING"}
              onDocumentUpdated={(newReport) => {
                setReport(newReport);
                fetchUserDocuments();
              }}
              onStatusChanged={() => {
                fetchUserDocuments();
              }}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={toggleSidebar}
            />
          ) : (
            <MyDocumentsView
              savedPapers={savedPapers}
              onSelectPaper={(paper) => {
                setSelectedPaper(paper);
                setReport(paper.report);
                if (paper.docType) setDocType(paper.docType as DocumentType);
                setCurrentView("reader");
              }}
              onDeletePaper={handleDeletePaper}
              onNavigateToGenerate={() => {
                setQuestion("");
                setCurrentView("generate");
              }}
              onNavigateToRAG={(paper) => {
                setSelectedPaperForRAG(paper);
                setCurrentView("rag_assistant");
              }}
              authToken={token}
              currentUserId={user.id}
            />
          )
        )}

        {/* View 4: Collaborative Workspaces View */}
        {currentView === "collaboration" && (
          <CollaborationView
            savedPapers={savedPapers}
            onOpenCollab={(paper, roomId) => {
              setCollabRoomId(roomId);
              setCollabTopic(paper ? paper.topic : `Workspace ${roomId}`);
              setCollabContent(paper ? paper.report : "");
              setCollabModalOpen(true);
            }}
          />
        )}

        {/* View 5: Personal Document RAG Assistant View */}
        {currentView === "rag_assistant" && (
          <DocumentRAGView 
            savedPapers={savedPapers} 
            initialPaper={selectedPaperForRAG} 
          />
        )}

      </main>

      {/* Real-Time Collaborative Co-Authoring Modal (Socket.io) */}
      <CollabEditorModal
        isOpen={collabModalOpen}
        onClose={() => setCollabModalOpen(false)}
        roomId={collabRoomId}
        initialTopic={collabTopic}
        initialContent={collabContent}
      />

      {/* Notifications Drawer */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
        authToken={token}
        onNotificationCountChange={(count) => setUnreadNotificationsCount(count)}
      />

      {/* Join Workspace Modal (via Invite Code) */}
      <JoinWorkspaceModal
        isOpen={isJoinWorkspaceOpen}
        onClose={() => setIsJoinWorkspaceOpen(false)}
        authToken={token}
        onJoinedSuccess={(workspaceId) => {
          fetchUserDocuments();
          setCurrentView("documents");
        }}
      />

      {/* Accept Invite Link Modal */}
      {inviteToken && (
        <InviteAcceptModal
          token={inviteToken}
          onClose={() => setInviteToken(null)}
          authToken={token}
          onAccepted={(workspaceId) => {
            setInviteToken(null);
            fetchUserDocuments();
            setCurrentView("documents");
          }}
        />
      )}

    </div>
  );
}
