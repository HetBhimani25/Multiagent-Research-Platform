"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../components/SplashScreen";
import LoginView from "../components/auth/LoginView";
import SignUpView from "../components/auth/SignUpView";
import UserProfileModal from "../components/UserProfileModal";
import ArchitectureWalkthroughModal from "../components/onboarding/ArchitectureWalkthroughModal";
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
  HelpCircle
} from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();
  
  const [showSplash, setShowSplash] = useState(true);
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(false);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<"idle" | "planning" | "searching" | "writing" | "completed">("idle");
  const [report, setReport] = useState("");
  const [plan, setPlan] = useState("");
  const [queries, setQueries] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Trigger Architecture Walkthrough on initial login/auth transition
  useEffect(() => {
    if (user && !hasSeenWalkthrough) {
      setIsWalkthroughOpen(true);
      setHasSeenWalkthrough(true);
    }
  }, [user, hasSeenWalkthrough]);

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

  // 3. Authenticated State: Main ResearchFlow AI Dashboard
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      
      {/* Profile & Architecture Walkthrough Modals */}
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <ArchitectureWalkthroughModal isOpen={isWalkthroughOpen} onClose={() => setIsWalkthroughOpen(false)} />

      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/10 text-indigo-600 rounded-xl border border-indigo-500/20">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                ResearchFlow AI
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">LangGraph Autonomous Multi-Agent Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              FastAPI Engine Online
            </span>

            {/* View Architecture Agent Flow Button */}
            <button
              onClick={() => setIsWalkthroughOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-all"
              title="View 10-Agent Architecture Walkthrough"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">View Agent Architecture</span>
            </button>

            {/* Auth Profile Badge & Actions */}
            <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-xl p-1.5 pl-2.5">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                title="View Account Details"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-500/20">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-none">{user.fullName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]">{user.email}</p>
                </div>
              </button>

              <div className="h-4 w-px bg-slate-300 mx-0.5"></div>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                title="Account Settings"
                className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                title="Logout"
                className="p-1 text-slate-500 hover:text-rose-500 transition-colors"
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
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-900">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Enter Your Research Topic or Paper Goal
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            ResearchFlow AI multi-agent pipeline (Planner &rarr; Searcher &rarr; Writer) will perform query decomposition, crawl web data, and synthesize an exportable academic report.
          </p>

          <form onSubmit={handleRunResearch} className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Write a technical overview of Multi-Agent RAG architectures and vector database optimization..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pr-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px] resize-y transition-all"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Powered by Groq & Tavily Web Search</span>
              </div>

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm"
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
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Agent Execution Progress
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: Planner */}
              <div className={`p-4 rounded-xl border transition-all ${
                activeStep === "planning" 
                  ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-700 font-medium" 
                  : activeStep === "searching" || activeStep === "writing" || activeStep === "completed"
                  ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">1. Planner Agent</span>
                  {activeStep === "planning" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : activeStep !== "idle" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">Decomposing prompt into search sub-queries</p>
              </div>

              {/* Step 2: Searcher */}
              <div className={`p-4 rounded-xl border transition-all ${
                activeStep === "searching" 
                  ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-700 font-medium" 
                  : activeStep === "writing" || activeStep === "completed"
                  ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">2. Searcher Agent</span>
                  {activeStep === "searching" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : activeStep === "writing" || activeStep === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">Fetching live web sources via Tavily</p>
              </div>

              {/* Step 3: Writer */}
              <div className={`p-4 rounded-xl border transition-all ${
                activeStep === "writing" 
                  ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-700 font-medium" 
                  : activeStep === "completed"
                  ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">3. Writer Agent</span>
                  {activeStep === "writing" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : activeStep === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">Synthesizing Markdown report with citations</p>
              </div>
            </div>
          </section>
        )}

        {/* Research Output Panel */}
        {report && (
          <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900">Generated Research Paper</h3>
              </div>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 transition-all"
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
            <div className="prose max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-indigo-600">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
