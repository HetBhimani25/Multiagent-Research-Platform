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
import ResearchInputConsole, { ResearchDepth, OutputFormat } from "../components/dashboard/ResearchInputConsole";
import AgentPipelineTracker, { AgentStep } from "../components/dashboard/AgentPipelineTracker";
import PaperWorkspace from "../components/dashboard/PaperWorkspace";
import CollaborationView from "../components/dashboard/CollaborationView";
import DocumentRAGView from "../components/dashboard/DocumentRAGView";
import EngineMetricsView from "../components/dashboard/EngineMetricsView";
import { SavedPaper } from "../components/dashboard/SavedPapersModal";

export default function Home() {
  const { user } = useAuth();
  
  const [showSplash, setShowSplash] = useState(true);
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [viewMode, setViewMode] = useState<"landing" | "dashboard">("landing");
  
  // Active Sidebar View (Default Home Screen = "documents")
  const [currentView, setCurrentView] = useState<DashboardView>("documents");

  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Research Console States
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<AgentStep>("idle");
  const [researchDepth, setResearchDepth] = useState<ResearchDepth>("deep");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("markdown");
  
  const [report, setReport] = useState("");
  const [queries, setQueries] = useState<string[]>([]);
  
  // Local Saved Papers Library State
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
  const [selectedPaperForRAG, setSelectedPaperForRAG] = useState<SavedPaper | null>(null);

  // Load saved papers from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("researchflow_saved_papers");
      if (stored) {
        setSavedPapers(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved papers from storage", e);
    }
  }, []);

  // Helper to save paper to localStorage
  const savePaperToLibrary = (topicName: string, paperContent: string, depthVal: string, fmtVal: string) => {
    const newPaper: SavedPaper = {
      id: Date.now().toString(),
      topic: topicName,
      report: paperContent,
      createdAt: new Date().toISOString(),
      depth: depthVal,
      format: fmtVal,
    };
    const updated = [newPaper, ...savedPapers];
    setSavedPapers(updated);
    try {
      localStorage.setItem("researchflow_saved_papers", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save paper to storage", e);
    }
  };

  const handleDeletePaper = (id: string) => {
    const updated = savedPapers.filter(p => p.id !== id);
    setSavedPapers(updated);
    try {
      localStorage.setItem("researchflow_saved_papers", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to delete paper from storage", e);
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
        body: JSON.stringify({ question }),
      });

      const responseData = await res.json();

      if (responseData.status === "success" && responseData.data) {
        const data = responseData.data;
        
        setActiveStep("searching");
        if (data.search_queries) setQueries(data.search_queries);
        
        setTimeout(() => setActiveStep("writing"), 800);
        setTimeout(() => {
          setReport(data.report || "No report content generated.");
          setActiveStep("completed");
          
          if (data.report) {
            savePaperToLibrary(question, data.report, researchDepth, outputFormat);
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
    <div className="min-h-screen bg-[#F9E6A8] text-[#4D2A00] flex relative overflow-x-hidden">
      
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
      />

      {/* Main Workspace View Container */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6 overflow-y-auto">
        
        {/* View 1: My Documents & Papers (Default Home View) */}
        {currentView === "documents" && (
          <MyDocumentsView
            savedPapers={savedPapers}
            onSelectPaper={(paper) => {
              setQuestion(paper.topic);
              setReport(paper.report);
              setCurrentView("reader");
            }}
            onDeletePaper={handleDeletePaper}
            onNavigateToGenerate={() => setCurrentView("generate")}
            onNavigateToRAG={(paper) => {
              setSelectedPaperForRAG(paper);
              setCurrentView("rag_assistant");
            }}
          />
        )}

        {/* View 2: Generate New Paper Console */}
        {currentView === "generate" && (
          <div className="flex flex-col gap-6">
            <ResearchInputConsole
              question={question}
              setQuestion={setQuestion}
              loading={loading}
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

            {report && (
              <PaperWorkspace
                report={report}
                topic={question}
              />
            )}
          </div>
        )}

        {/* View 3: Document Reader View */}
        {currentView === "reader" && (
          report ? (
            <PaperWorkspace
              report={report}
              topic={question}
            />
          ) : (
            <MyDocumentsView
              savedPapers={savedPapers}
              onSelectPaper={(paper) => {
                setQuestion(paper.topic);
                setReport(paper.report);
                setCurrentView("reader");
              }}
              onDeletePaper={handleDeletePaper}
              onNavigateToGenerate={() => setCurrentView("generate")}
              onNavigateToRAG={(paper) => {
                setSelectedPaperForRAG(paper);
                setCurrentView("rag_assistant");
              }}
            />
          )
        )}

        {/* View 4: Collaborative Workspaces View */}
        {currentView === "collaboration" && (
          <CollaborationView savedPapers={savedPapers} />
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

    </div>
  );
}
