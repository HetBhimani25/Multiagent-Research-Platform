"use client";

import { useState, useEffect } from "react";
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
import EngineMetricsView from "../components/dashboard/EngineMetricsView";
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

  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Research Console States
  const [question, setQuestion] = useState("");
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

    setLoading(true);
    setReport("");
    setQueries([]);
    setActiveStep("planning");

    try {
      setActiveStep("planning");
      
      const res = await fetch("http://localhost:8000/api/research/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question, 
          depth: researchDepth,
          doc_type: docType,
          initiated_by: user.id
        }),
      });

      const responseData = await res.json();

      if (responseData.status === "success" && responseData.data) {
        const data = responseData.data;
        
        setActiveStep("searching");
        if (data.search_queries) setQueries(data.search_queries);
        
        setTimeout(() => setActiveStep("writing"), 800);
        setTimeout(async () => {
          const generatedReport = (data.report && data.report.trim()) || 
                                  (data.cited_report && data.cited_report.trim()) || 
                                  (data.draft_report && data.draft_report.trim()) || 
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
                  topic: question,
                  report: generatedReport,
                  depth: researchDepth,
                  format: outputFormat,
                  docType: docType,
                  status: "COLLABORATING",
                  mermaidDiagram: data.mermaid_diagram || null,
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

          // Switch to Reader View to display generated paper
          setCurrentView("reader");
        }, 1600);

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

      {/* Main Left Sidebar Navigation Drawer */}
      <SidebarDrawer
        currentView={currentView}
        setCurrentView={setCurrentView}
        onExploreAgents={() => setViewMode("landing")}
        onOpenSettings={() => setIsProfileModalOpen(true)}
        savedPapersCount={savedPapers.length}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationPanelOpen(true)}
        onOpenJoinWorkspace={() => setIsJoinWorkspaceOpen(true)}
      />

      {/* Main Workspace View Container */}
      <main className={`flex-1 h-full min-h-0 p-6 sm:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6 ${currentView === "reader" ? "overflow-hidden" : "overflow-y-auto"}`}>
        
        {/* View 1: My Documents & Papers (Default Home View) */}
        {currentView === "documents" && (
          <MyDocumentsView
            savedPapers={savedPapers}
            onSelectPaper={(paper) => {
              setSelectedPaper(paper);
              setQuestion(paper.topic);
              setReport(paper.report);
              if (paper.docType) setDocType(paper.docType as DocumentType);
              setCurrentView("reader");
            }}
            onDeletePaper={handleDeletePaper}
            onNavigateToGenerate={() => setCurrentView("generate")}
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
            />
          </div>
        )}

        {/* View 3: Document Reader / Collaborative Workspace View */}
        {currentView === "reader" && (
          report ? (
            <PaperWorkspace
              report={report}
              topic={question}
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
            />
          ) : (
            <MyDocumentsView
              savedPapers={savedPapers}
              onSelectPaper={(paper) => {
                setSelectedPaper(paper);
                setQuestion(paper.topic);
                setReport(paper.report);
                if (paper.docType) setDocType(paper.docType as DocumentType);
                setCurrentView("reader");
              }}
              onDeletePaper={handleDeletePaper}
              onNavigateToGenerate={() => setCurrentView("generate")}
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

        {/* View 6: System Metrics View */}
        {currentView === "metrics" && (
          <EngineMetricsView />
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
