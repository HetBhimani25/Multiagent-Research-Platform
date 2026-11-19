"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Database,
  FileText,
  CheckCircle2,
  Upload,
  FileUp,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  Layers,
  BookOpen,
  AlertCircle,
  HelpCircle,
  X,
  History,
  Download,
  MessageSquare,
  Clock,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { SavedPaper } from "./SavedPapersModal";

interface RetrievedSource {
  chunk_id: string;
  doc_id: string;
  doc_title: string;
  text: string;
  chunk_index: number;
  source_type: string;
  score: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: RetrievedSource[];
  confidence?: number;
  totalChunks?: number;
  timestamp: string;
  docId?: string;
  docTitle?: string;
}

interface RAGThread {
  docId: string;
  docTitle: string;
  updatedAt: number;
  messages: ChatMessage[];
}

type RAGThreadMap = Record<string, RAGThread>;

interface PastQueryItem {
  id: string;
  docId: string;
  docTitle: string;
  question: string;
  timestamp: string;
  updatedAt: number;
}

interface RAGStats {
  total_documents: number;
  total_chunks: number;
  documents: Array<{
    id: string;
    title: string;
    source_type: string;
    chunk_count: number;
    char_count: number;
  }>;
}

// Clean conversational prompt into publication-grade topic phrase
const cleanTopicTitle = (raw: string): string => {
  if (!raw) return "Research Document";
  let clean = raw.trim();
  clean = clean.replace(/^#+\s*/, "");
  
  const prefixRegex = /^(Technical Overview & Implementation|Technical Specification & Implementation Approach|System Architecture Blueprint & Topology|System Architecture Blueprint|Comparative Architectural Evaluation & Benchmark Matrix|Comparative Technical Analysis|Strategic Technical Whitepaper|Strategic Executive Whitepaper|Literature Review & State-of-the-Art Survey|Literature Review & Taxonomic Survey|Empirical Investigation & Architectural Analysis|Empirical Research & Architectural Analysis|Research Paper):\s*/i;
  let prev = "";
  while (prev !== clean) {
    prev = clean;
    clean = clean.replace(prefixRegex, "").trim();
  }

  const conversational = [
    /^i\s+want\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s*(on|for|about)?\s*/i,
    /^i\s+need\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s*(on|for|about)?\s*/i,
    /^(can|could)\s+you\s+(please\s+)?(write|give|provide|create|generate|prepare)\s+(me\s+)?(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s*(on|for|about)?\s*/i,
    /^please\s+(write|give|provide|create|generate|prepare)\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s*(on|for|about)?\s*/i,
    /^give\s+me\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s*(on|for|about)?\s*/i,
    /^provide\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s*(on|for|about)?\s*/i,
    /^generate\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s*(on|for|about)?\s*/i,
    /^write\s+(an?\s+)?(technical\s+approach|system\s+design|comparative\s+analysis|executive\s+summary|literature\s+review|research\s+paper|paper|report|guide|study)?\s*(on|for|about)?\s*/i,
    /^research\s+(on|about)?\s*/i,
    /^explain\s+(to\s+me\s+)?/i,
    /^tell\s+me\s+about\s+/i
  ];
  for (const pat of conversational) {
    clean = clean.replace(pat, "").trim();
  }
  clean = clean.replace(/^['"]+|['"]+$/g, "").trim();
  return clean || "Research Document";
};

const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(" ");
};

const extractKeySectionTitles = (markdown?: string): string[] => {
  if (!markdown) return [];
  const clean = markdown.replace(/```[\s\S]*?```/g, "");
  const headings = Array.from(clean.matchAll(/^##\s+([^\r\n]+)/gm), (m) => m[1].trim())
    .map((s) => s.replace(/\s*#+\s*$/, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/`([^`]+)`/g, "$1").trim())
    .filter((s) => {
      const lower = s.toLowerCase();
      return (
        s.length > 3 &&
        !lower.startsWith("reference") &&
        !lower.startsWith("citation") &&
        !lower.startsWith("system architecture diagram") &&
        !lower.startsWith("appendix")
      );
    });
  return headings;
};

interface DocumentRAGViewProps {
  savedPapers: SavedPaper[];
  initialPaper?: SavedPaper | null;
  currentUserId?: string;
  authToken?: string | null;
}

const SAMPLE_PAPER = {
  id: "sample_autonomous_agents_2026",
  topic: "Autonomous Multi-Agent Architecture for Real-Time Traffic Optimization",
  report: `# Autonomous Multi-Agent Architecture for Real-Time Traffic Optimization

## Executive Summary
Urban transit networks suffer from significant throughput bottlenecks under static signal control regimes. This paper proposes an autonomous multi-agent state graph architecture leveraging cooperative LangGraph pipelines, localized edge inference, and asynchronous vector indexing.

## Core Architectural Components
1. **Perception & Telemetry Ingestion Node**: Collects continuous radar, camera, and loop-detector telemetry at 50Hz.
2. **State Graph Orchestration**: Evaluates dynamic phase durations using decentralized reinforcement learning.
3. **Fail-Safe Fallback Interlock**: Guarantees deterministic signal timing constraints even during cloud network disconnections.

## Empirical Evaluation & Results
In simulated multi-intersection metropolitan corridors (SUMO simulation suite):
- Average vehicular wait times decreased by **34.2%** during peak congestion.
- Carbon emissions and idling fuel consumption decreased by **19.8%**.
- State convergence was achieved within **120 iterations** under high stochastic traffic variability.

## Limitations & Future Directions
Current models assume fully compliant autonomous and connected vehicles. Future iterations will incorporate mixed-autonomy driving behaviors and dynamic emergency vehicle preemption routing.`
};

export default function DocumentRAGView({ 
  savedPapers, 
  initialPaper,
  currentUserId,
  authToken 
}: DocumentRAGViewProps) {
  // Storage keys scoped per logged-in user
  const userKey = currentUserId || "guest";
  const threadsStorageKey = `researchflow_rag_threads_${userKey}`;
  const lastDocStorageKey = `researchflow_rag_last_doc_${userKey}`;
  const uploadsStorageKey = `researchflow_rag_uploads_${userKey}`;

  const [stats, setStats] = useState<RAGStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // User-uploaded documents persisted per-user in localStorage
  const [userUploadedDocs, setUserUploadedDocs] = useState<Array<{
    id: string;
    title: string;
    chunk_count: number;
  }>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(uploadsStorageKey);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const saveUserUploadedDocs = (docs: Array<{ id: string; title: string; chunk_count: number }>) => {
    setUserUploadedDocs(docs);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(uploadsStorageKey, JSON.stringify(docs));
      } catch (e) {
        console.warn("Could not save uploads to localStorage:", e);
      }
    }
  };

  // Strictly user-scoped documents: papers generated by this logged-in user (savedPapers)
  // plus external files uploaded by this user in this session.
  const userDocuments = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      source_type: "saved_paper" | "uploaded_file" | "sample_paper";
      chunk_count?: number;
    }> = [];

    // 1. Add all papers generated by this logged-in user
    savedPapers.forEach((p) => {
      const statDoc = stats?.documents?.find((d) => d.id === p.id);
      const estChunks = Math.max(1, Math.ceil((p.report?.length || 700) / 700));
      list.push({
        id: p.id,
        title: p.topic || "Untitled Research Document",
        source_type: "saved_paper",
        chunk_count: statDoc ? statDoc.chunk_count : estChunks
      });
    });

    // 2. Add files uploaded by this user
    userUploadedDocs.forEach((u) => {
      const statDoc = stats?.documents?.find((d) => d.id === u.id);
      list.push({
        id: u.id,
        title: u.title,
        source_type: "uploaded_file",
        chunk_count: statDoc ? statDoc.chunk_count : u.chunk_count
      });
    });

    return list;
  }, [savedPapers, userUploadedDocs, stats]);

  // Calculate user-specific total documents and chunks
  const userTotalDocs = userDocuments.length;
  const userTotalChunks = userDocuments.reduce((sum, d) => sum + (d.chunk_count || 0), 0);

  // Build combined document options strictly containing this user's documents
  const allDocOptions = useMemo(() => [
    {
      id: "all",
      title: `🌐 Entire Knowledge Base (${userTotalDocs} doc${userTotalDocs === 1 ? "" : "s"}, ${userTotalChunks} chunk${userTotalChunks === 1 ? "" : "s"})`
    },
    ...userDocuments.map((d) => ({
      id: d.id,
      title: `${d.source_type === "uploaded_file" ? "📁" : "📄"} ${d.title.length > 45 ? d.title.substring(0, 45) + "..." : d.title} (${d.chunk_count || 0} chunks)`
    }))
  ], [userTotalDocs, userTotalChunks, userDocuments]);

  // Active Context Store Selection (persisted per user)
  const [selectedDocId, setSelectedDocId] = useState<string>(() => {
    if (initialPaper) return initialPaper.id;
    if (typeof window !== "undefined") {
      try {
        const last = localStorage.getItem(lastDocStorageKey);
        if (last) return last;
      } catch (e) {}
    }
    return "all";
  });

  // Remember selectedDocId
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(lastDocStorageKey, selectedDocId);
      } catch (e) {}
    }
  }, [selectedDocId, lastDocStorageKey]);

  // Auto-sync selectedDocId to stay within user's documents
  useEffect(() => {
    if (selectedDocId !== "all" && !userDocuments.some((d) => d.id === selectedDocId)) {
      setSelectedDocId(initialPaper?.id || userDocuments[0]?.id || "all");
    }
  }, [userDocuments, selectedDocId, initialPaper]);

  const selectedDocTitle = allDocOptions.find(o => o.id === selectedDocId)?.title || "Entire Knowledge Base";

  // Persistent conversation threads store
  const [threads, setThreads] = useState<RAGThreadMap>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(threadsStorageKey);
        return stored ? JSON.parse(stored) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Reload history when logged-in user changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedThreads = localStorage.getItem(threadsStorageKey);
        setThreads(storedThreads ? JSON.parse(storedThreads) : {});
        const storedUploads = localStorage.getItem(uploadsStorageKey);
        setUserUploadedDocs(storedUploads ? JSON.parse(storedUploads) : []);
      } catch (e) {
        setThreads({});
      }
    }
  }, [currentUserId, threadsStorageKey, uploadsStorageKey]);

  // Welcome message generator tailored for the active context store
  const getWelcomeMessage = (docId: string, title?: string): ChatMessage => {
    if (docId === "all") {
      return {
        id: "welcome_all",
        sender: "ai",
        text: "👋 Welcome to your **Personal Document RAG Assistant**!\n\nI perform **dense vector similarity and BM25 hybrid retrieval** across your entire research library. You can query across all your saved research papers, upload new PDF/TXT documents, or select a specific paper as your context store.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        docId: "all",
        docTitle: "Entire Knowledge Base"
      };
    }

    const cleanTitle = (title || "Selected Paper")
      .replace(/^[📁📄\s]+/, "")
      .replace(/\s*\(\d+\s*chunks\)$/i, "")
      .trim();

    return {
      id: `welcome_${docId}`,
      sender: "ai",
      text: `👋 Active Context Store: **"${cleanTitle}"**\n\nI am grounded strictly in this document. Ask any question about its technical architecture, methodologies, benchmark results, mathematical formulations, or trade-offs. You can also pick from the dynamic suggested questions below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      docId: docId,
      docTitle: cleanTitle
    };
  };

  // Helper to update and persist threads in state and localStorage
  const updateThread = (docId: string, title: string, updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => {
    setThreads(prev => {
      const existing = prev[docId];
      const prevList = existing?.messages && existing.messages.length > 0
        ? existing.messages
        : [getWelcomeMessage(docId, title)];
      const nextList = updater(prevList);
      const updated: RAGThreadMap = {
        ...prev,
        [docId]: {
          docId,
          docTitle: title,
          updatedAt: Date.now(),
          messages: nextList
        }
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(threadsStorageKey, JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not save RAG threads to localStorage:", e);
        }
      }
      return updated;
    });
  };

  const updateCurrentThread = (updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => {
    updateThread(selectedDocId, selectedDocTitle, updater);
  };

  // Chat messages currently active for the selected context store
  const chatMessages = useMemo(() => {
    const current = threads[selectedDocId];
    if (current && current.messages && current.messages.length > 0) {
      return current.messages;
    }
    return [getWelcomeMessage(selectedDocId, selectedDocTitle)];
  }, [threads, selectedDocId, selectedDocTitle]);

  // Questions count in the active context store
  const currentQuestionsCount = useMemo(() => {
    return chatMessages.filter(m => m.sender === "user").length;
  }, [chatMessages]);

  // All past questions asked across all threads (for the History panel)
  const allPastQueries = useMemo(() => {
    const items: PastQueryItem[] = [];
    Object.values(threads).forEach((thread) => {
      (thread.messages || []).forEach((msg) => {
        if (msg.sender === "user") {
          items.push({
            id: msg.id,
            docId: thread.docId,
            docTitle: thread.docTitle,
            question: msg.text,
            timestamp: msg.timestamp,
            updatedAt: thread.updatedAt
          });
        }
      });
    });
    return items.reverse();
  }, [threads]);

  const activeDocPastQueries = useMemo(() => {
    return allPastQueries.filter(q => q.docId === selectedDocId);
  }, [allPastQueries, selectedDocId]);

  // History slide-over drawer states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilterTab, setHistoryFilterTab] = useState<"current" | "all">("current");

  const displayHistoryQueries = useMemo(() => {
    const base = historyFilterTab === "current" ? activeDocPastQueries : allPastQueries;
    if (!historySearch.trim()) return base;
    const s = historySearch.toLowerCase();
    return base.filter(q => q.question.toLowerCase().includes(s) || q.docTitle.toLowerCase().includes(s));
  }, [historyFilterTab, activeDocPastQueries, allPastQueries, historySearch]);

  // Clear chat confirmation state
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmClearTimer = useRef<NodeJS.Timeout | null>(null);

  const handleClearCurrentChat = () => {
    if (currentQuestionsCount > 0 && !confirmClear) {
      setConfirmClear(true);
      if (confirmClearTimer.current) clearTimeout(confirmClearTimer.current);
      confirmClearTimer.current = setTimeout(() => {
        setConfirmClear(false);
      }, 4000);
      return;
    }

    setConfirmClear(false);
    if (confirmClearTimer.current) clearTimeout(confirmClearTimer.current);
    updateCurrentThread(() => [getWelcomeMessage(selectedDocId, selectedDocTitle)]);
  };

  const handleClearAllHistory = () => {
    setThreads({});
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(threadsStorageKey);
      } catch (e) {}
    }
    setIsHistoryOpen(false);
  };

  // Export current Q&A thread as a simple and clean plain text file (.txt)
  const handleExportText = () => {
    if (chatMessages.length <= 1) return;
    
    const cleanTitle = (selectedDocTitle || "Document")
      .replace(/^[📁📄🌐\s]+/, "")
      .replace(/\s*\(\d+\s*chunks?\)$/i, "")
      .replace(/\s*\(\d+\s*docs?,\s*\d+\s*chunks?\)$/i, "")
      .trim();

    let txt = `Document: ${cleanTitle}\n`;
    txt += `Date & Time: ${new Date().toLocaleString()}\n\n`;

    let qCount = 0;
    chatMessages.forEach((msg) => {
      if (msg.id.startsWith("welcome") || msg.id.startsWith("sample_") || msg.id.startsWith("upload_")) return;
      if (msg.sender === "user") {
        qCount++;
        txt += `Question ${qCount}:\n${msg.text}\n\n`;
      } else if (msg.sender === "ai") {
        txt += `Answer:\n${msg.text}\n\n`;
      }
    });

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeFilename = cleanTitle.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 40) || "document";
    a.href = url;
    a.download = `${safeFilename}_QnA.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [chatInput, setChatInput] = useState("");
  const [querying, setQuerying] = useState(false);
  const [expandedSources, setExpandedSources] = useState<{ [msgId: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Container ref for chat auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Keep page scroll position at top on view open
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  // 2. Chat messages auto-scroll: ONLY scroll internal chatContainer
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: isFirstRender.current ? "instant" : "smooth"
      });
      if (isFirstRender.current) {
        isFirstRender.current = false;
      }
    }
  }, [chatMessages, querying, selectedDocId]);

  // Sync saved papers to RAG vector store on mount or when savedPapers changes
  useEffect(() => {
    syncLibraryToRAG();
  }, [savedPapers]);

  const fetchStats = async (docIds?: string[]) => {
    try {
      setLoadingStats(true);
      const ids = docIds || [...savedPapers.map(p => p.id), ...userUploadedDocs.map(u => u.id)];
      const queryParams = new URLSearchParams();
      if (ids.length > 0) queryParams.set("allowed_doc_ids", ids.join(","));
      if (currentUserId) queryParams.set("user_id", currentUserId);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const res = await fetch(`http://localhost:8000/api/rag/stats${qs}`);
      if (res.ok) {
        const json = await res.json();
        setStats(json.data);
      }
    } catch (e) {
      console.warn("Failed to fetch RAG stats:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const syncLibraryToRAG = async () => {
    if (!savedPapers || savedPapers.length === 0) {
      await fetchStats();
      return;
    }
    try {
      setLoadingStats(true);
      const userDocIds = [...savedPapers.map(p => p.id), ...userUploadedDocs.map(u => u.id)];
      await fetch("http://localhost:8000/api/rag/sync-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          papers: savedPapers.map(p => ({
            id: p.id,
            topic: p.topic,
            report: p.report,
            depth: p.depth,
            docType: p.docType
          }))
        })
      });
      await fetchStats(userDocIds);
    } catch (err) {
      console.error("Error syncing library with RAG engine:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("http://localhost:8000/api/rag/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_id: SAMPLE_PAPER.id,
          title: SAMPLE_PAPER.topic,
          content: SAMPLE_PAPER.report,
          source_type: "sample_paper",
          metadata: { user_id: currentUserId }
        })
      });
      if (res.ok) {
        const sampleUpload = {
          id: SAMPLE_PAPER.id,
          title: SAMPLE_PAPER.topic,
          chunk_count: 4,
        };
        const updated = [...userUploadedDocs.filter(d => d.id !== SAMPLE_PAPER.id), sampleUpload];
        saveUserUploadedDocs(updated);
        setSelectedDocId(SAMPLE_PAPER.id);
        await fetchStats([...savedPapers.map(p => p.id), ...updated.map(u => u.id)]);

        const sampleMsg: ChatMessage = {
          id: `sample_${Date.now()}`,
          sender: "ai",
          text: `📄 **Sample Paper Loaded:** *"Autonomous Multi-Agent Architecture for Real-Time Traffic Optimization"*\n\nIt has been indexed into semantic vector chunks. Ask a question or click one of the suggested prompts below!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          docId: SAMPLE_PAPER.id,
          docTitle: SAMPLE_PAPER.topic
        };

        updateThread(SAMPLE_PAPER.id, SAMPLE_PAPER.topic, prev => [...prev, sampleMsg]);
      }
    } catch (err) {
      console.error("Error loading sample paper:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (currentUserId) {
      formData.append("user_id", currentUserId);
    }

    try {
      const res = await fetch("http://localhost:8000/api/rag/upload", {
        method: "POST",
        body: formData
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || "Failed to process document upload.");
      }

      const newUpload = {
        id: json.doc_id,
        title: json.title,
        chunk_count: json.chunks_created,
      };
      const updatedUploads = [...userUploadedDocs, newUpload];
      saveUserUploadedDocs(updatedUploads);

      setUploadModalOpen(false);
      setSelectedDocId(json.doc_id);
      await fetchStats([...savedPapers.map(p => p.id), ...updatedUploads.map(u => u.id)]);

      const uploadMsg: ChatMessage = {
        id: `upload_${Date.now()}`,
        sender: "ai",
        text: `✅ **Successfully Uploaded & Indexed:** *"${json.title}"*\n\n- **File**: \`${json.filename}\`\n- **Extracted Content**: ${json.char_count.toLocaleString()} characters\n- **Vector Chunks Generated**: **${json.chunks_created}** chunks\n\nYou can now query this document directly!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        docId: json.doc_id,
        docTitle: json.title
      };

      updateThread(json.doc_id, json.title, prev => [...prev, uploadMsg]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || querying) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      docId: selectedDocId,
      docTitle: selectedDocTitle
    };

    // Immediately persist user question in active context store thread
    updateCurrentThread(prev => [...prev, userMsg]);
    setChatInput("");
    setQuerying(true);

    try {
      // Collect user-allowed document IDs for strictly scoped RAG retrieval
      const userDocIds = userDocuments.map(d => d.id);

      const res = await fetch("http://localhost:8000/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          doc_id: selectedDocId,
          allowed_doc_ids: userDocIds,
          user_id: currentUserId,
          top_k: 5
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || "Error querying RAG assistant.");
      }

      const ragData = json.data;
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: ragData.answer,
        sources: ragData.sources,
        confidence: ragData.confidence,
        totalChunks: ragData.total_chunks_evaluated,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        docId: selectedDocId,
        docTitle: selectedDocTitle
      };

      // Persist AI response in active context store thread
      updateCurrentThread(prev => [...prev, aiMsg]);
    } catch (err: any) {
      updateCurrentThread(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "ai",
          text: `⚠️ **RAG Query Error**: ${err.message || "Could not retrieve response from AI Engine."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          docId: selectedDocId,
          docTitle: selectedDocTitle
        }
      ]);
    } finally {
      setQuerying(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const [promptShuffleIndex, setPromptShuffleIndex] = useState(0);

  // Generate highly professional, domain-aware suggested questions strictly aligned with selected context
  const dynamicSuggestedPrompts = useMemo(() => {
    // 1. Entire Knowledge Base selected
    if (selectedDocId === "all") {
      if (savedPapers.length >= 2) {
        const top1 = cleanTopicTitle(savedPapers[0].topic);
        const top2 = cleanTopicTitle(savedPapers[1].topic);
        const pools = [
          [
            `Synthesize the overarching methodologies and design patterns across my research library`,
            `Compare the architectural trade-offs between "${top1.substring(0, 32)}" and "${top2.substring(0, 32)}"`,
            `What common empirical benchmarks and performance metrics emerge across all indexed documents?`,
            `Identify complementary insights and unresolved technical gaps across my papers`,
            `What actionable implementation guidelines and best practices apply across all my documents?`
          ],
          [
            `What are the most critical differences in assumptions between "${top1.substring(0, 30)}" and "${top2.substring(0, 30)}"?`,
            `How do the performance criteria and validation metrics compare across my indexed documents?`,
            `Synthesize the operational constraints and production requirements across my research papers`,
            `Extract the executive takeaways and strategic recommendations across all my documents`
          ]
        ];
        return pools[promptShuffleIndex % pools.length];
      } else if (savedPapers.length === 1) {
        const paper = savedPapers[0];
        const cleanT = cleanTopicTitle(paper.topic);
        const sections = extractKeySectionTitles(paper.report);
        const sec1 = sections[0] ? toTitleCase(sections[0].substring(0, 48)) : null;
        const sec2 = sections[1] ? toTitleCase(sections[1].substring(0, 48)) : null;

        const poolA = [
          `Summarize the foundational insights and core architectural contributions of ${cleanT}`,
          `Explain the primary methodology, experimental controls, and technical specifications`
        ];
        if (sec1) poolA.push(`Detail the key concepts analyzed in "${sec1}"`);
        if (sec2) poolA.push(`How does the document address "${sec2}"?`);
        else poolA.push(`What critical benchmarks, validation metrics, and trade-offs are reported?`);
        poolA.push(`What limitations, scope boundaries, and future directions are documented?`);

        const poolB = [
          `What are the key trade-offs and decision criteria established in ${cleanT}?`,
          sec1 ? `What specific conclusions and data points are presented in "${sec1}"?` : `Detail the technical architecture and pipeline stages`,
          sec2 ? `Explain the implementation details of "${sec2}"` : `What performance evaluation metrics are analyzed?`,
          `Synthesize the actionable recommendations and operational best practices`
        ];

        return promptShuffleIndex % 2 === 0 ? poolA : poolB;
      } else {
        return [
          "How does hybrid vector retrieval (Dense + BM25) operate across research documents?",
          "What document formats (PDF, Markdown, TXT) can be indexed into the knowledge base?",
          "How can multi-agent research papers be synthesized and queried with semantic grounding?",
          "Explain the cosine similarity and context-chunking pipeline utilized by this assistant"
        ];
      }
    }

    // 2. Sample Paper
    if (selectedDocId === SAMPLE_PAPER.id) {
      const samplePools = [
        [
          "How does the autonomous multi-agent state graph optimize real-time traffic signal timing?",
          "What empirical throughput gains, wait-time reductions, and emission savings are reported?",
          "Explain the perception telemetry node, edge inference, and decentralized reinforcement learning model",
          "What fail-safe fallback interlocks protect deterministic operation during network dropouts?",
          "What mixed-autonomy behaviors and vehicle preemption directions are proposed for future work?"
        ],
        [
          "Detail the SUMO simulation benchmark setup and convergence results",
          "What are the communication protocols and telemetry ingestion rates (50Hz) specified?",
          "How does decentralized reinforcement learning resolve multi-intersection coordination?",
          "What specific urban transit bottlenecks does static signal control fail to address?"
        ]
      ];
      return samplePools[promptShuffleIndex % samplePools.length];
    }

    // 3. User Saved Paper
    const paper = savedPapers.find((p) => p.id === selectedDocId);
    if (paper) {
      const cleanT = cleanTopicTitle(paper.topic);
      const sections = extractKeySectionTitles(paper.report);
      const dt = paper.docType || "research_paper";

      const prompts: string[] = [];

      // Section-derived specific questions
      if (sections.length > 0) {
        prompts.push(`Explain the key principles of "${toTitleCase(sections[0].substring(0, 52))}"`);
      }
      if (sections.length > 1) {
        prompts.push(`How does the analysis address "${toTitleCase(sections[1].substring(0, 52))}"?`);
      }
      if (sections.length > 2) {
        prompts.push(`Detail the findings presented in "${toTitleCase(sections[2].substring(0, 52))}"`);
      }

      // Objective & DocType analytical questions
      if (dt === "comparative_analysis") {
        prompts.push(`What are the primary architectural trade-offs and decision criteria for ${cleanT}?`);
        prompts.push(`How do the benchmarked approaches differ in performance metrics, accuracy, and complexity?`);
      } else if (dt === "system_design") {
        prompts.push(`Detail the high-availability cluster topology and query routing architecture for ${cleanT}`);
        prompts.push(`What throughput bottlenecks, replication strategies, and consistency models are identified?`);
      } else if (dt === "technical_approach") {
        prompts.push(`What are the phased implementation stages, validation guardrails, and milestones for ${cleanT}?`);
        prompts.push(`What out-of-scope non-goals and system boundaries are defined in this approach?`);
      } else if (dt === "executive_summary") {
        prompts.push(`What strategic ROI, market drivers, and capital requirements are highlighted for ${cleanT}?`);
        prompts.push(`Summarize the executive roadmap, operational risks, and implementation milestones`);
      } else if (dt === "literature_review") {
        prompts.push(`What is the prevailing state-of-the-art taxonomy and historical evolution of ${cleanT}?`);
        prompts.push(`What critical research gaps and open theoretical challenges are identified in the literature?`);
      } else {
        prompts.push(`What empirical benchmarks, baseline comparisons, and quantitative results are reported for ${cleanT}?`);
        prompts.push(`What architectural limitations, constraints, and future exploration paths are presented?`);
      }

      if (promptShuffleIndex > 0) {
        const rotated = [...prompts];
        for (let i = 0; i < promptShuffleIndex % rotated.length; i++) {
          rotated.push(rotated.shift()!);
        }
        return rotated.slice(0, 5);
      }

      return prompts.slice(0, 5);
    }

    // 4. User Uploaded Document
    const uploaded = userUploadedDocs.find((u) => u.id === selectedDocId);
    if (uploaded) {
      const cleanTitle = uploaded.title.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " ").trim();
      const uploadPools = [
        [
          `Summarize the primary methodologies and architectural specifications in "${cleanTitle}"`,
          `What key technical principles, equations, or algorithms are defined in this document?`,
          `What empirical benchmarks, evaluation metrics, or quantitative results are reported?`,
          `What operational constraints, failure modes, or implementation guidelines are highlighted?`,
          `Extract the most critical conclusions and recommended next steps from this document`
        ],
        [
          `What problem statement and core objectives are defined in "${cleanTitle}"?`,
          `Explain the data flow, input requirements, and output artifacts outlined`,
          `How does this document compare to standard baseline approaches in its field?`,
          `What technical limitations or prerequisites are specified?`
        ]
      ];
      return uploadPools[promptShuffleIndex % uploadPools.length];
    }

    // Default fallback
    return [
      "What are the primary findings, methodologies, and contributions of this document?",
      "Explain the technical architecture and core implementation details",
      "What empirical benchmarks, evaluation metrics, and comparative trade-offs are reported?",
      "What operational limitations, constraints, and future directions are documented?"
    ];
  }, [selectedDocId, savedPapers, userUploadedDocs, promptShuffleIndex]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* ── Header & RAG Controller ── */}
      <div className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F9E6A8] text-[#CC6F00] border border-[#CC6F00]/30 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#F2A900]" />
              Hybrid Vector RAG (Dense + BM25)
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {`${userTotalChunks} Chunks Indexed`}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#4D2A00]">
            Personal Document RAG Assistant
          </h2>
          <p className="text-xs font-semibold text-[#4D2A00]/70 mt-0.5">
            Query across your synthesized research papers and uploaded external documents with semantic grounding.
          </p>
        </div>

        {/* Action Controls & Scope Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Document Scope Selector */}
          <div className="min-w-[240px]">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#CC6F00] block mb-1">
              Active Context Store:
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full bg-[#F9E6A8]/30 border-2 border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-extrabold text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900] truncate"
            >
              {allDocOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.title}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Button & Sync */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white text-xs font-extrabold border-2 border-[#CC6F00]/40 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap mt-auto"
              title="Upload PDF, TXT or Markdown file"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload Doc</span>
            </button>

            <button
              onClick={syncLibraryToRAG}
              disabled={loadingStats}
              className="p-2 rounded-xl bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] text-[#CC6F00] border-2 border-[#CC6F00]/30 transition-all flex items-center justify-center shadow-sm mt-auto disabled:opacity-50"
              title="Sync Library Documents"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`} />
            </button>
          </div>

        </div>
      </div>

      {/* ── Active Context & Quick Actions Banner ── */}
      <div className="p-4 bg-[#F9E6A8]/35 border-2 border-[#CC6F00]/25 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs font-extrabold text-[#4D2A00] min-w-0">
          <div className="p-2 bg-[#F2A900]/40 rounded-xl shrink-0">
            <FileText className="w-4 h-4 text-[#CC6F00]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#CC6F00] uppercase text-[10px] tracking-wider font-black">
                Query Scope
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F9E6A8] text-[#CC6F00] border border-[#CC6F00]/30">
                {selectedDocId === "all" ? "🌐 Entire Library" : (userUploadedDocs.some(u => u.id === selectedDocId) ? "📁 Uploaded File" : "📄 Saved Paper")}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-[#4D2A00]/80 border border-[#CC6F00]/20 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-[#F2A900]" />
                {currentQuestionsCount > 0 ? `${currentQuestionsCount} Question${currentQuestionsCount === 1 ? "" : "s"} Asked` : "Fresh Thread"}
              </span>
            </div>
            <span className="font-extrabold text-xs block truncate text-[#4D2A00] mt-0.5">
              {selectedDocTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto shrink-0">
          {userTotalDocs === 0 && (
            <button
              onClick={handleLoadSample}
              disabled={loadingStats}
              className="px-3 py-1.5 rounded-xl bg-[#CC6F00] text-white hover:bg-[#B35F00] text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Load Sample Research Paper</span>
            </button>
          )}

          {/* Past Q&A History Button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F9E6A8]/50 text-[#4D2A00] text-xs font-extrabold border border-[#CC6F00]/30 transition-all flex items-center gap-1.5 shadow-xs hover:scale-102 active:scale-98"
            title="View conversation history & past asked questions"
          >
            <History className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>History</span>
            {allPastQueries.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#F2A900] text-[#4D2A00]">
                {allPastQueries.length}
              </span>
            )}
          </button>

          {/* Export Thread Q&A Button */}
          {currentQuestionsCount > 0 && (
            <button
              onClick={handleExportText}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 text-xs font-extrabold border border-emerald-300 transition-all flex items-center gap-1.5 shadow-xs hover:scale-102 active:scale-98"
              title="Export this Q&A thread as Text file (.txt)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Q&A</span>
            </button>
          )}

          {/* Clear Chat Button with 2-step confirmation */}
          <button
            onClick={handleClearCurrentChat}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 shadow-xs ${
              confirmClear
                ? "bg-red-600 hover:bg-red-700 text-white border-red-700 animate-pulse"
                : "bg-white hover:bg-red-50 text-[#4D2A00]/70 hover:text-red-700 border-[#CC6F00]/25"
            }`}
            title={confirmClear ? "Click again to confirm clearing this conversation" : "Clear this document's conversation"}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmClear ? "Confirm Clear?" : "Clear Chat"}</span>
          </button>
        </div>
      </div>

      {/* ── Main Chat Thread & Interaction Console ── */}
      <div className="bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 shadow-[0_15px_45px_rgba(204,111,0,0.2)] flex flex-col gap-4 min-h-[520px]">
        
        {/* Messages Feed */}
        <div ref={chatContainerRef} className="flex-1 bg-[#F9E6A8]/15 border border-[#CC6F00]/20 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-h-[380px] max-h-[520px] overflow-y-auto">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-[90%] sm:max-w-[85%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                  msg.sender === "user"
                    ? "bg-[#F2A900] text-[#4D2A00]"
                    : "bg-[#CC6F00] text-white"
                }`}
              >
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-1.5 max-w-full">
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                    msg.sender === "user"
                      ? "bg-[#F2A900] text-[#4D2A00] rounded-tr-none"
                      : "bg-white border border-[#CC6F00]/30 text-[#4D2A00] rounded-tl-none"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="prose prose-xs max-w-none text-[#4D2A00] leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* AI Grounding Evidence Accordion */}
                {msg.sender === "ai" && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 flex flex-col gap-1.5">
                    <button
                      onClick={() => toggleSources(msg.id)}
                      className="self-start px-2.5 py-1 rounded-lg bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] border border-[#CC6F00]/30 text-[10px] font-black text-[#CC6F00] flex items-center gap-1.5 transition-all"
                    >
                      <Layers className="w-3 h-3 text-[#F2A900]" />
                      <span>{msg.sources.length} Retrieved Evidence Chunks</span>
                      {msg.confidence !== undefined && (
                        <span className="text-emerald-700 font-extrabold ml-1">
                          • {msg.confidence}% Match
                        </span>
                      )}
                      {expandedSources[msg.id] ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {/* Collapsible Chunks Details */}
                    {expandedSources[msg.id] && (
                      <div className="p-3 bg-amber-50/70 border border-[#CC6F00]/20 rounded-xl flex flex-col gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#CC6F00]">
                          Retrieved Context Passages:
                        </span>
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={src.chunk_id || sIdx}
                            className="p-2.5 bg-white border border-[#CC6F00]/20 rounded-lg flex flex-col gap-1 text-[11px]"
                          >
                            <div className="flex items-center justify-between text-[10px] font-black text-[#4D2A00]/80">
                              <span className="text-[#CC6F00] font-extrabold">
                                📌 [Source {sIdx + 1}]: {src.doc_title} (Chunk #{src.chunk_index})
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black">
                                {Math.round(src.score * 100)}% Match
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-[#4D2A00]/90 italic bg-[#F9E6A8]/10 p-1.5 rounded leading-normal border-l-2 border-[#F2A900]">
                              "{src.text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer bar with Timestamp & Copy */}
                <div className="flex items-center gap-2 text-[10px] text-[#4D2A00]/60 px-1">
                  <span>{msg.timestamp}</span>
                  {msg.sender === "ai" && (
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="hover:text-[#CC6F00] transition-colors flex items-center gap-0.5 ml-2"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {querying && (
            <div className="flex items-center gap-3 p-3 bg-white border border-[#CC6F00]/30 rounded-2xl self-start max-w-md shadow-xs animate-pulse">
              <div className="w-7 h-7 rounded-xl bg-[#CC6F00] text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin text-[#F2A900]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[#4D2A00]">
                  Retrieving Chunks & Synthesizing Grounded Answer...
                </span>
                <span className="text-[10px] font-bold text-[#CC6F00]">
                  Executing Cosine Dense + BM25 Vector Search on Qwen 3.8
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Suggested Prompts Chips ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#CC6F00] whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#F2A900]" />
              Suggested:
            </span>
            <button
              type="button"
              onClick={() => setPromptShuffleIndex(prev => prev + 1)}
              title="Shuffle suggested questions"
              className="p-1 rounded-lg hover:bg-[#F9E6A8] text-[#CC6F00]/70 hover:text-[#CC6F00] transition-all"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
          </div>
          {dynamicSuggestedPrompts.map((prompt, pIdx) => (
            <button
              key={`${selectedDocId}_${promptShuffleIndex}_${pIdx}`}
              type="button"
              onClick={() => handleQuery(prompt)}
              disabled={querying}
              className="px-3 py-1 rounded-full bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] border border-[#CC6F00]/30 text-[11px] font-bold text-[#4D2A00] whitespace-nowrap transition-all shadow-2xs hover:scale-[1.02] disabled:opacity-50 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* ── Input Box Form ── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(chatInput);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`Ask a question across ${selectedDocId === "all" ? "all documents" : "the selected paper"}...`}
            disabled={querying}
            className="flex-1 bg-[#F9E6A8]/20 border-2 border-[#CC6F00]/30 rounded-2xl px-4 py-3 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900] placeholder:text-[#4D2A00]/50"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || querying}
            className="px-6 py-3 rounded-2xl bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white text-xs font-black border-2 border-[#CC6F00]/40 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Query RAG</span>
          </button>
        </form>

      </div>

      {/* ── RAG Conversation History Slide-Over Drawer ── */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div 
            className="bg-white border-l-4 border-[#CC6F00] w-full max-w-md h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-250"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#CC6F00]/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#F9E6A8] rounded-xl text-[#CC6F00]">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#4D2A00]">
                    RAG Conversation History
                  </h3>
                  <p className="text-[11px] font-semibold text-[#4D2A00]/70">
                    {allPastQueries.length} question{allPastQueries.length === 1 ? "" : "s"} across {Object.keys(threads).length} context store{Object.keys(threads).length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-[#4D2A00]"
                title="Close History"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mt-4 p-1 bg-[#F9E6A8]/25 rounded-xl border border-[#CC6F00]/20">
              <button
                onClick={() => setHistoryFilterTab("current")}
                className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  historyFilterTab === "current"
                    ? "bg-[#F2A900] text-[#4D2A00] shadow-xs"
                    : "text-[#4D2A00]/70 hover:text-[#4D2A00]"
                }`}
              >
                Current Doc ({activeDocPastQueries.length})
              </button>
              <button
                onClick={() => setHistoryFilterTab("all")}
                className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  historyFilterTab === "all"
                    ? "bg-[#F2A900] text-[#4D2A00] shadow-xs"
                    : "text-[#4D2A00]/70 hover:text-[#4D2A00]"
                }`}
              >
                All Stores ({allPastQueries.length})
              </button>
            </div>

            {/* Search Filter */}
            <div className="mt-3 relative">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search past questions..."
                className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl px-3 py-2 text-xs font-medium text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900] placeholder:text-[#4D2A00]/40"
              />
              {historySearch && (
                <button 
                  onClick={() => setHistorySearch("")}
                  className="absolute right-2.5 top-2.5 text-[#4D2A00]/50 hover:text-[#4D2A00]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Query List */}
            <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-2.5">
              {displayHistoryQueries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-[#4D2A00]/60">
                  <MessageSquare className="w-8 h-8 text-[#CC6F00]/40 mb-2" />
                  <p className="text-xs font-bold">
                    {historySearch ? "No matching queries found." : "No questions asked yet."}
                  </p>
                  <p className="text-[10px] text-[#4D2A00]/50 mt-1 max-w-[200px]">
                    {historySearch ? "Try a different search term" : "Ask a question in Document RAG Assistant to start building your query history."}
                  </p>
                </div>
              ) : (
                displayHistoryQueries.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F9E6A8]/15 hover:bg-[#F9E6A8]/30 border border-[#CC6F00]/25 rounded-2xl flex flex-col gap-2 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#4D2A00] leading-snug line-clamp-2">
                        "{item.question}"
                      </span>
                      <span className="text-[10px] text-[#4D2A00]/50 whitespace-nowrap shrink-0 mt-0.5">
                        {item.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-bold text-[#CC6F00] truncate max-w-[200px] bg-white px-2 py-0.5 rounded-md border border-[#CC6F00]/20">
                        {item.docId === "all" ? "🌐 Entire Library" : `📄 ${item.docTitle}`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (selectedDocId !== item.docId) {
                              setSelectedDocId(item.docId);
                            }
                            setIsHistoryOpen(false);
                          }}
                          className="px-2 py-1 rounded-lg bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white font-extrabold text-[10px] transition-all flex items-center gap-1"
                          title="Open this conversation in chat"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setChatInput(item.question);
                            setIsHistoryOpen(false);
                          }}
                          className="p-1 rounded-lg bg-white hover:bg-neutral-100 text-[#4D2A00] border border-[#CC6F00]/20"
                          title="Re-use question in input box"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-[#CC6F00]/20 flex items-center justify-between gap-2">
              {allPastQueries.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear all RAG conversation history across all documents?")) {
                      handleClearAllHistory();
                    }
                  }}
                  className="text-[11px] font-bold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All History</span>
                </button>
              )}
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="ml-auto px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#4D2A00] text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Upload Modal ── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-3 border-[#CC6F00] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#CC6F00]/20 pb-3">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-[#CC6F00]" />
                <h3 className="text-lg font-black text-[#4D2A00]">
                  Upload to Vector Knowledge Base
                </h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-[#4D2A00]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-[#4D2A00]/80">
              Upload research documents (PDF, TXT, Markdown). Files will be parsed, split into semantic overlapping chunks, and indexed into vector embeddings for instant semantic search.
            </p>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Drag & Drop / File Input Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#CC6F00]/40 hover:border-[#CC6F00] bg-[#F9E6A8]/20 hover:bg-[#F9E6A8]/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F2A900] text-[#4D2A00] flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="text-xs font-black text-[#4D2A00] block">
                  Click to select or drag & drop file
                </span>
                <span className="text-[10px] font-bold text-[#CC6F00] block mt-0.5">
                  Supported: .PDF, .TXT, .MD
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.markdown"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {uploading && (
              <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-xl text-xs font-bold text-[#CC6F00]">
                <Sparkles className="w-4 h-4 animate-spin text-[#F2A900]" />
                <span>Parsing file & generating vector chunks...</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                disabled={uploading}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-[#4D2A00] hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
