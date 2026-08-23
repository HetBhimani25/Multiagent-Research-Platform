"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Sparkles, 
  Search, 
  BrainCircuit, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Globe, 
  BookOpen, 
  Zap, 
  Bot,
  Copy,
  Check
} from "lucide-react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<"idle" | "planning" | "searching" | "writing" | "completed">("idle");
  const [report, setReport] = useState("");
  const [plan, setPlan] = useState("");
  const [queries, setQueries] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setReport("");
    setPlan("");
    setQueries([]);
    setActiveStep("planning");

    try {
      // Direct request to Python FastAPI Engine
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Multi-Agent Research Platform
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">LangGraph Autonomous Agent Pipeline</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              FastAPI Engine Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Research Input Section */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Enter Your Research Topic or Paper Goal
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Our multi-agent pipeline (Planner &rarr; Searcher &rarr; Writer) will perform query decomposition, search real web sources, and synthesize an exportable academic report.
          </p>

          <form onSubmit={handleRunResearch} className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Write a technical overview of Multi-Agent RAG architectures and their performance advantages..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 pr-12 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-h-[100px] resize-y transition-all"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Powered by Groq (Llama 3.3 70B) & Tavily Web Search</span>
              </div>

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
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
          <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Agent Execution Progress
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {/* Step 1: Planner */}
              <div className={`p-4 rounded-xl border transition-all ${
                activeStep === "planning" 
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300" 
                  : activeStep === "searching" || activeStep === "writing" || activeStep === "completed"
                  ? "bg-slate-900/80 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-950/40 border-slate-800/60 text-slate-500"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">1. Planner Agent</span>
                  {activeStep === "planning" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : activeStep !== "idle" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : null}
                </div>
                <p className="text-xs text-slate-400">Decomposing prompt into search sub-queries</p>
              </div>

              {/* Step 2: Searcher */}
              <div className={`p-4 rounded-xl border transition-all ${
                activeStep === "searching" 
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300" 
                  : activeStep === "writing" || activeStep === "completed"
                  ? "bg-slate-900/80 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-950/40 border-slate-800/60 text-slate-500"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">2. Searcher Agent</span>
                  {activeStep === "searching" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : activeStep === "writing" || activeStep === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : null}
                </div>
                <p className="text-xs text-slate-400">Fetching live web sources via Tavily</p>
              </div>

              {/* Step 3: Writer */}
              <div className={`p-4 rounded-xl border transition-all ${
                activeStep === "writing" 
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300" 
                  : activeStep === "completed"
                  ? "bg-slate-900/80 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-950/40 border-slate-800/60 text-slate-500"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">3. Writer Agent</span>
                  {activeStep === "writing" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : activeStep === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : null}
                </div>
                <p className="text-xs text-slate-400">Synthesizing Markdown report with citations</p>
              </div>
            </div>
          </section>
        )}

        {/* Research Output Panel */}
        {report && (
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg text-slate-200">Generated Research Paper</h3>
              </div>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
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
            <div className="prose prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300 prose-a:text-indigo-400 prose-strong:text-slate-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
