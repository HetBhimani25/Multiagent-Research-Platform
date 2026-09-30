"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../components/SplashScreen";
import LoginView from "../components/auth/LoginView";
import SignUpView from "../components/auth/SignUpView";
import UserProfileModal from "../components/UserProfileModal";
import AgentScrollLanding from "../components/landing/AgentScrollLanding";
import { 
  Sparkles, 
  BrainCircuit, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Zap, 
  Bot,
  Copy,
  Check,
  LogOut,
  Settings,
  Compass
} from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();
  
  const [showSplash, setShowSplash] = useState(true);
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [viewMode, setViewMode] = useState<"landing" | "dashboard">("landing");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<"idle" | "planning" | "searching" | "writing" | "completed">("idle");
  const [report, setReport] = useState("");
  const [plan, setPlan] = useState("");
  const [queries, setQueries] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

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

  // 3. Main ResearchFlow AI Dashboard & Agent Landing Overlay
  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setReport("");
    setPlan("");
    setQueries([]);
    setActiveStep("planning");

    try {
      const res = await fetch("http://localhost:8000/api/research/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const responseData = await res.json();

      if (responseData.status === "success" && responseData.data) {
        const data = responseData.data;
        setPlan(data.plan || "");
        setQueries(data.search_queries || []);
        setReport(data.report || "No report content generated.");
        setActiveStep("completed");
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9E6A8] text-[#4D2A00] flex flex-col relative">
      {/* 10-Agent Architecture Snap-Scroll Landing Overlay */}
      {viewMode === "landing" && (
        <AgentScrollLanding onEnterDashboard={() => setViewMode("dashboard")} />
      )}
      
      {/* Profile Modal */}
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      {/* Top Header */}
      <header className="border-b border-[#CC6F00]/20 bg-white/90 backdrop-blur sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#F2A900]/20 text-[#CC6F00] rounded-xl border border-[#CC6F00]/30">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-none bg-gradient-to-r from-[#4D2A00] via-[#CC6F00] to-[#4D2A00] bg-clip-text text-transparent">
                ResearchFlow AI
              </h1>
              <p className="text-xs font-semibold text-[#4D2A00]/70 mt-0.5">LangGraph Autonomous Multi-Agent Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#F2A900]/20 text-[#CC6F00] border border-[#CC6F00]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CC6F00] mr-1.5 animate-pulse"></span>
              FastAPI Engine Online
            </span>

            {/* Explore Agent Architecture Landing View Toggle */}
            <button
              onClick={() => setViewMode("landing")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] border border-[#CC6F00]/30 text-[#4D2A00] text-xs font-bold transition-all shadow-xs"
              title="Explore 10-Agent Scroll Landing Page"
            >
              <Compass className="w-3.5 h-3.5 text-[#CC6F00]" />
              <span className="hidden sm:inline">Explore Agents Flow</span>
            </button>

            {/* Auth Profile Badge & Actions */}
            <div className="flex items-center space-x-2 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-xl p-1.5 pl-2.5">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                title="View Account Details"
              >
                <div className="w-7 h-7 rounded-lg bg-[#F2A900] text-[#4D2A00] font-black text-xs flex items-center justify-center border border-[#CC6F00]/30">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-extrabold text-[#4D2A00] leading-none">{user.fullName}</p>
                  <p className="text-[10px] font-bold text-[#CC6F00] mt-0.5 truncate max-w-[120px]">{user.email}</p>
                </div>
              </button>

              <div className="h-4 w-px bg-[#CC6F00]/30 mx-0.5"></div>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                title="Account Settings"
                className="p-1 text-[#CC6F00] hover:text-[#4D2A00] transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                title="Logout"
                className="p-1 text-[#CC6F00] hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Research Input Section */}
        <section className="bg-white border-2 border-[#CC6F00]/20 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F2A900]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          
          <h2 className="text-xl font-extrabold mb-2 flex items-center gap-2 text-[#4D2A00]">
            <Sparkles className="w-5 h-5 text-[#CC6F00]" />
            Enter Your Research Topic or Paper Goal
          </h2>
          <p className="text-sm font-semibold text-[#4D2A00]/80 mb-6">
            ResearchFlow AI multi-agent pipeline (Planner &rarr; Searcher &rarr; Writer) will perform query decomposition, crawl web data, and synthesize an exportable academic report.
          </p>

          <form onSubmit={handleRunResearch} className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Write a technical overview of Multi-Agent RAG architectures and vector database optimization..."
                className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-2xl p-4 pr-12 text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900] min-h-[110px] resize-y transition-all font-semibold"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4D2A00]/70">
                <Zap className="w-4 h-4 text-[#CC6F00]" />
                <span>Powered by Groq & Tavily Web Search</span>
              </div>

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm border border-[#CC6F00]/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing Agents...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Launch Research
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Live Agent Pipeline Visualizer */}
        {(loading || activeStep !== "idle") && (
          <section className="bg-white border border-[#CC6F00]/20 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#CC6F00] mb-4">
              Agent Execution Progress
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: Planner */}
              <div className={`p-4 rounded-2xl border transition-all ${
                activeStep === "planning" 
                  ? "bg-[#F9E6A8] border-[#CC6F00] text-[#4D2A00] font-bold" 
                  : activeStep === "searching" || activeStep === "writing" || activeStep === "completed"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider">1. Planner Agent</span>
                  {activeStep === "planning" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#CC6F00]" />
                  ) : activeStep !== "idle" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : null}
                </div>
                <p className="text-xs font-medium text-[#4D2A00]/80">Decomposing prompt into search sub-queries</p>
              </div>

              {/* Step 2: Searcher */}
              <div className={`p-4 rounded-2xl border transition-all ${
                activeStep === "searching" 
                  ? "bg-[#F9E6A8] border-[#CC6F00] text-[#4D2A00] font-bold" 
                  : activeStep === "writing" || activeStep === "completed"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider">2. Searcher Agent</span>
                  {activeStep === "searching" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#CC6F00]" />
                  ) : activeStep === "writing" || activeStep === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : null}
                </div>
                <p className="text-xs font-medium text-[#4D2A00]/80">Fetching live web sources via Tavily</p>
              </div>

              {/* Step 3: Writer */}
              <div className={`p-4 rounded-2xl border transition-all ${
                activeStep === "writing" 
                  ? "bg-[#F9E6A8] border-[#CC6F00] text-[#4D2A00] font-bold" 
                  : activeStep === "completed"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider">3. Writer Agent</span>
                  {activeStep === "writing" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#CC6F00]" />
                  ) : activeStep === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : null}
                </div>
                <p className="text-xs font-medium text-[#4D2A00]/80">Synthesizing Markdown report with citations</p>
              </div>
            </div>
          </section>
        )}

        {/* Research Output Panel */}
        {report && (
          <section className="bg-white border-2 border-[#CC6F00]/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#CC6F00]/20 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#CC6F00]" />
                <h3 className="font-extrabold text-lg text-[#4D2A00]">Generated Research Paper</h3>
              </div>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] text-xs text-[#4D2A00] font-bold border border-[#CC6F00]/30 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Markdown
                  </>
                )}
              </button>
            </div>

            {/* Rendered Markdown Output */}
            <div className="prose max-w-none prose-headings:font-extrabold prose-headings:text-[#4D2A00] prose-p:text-[#4D2A00] prose-p:leading-relaxed prose-a:text-[#CC6F00] prose-a:font-bold">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
