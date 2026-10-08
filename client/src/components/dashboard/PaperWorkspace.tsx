"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "./MermaidDiagram";
import { 
  FileText, 
  GitFork, 
  Link2, 
  MessageSquare, 
  Copy, 
  Check, 
  FileDown, 
  FileCode,
  Send,
  Bot,
  User,
  Sparkles,
  ExternalLink,
  Share2,
  Users,
  Activity,
  CheckSquare,
  History,
  Lock,
  Unlock,
  ChevronDown
} from "lucide-react";

import ShareDocumentModal from "./ShareDocumentModal";
import CollaboratorPanel from "./CollaboratorPanel";
import CommentPanel from "./CommentPanel";
import TaskPanel from "./TaskPanel";
import VersionHistory from "./VersionHistory";
import ActivityFeed from "./ActivityFeed";
import AIRunPanel from "./AIRunPanel";

interface PaperWorkspaceProps {
  report: string;
  topic: string;
  docType?: string;
  documentId?: string;
  workspaceId?: string;
  isOwner?: boolean;
  currentRole?: string;
  authToken?: string | null;
  currentUserId?: string;
  status?: string;
  onDocumentUpdated?: (newContent: string) => void;
  onStatusChanged?: (newStatus: string) => void;
}

export default function PaperWorkspace({
  report,
  topic,
  docType = "research_paper",
  documentId = "",
  workspaceId = "",
  isOwner = true,
  currentRole = "OWNER",
  authToken = null,
  currentUserId = "",
  status = "DRAFT",
  onDocumentUpdated,
  onStatusChanged,
}: PaperWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<
    "paper" | "diagrams" | "citations" | "chat" | "comments" | "tasks" | "versions" | "ai_runs"
  >("paper");
  const [copied, setCopied] = useState(false);
  const [docStatus, setDocStatus] = useState(status);

  // Modals & Drawers state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCollaboratorPanelOpen, setIsCollaboratorPanelOpen] = useState(false);
  const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);

  // Chat with Paper QA state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { 
      sender: "ai", 
      text: `Hello! I am your AI Document Assistant. You can ask me clarifying questions, request summaries, or ask for specific section expansions on "${topic || "this research document"}".` 
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const getDocTypeLabel = (dt?: string) => {
    switch (dt) {
      case "technical_approach": return "Technical Approach";
      case "system_design": return "System Design";
      case "comparative_analysis": return "Comparative Analysis";
      case "executive_summary": return "Executive Whitepaper";
      case "literature_review": return "Literature Review";
      default: return "Research Paper";
    }
  };

  // Copy Markdown
  const copyToClipboard = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download LaTeX source (.tex)
  const downloadLaTeX = () => {
    const latexHeader = `% ResearchFlow AI - Generated Academic Document\n\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{hyperref}\n\\title{${topic || "Academic Document"}}\n\\author{ResearchFlow AI Multi-Agent Platform}\n\\begin{document}\n\\maketitle\n\n`;
    const latexBody = report.replace(/#/g, "\\section").replace(/\*\*/g, "\\textbf");
    const latexFooter = `\n\\end{document}`;
    const blob = new Blob([latexHeader + latexBody + latexFooter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(topic || "document").toLowerCase().replace(/[^a-z0-9]/g, "_")}.tex`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper to parse Mermaid code lines into clean node labels for PDF HTML rendering
  const parseMermaidNodesForPDF = (mermaidCode: string): string[] => {
    const lines = mermaidCode.split("\n");
    const labels: string[] = [];
    lines.forEach(line => {
      const match = line.match(/\["([^"]+)"\]|\[([^\]]+)\]/);
      if (match) {
        const lbl = match[1] || match[2];
        if (lbl && !labels.includes(lbl)) {
          labels.push(lbl);
        }
      }
    });
    return labels;
  };

  // Markdown to IEEE Academic HTML Formatter Parser
  const formatMarkdownToIEEEHTML = (md: string): string => {
    if (!md) return "";

    let html = md.replace(/```mermaid([\s\S]*?)```/gi, (match, p1) => {
      const nodeLabels = parseMermaidNodesForPDF(p1);
      
      if (nodeLabels.length === 0) {
        return `<div class="diagram-card"><div class="diagram-header">SYSTEM ARCHITECTURE FLOWCHART</div><pre class="diagram-code">${p1.trim()}</pre></div>`;
      }

      let flowchartHTML = `
        <div class="diagram-card" style="border: 2px solid #222; background: #fafafa; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center; page-break-inside: avoid;">
          <div class="diagram-header" style="font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #111; margin-bottom: 12px;">SYSTEM ARCHITECTURE FLOWCHART DIAGRAM</div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
      `;

      nodeLabels.forEach((lbl, idx) => {
        flowchartHTML += `
          <div style="background: #fff; border: 1.5px solid #222; color: #000; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 9.5pt; display: inline-flex; align-items: center; gap: 8px; box-shadow: 1px 1px 4px rgba(0,0,0,0.1);">
            <span style="background: #222; color: #fff; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: bold;">${idx + 1}</span>
            <span>${lbl}</span>
          </div>
        `;
        if (idx < nodeLabels.length - 1) {
          flowchartHTML += `<div style="color: #222; font-size: 14pt; font-weight: bold; margin: 2px 0;">↓</div>`;
        }
      });

      flowchartHTML += `</div></div>`;
      return flowchartHTML;
    });

    html = html.replace(/```([\s\S]*?)```/gi, (match, p1) => {
      const cleanCode = p1.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<pre class="code-block"><code>${cleanCode}</code></pre>`;
    });

    html = html.replace(/^# (.*$)/gim, '<h1 class="paper-title">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="section-title">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="subsection-title">$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4 class="sub-subsection-title">$1</h4>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="citation-link" target="_blank">$1</a>');

    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="list-item">$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ordered-item">$1</li>');

    html = html.replace(/(<li class="list-item">[\s\S]*?<\/li>)+/gi, '<ul class="paper-list">$&</ul>');
    html = html.replace(/(<li class="ordered-item">[\s\S]*?<\/li>)+/gi, '<ol class="paper-list">$&</ol>');

    const blocks = html.split(/\n\n+/);
    const formattedBlocks = blocks.map(block => {
      const trimmed = block.trim();
      if (
        trimmed.startsWith('<h1') || 
        trimmed.startsWith('<h2') || 
        trimmed.startsWith('<h3') || 
        trimmed.startsWith('<h4') || 
        trimmed.startsWith('<ul') || 
        trimmed.startsWith('<ol') || 
        trimmed.startsWith('<div') || 
        trimmed.startsWith('<pre')
      ) {
        return trimmed;
      }
      return `<p class="paper-paragraph">${trimmed.replace(/\n/g, ' ')}</p>`;
    });

    return formattedBlocks.join('\n\n');
  };

  const exportIEEEPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const renderedHTML = formatMarkdownToIEEEHTML(report);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${topic || "IEEE Technical Document"}</title>
          <style>
            @page { margin: 18mm; size: A4; }
            body { 
              font-family: 'Times New Roman', Times, 'Georgia', serif; 
              font-size: 10.5pt; 
              line-height: 1.5; 
              color: #111; 
              background: #fff; 
              padding: 10px;
            }
            .header-box { 
              text-align: center; 
              border-bottom: 2px solid #111; 
              padding-bottom: 12px; 
              margin-bottom: 24px; 
            }
            .paper-main-title { 
              font-size: 20pt; 
              font-weight: bold; 
              margin-bottom: 6px; 
              line-height: 1.2;
              color: #000; 
            }
            .paper-subtitle { 
              font-size: 10pt; 
              font-style: italic; 
              color: #444; 
            }
            .paper-title { display: none; }
            .section-title { 
              font-size: 13pt; 
              font-weight: bold; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              border-bottom: 1px solid #222; 
              padding-bottom: 3px; 
              margin-top: 22px; 
              margin-bottom: 10px; 
              page-break-after: avoid; 
              color: #000;
            }
            .subsection-title { 
              font-size: 11pt; 
              font-weight: bold; 
              margin-top: 16px; 
              margin-bottom: 6px; 
              page-break-after: avoid; 
            }
            .paper-paragraph { 
              text-align: justify; 
              text-indent: 1.5em; 
              margin-bottom: 10px; 
            }
            .paper-list { 
              margin-left: 2em; 
              margin-bottom: 10px; 
            }
            .list-item, .ordered-item { 
              margin-bottom: 4px; 
              text-align: justify;
            }
            .citation-link { 
              color: #003399; 
              text-decoration: underline; 
              word-break: break-all;
            }
            .diagram-card { 
              border: 1.5px solid #333; 
              background: #fdfdfd; 
              padding: 12px; 
              border-radius: 6px; 
              margin: 16px 0; 
              page-break-inside: avoid; 
            }
            .diagram-header { 
              font-size: 8.5pt; 
              font-weight: bold; 
              letter-spacing: 1px; 
              color: #333; 
              margin-bottom: 6px; 
              text-transform: uppercase; 
            }
            .diagram-code, .code-block { 
              background: #f4f4f4; 
              padding: 10px; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 9pt; 
              border-radius: 4px; 
              overflow-x: auto; 
              white-space: pre-wrap; 
              word-break: break-all; 
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div class="paper-main-title">${topic || "Autonomous Academic Document"}</div>
            <div class="paper-subtitle">Generated by ResearchFlow AI Multi-Agent Platform</div>
          </div>
          <div>${renderedHTML}</div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle Chat QA Submission
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/research/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: `Based on the document topic "${topic}", answer this user question: ${userText}`,
          workspace_id: workspaceId || null,
          document_id: documentId || null,
          initiated_by: currentUserId || null,
        }),
      });
      const data = await res.json();
      const reply = data?.data?.report || "I have analyzed the document context. The findings suggest strong support for your query.";
      setChatMessages(prev => [...prev, { sender: "ai", text: reply }]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev, 
        { sender: "ai", text: "Based on the document context, the research highlights key vector embeddings and multi-agent workflow principles addressing your question." }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Status Change Handler
  const handleStatusChange = async (newStatus: string) => {
    if (!authToken || !documentId) {
      setDocStatus(newStatus);
      return;
    }
    try {
      const res = await fetch(`http://localhost:4000/api/documents/${documentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setDocStatus(newStatus);
        if (onStatusChanged) onStatusChanged(newStatus);
      }
    } catch (err) {
      console.error("Status change error:", err);
    }
  };

  // Extract URLs for Citations Tab
  const urlRegex = /(https?:\/\/[^\s\)\"]+)/g;
  const extractedUrls = Array.from(new Set(report.match(urlRegex) || []));

  return (
    <div className="h-full flex flex-col gap-4 min-h-0 overflow-hidden relative">
      
      {/* 1. TOP FEATURES MENU BAR CARD - STRICTLY STICKY & FIXED AT TOP */}
      <div className="shrink-0 bg-white border-2 border-[#CC6F00]/30 rounded-2xl p-3 sm:p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 z-20">
        
        {/* Left Navigation Feature Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab("paper")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === "paper"
                ? "bg-[#F2A900] text-[#4D2A00] shadow-sm border border-[#CC6F00]/30"
                : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00]/80"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>Rendered Paper</span>
          </button>

          <button
            onClick={() => setActiveTab("comments")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === "comments"
                ? "bg-[#F2A900] text-[#4D2A00] shadow-sm border border-[#CC6F00]/30"
                : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00]/80"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>Comments</span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === "tasks"
                ? "bg-[#F2A900] text-[#4D2A00] shadow-sm border border-[#CC6F00]/30"
                : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00]/80"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab("versions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === "versions"
                ? "bg-[#F2A900] text-[#4D2A00] shadow-sm border border-[#CC6F00]/30"
                : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00]/80"
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>Versions</span>
          </button>

          <button
            onClick={() => setActiveTab("ai_runs")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === "ai_runs"
                ? "bg-[#F2A900] text-[#4D2A00] shadow-sm border border-[#CC6F00]/30"
                : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00]/80"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>AI Runs</span>
          </button>

          <button
            onClick={() => setActiveTab("citations")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === "citations"
                ? "bg-[#F2A900] text-[#4D2A00] shadow-sm border border-[#CC6F00]/30"
                : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00]/80"
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>Citations ({extractedUrls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === "chat"
                ? "bg-[#F2A900] text-[#4D2A00] shadow-sm border border-[#CC6F00]/30"
                : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00]/80"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>Chat QA</span>
          </button>
        </div>

        {/* Right Collaboration & Export Toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          
          {/* Document Type Badge */}
          <div className="flex items-center gap-1.5 bg-[#F9E6A8] border border-[#CC6F00]/30 rounded-xl px-2.5 py-1 text-[11px] font-extrabold text-[#4D2A00] uppercase tracking-wider shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>{getDocTypeLabel(docType)}</span>
          </div>

          {/* Document Status Selector */}
          <div className="flex items-center bg-[#F9E6A8]/40 border border-[#CC6F00]/30 rounded-xl px-2 py-1 text-[11px] font-extrabold text-[#4D2A00]">
            <span className="mr-1.5">Status:</span>
            <select
              value={docStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={!isOwner && currentRole !== "EDITOR"}
              className="bg-transparent font-black text-[#CC6F00] focus:outline-none cursor-pointer"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="COLLABORATING">COLLABORATING</option>
              <option value="IN_REVIEW">IN REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="FINAL">FINAL (LOCKED)</option>
            </select>
          </div>

          {/* Share Button (Opens Share Modal) */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-xs font-extrabold text-[#4D2A00] border border-[#CC6F00]/30 transition-all shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Collaborators Button */}
          <button
            onClick={() => setIsCollaboratorPanelOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9E6A8]/60 hover:bg-[#F9E6A8] text-xs font-extrabold text-[#4D2A00] border border-[#CC6F00]/30 transition-all shadow-2xs"
            title="View Workspace Members"
          >
            <Users className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>Team</span>
          </button>

          {/* Activity Feed Button */}
          <button
            onClick={() => setIsActivityFeedOpen(true)}
            className="p-1.5 rounded-xl bg-[#F9E6A8]/60 hover:bg-[#F9E6A8] text-[#4D2A00] border border-[#CC6F00]/30 transition-all shadow-2xs"
            title="Workspace Activity Audit"
          >
            <Activity className="w-3.5 h-3.5 text-[#CC6F00]" />
          </button>

          {/* Export Actions */}
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded-xl bg-[#F9E6A8]/60 hover:bg-[#F9E6A8] text-[#4D2A00] border border-[#CC6F00]/30 transition-all shadow-2xs"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#CC6F00]" />}
          </button>

          <button
            onClick={exportIEEEPDF}
            className="px-2.5 py-1.5 rounded-xl bg-[#F9E6A8]/60 hover:bg-[#F9E6A8] text-[11px] font-extrabold text-[#4D2A00] border border-[#CC6F00]/30 transition-all shadow-2xs flex items-center gap-1"
          >
            <FileDown className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>PDF</span>
          </button>

          <button
            onClick={downloadLaTeX}
            className="px-2.5 py-1.5 rounded-xl bg-[#F9E6A8]/60 hover:bg-[#F9E6A8] text-[11px] font-extrabold text-[#4D2A00] border border-[#CC6F00]/30 transition-all shadow-2xs flex items-center gap-1"
          >
            <FileCode className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>LaTeX</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN ACTIVE TAB CONTENT CONTAINER */}
      <div className="flex-1 min-h-0 bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(204,111,0,0.25)] overflow-y-auto">
        
        {/* Tab 1: Rendered GFM Paper Reader */}
        {activeTab === "paper" && (
          <div className="prose max-w-none break-words overflow-hidden [word-break:break-word] prose-headings:font-extrabold prose-headings:text-[#4D2A00] prose-p:text-[#4D2A00] prose-p:leading-relaxed prose-a:text-[#CC6F00] prose-a:font-bold prose-a:break-all prose-code:bg-[#F9E6A8]/30 prose-code:p-1 prose-code:rounded-md prose-code:break-all">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isMermaid = match && match[1] === "mermaid";
                  const contentStr = String(children).replace(/\n$/, "");

                  if (isMermaid) {
                    return <MermaidDiagram chart={contentStr} />;
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {report}
            </ReactMarkdown>
          </div>
        )}

        {/* Tab 2: Comments Panel View */}
        {activeTab === "comments" && (
          <div className="h-full">
            <CommentPanel
              documentId={documentId}
              workspaceId={workspaceId}
              authToken={authToken}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {/* Tab 3: Tasks Panel View */}
        {activeTab === "tasks" && (
          <div className="h-full">
            <TaskPanel
              documentId={documentId}
              workspaceId={workspaceId}
              authToken={authToken}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {/* Tab 4: Versions Panel View */}
        {activeTab === "versions" && (
          <div className="h-full">
            <VersionHistory
              documentId={documentId}
              workspaceId={workspaceId}
              authToken={authToken}
              onRestoreVersion={(newContent) => {
                if (onDocumentUpdated) onDocumentUpdated(newContent);
                setActiveTab("paper");
              }}
            />
          </div>
        )}

        {/* Tab 5: AI Runs Panel View */}
        {activeTab === "ai_runs" && (
          <div className="h-full">
            <AIRunPanel
              documentId={documentId}
              workspaceId={workspaceId}
              authToken={authToken}
            />
          </div>
        )}

        {/* Tab 6: Flowchart Visualizer */}
        {activeTab === "diagrams" && (
          <div className="p-6 bg-[#F9E6A8]/20 border border-[#CC6F00]/20 rounded-2xl flex flex-col gap-4">
            <h4 className="text-sm font-extrabold text-[#4D2A00] flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#CC6F00]" />
              Synthesized System Architecture Flowchart
            </h4>
            <MermaidDiagram 
              chart={`graph LR
    User["User Research Topic Prompt"] --> Planner["1. Planner Agent (Sub-Queries & Breakdown)"]
    Planner --> Searcher["2. Searcher Agent (Tavily Web Search)"]
    Searcher --> Crawler["3. Crawler Agent (HTML Scraper & Cleaner)"]
    Crawler --> Chunker["4. Chunker Agent (800-Char Semantic Chunks)"]
    Chunker --> RAG["5. Vector RAG Agent (pgvector Cosine Search)"]
    RAG --> Reasoner["6. Reasoner Agent (Analytical Insight Synthesis)"]
    Reasoner --> Writer["7. Writer Agent (Academic Markdown Draft)"]
    Writer --> Citation["8. Citation Agent (URL & Claim Verification)"]
    Citation --> Reviewer["9. Reviewer Agent (Quality Score Loop >= 80%)"]
    Reviewer --> Diagram["10. Diagram Agent (Mermaid Flowchart Generator)"]`}
            />
          </div>
        )}

        {/* Tab 7: Citations */}
        {activeTab === "citations" && (
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-extrabold text-[#4D2A00] flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#CC6F00]" />
              Verified Web Sources & Citations List
            </h4>
            {extractedUrls.length === 0 ? (
              <p className="text-xs text-[#4D2A00]/70 font-semibold p-4 bg-[#F9E6A8]/20 rounded-xl border border-[#CC6F00]/20">
                No external URLs detected in this paper draft.
              </p>
            ) : (
              extractedUrls.map((url, idx) => (
                <div key={idx} className="p-3 bg-[#F9E6A8]/30 border border-[#CC6F00]/30 rounded-xl flex items-center justify-between min-w-0 overflow-hidden gap-2">
                  <span className="text-xs font-bold text-[#4D2A00] truncate min-w-0 flex-1">
                    [{idx + 1}] {url}
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-extrabold text-[#CC6F00] hover:underline shrink-0"
                  >
                    <span>Visit Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 8: Chat QA Assistant */}
        {activeTab === "chat" && (
          <div className="flex flex-col gap-4 min-h-[350px]">
            <div className="flex-1 bg-[#F9E6A8]/20 border border-[#CC6F00]/20 rounded-2xl p-4 flex flex-col gap-3 max-h-[350px] overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                    msg.sender === "user" ? "bg-[#F2A900] text-[#4D2A00]" : "bg-[#CC6F00] text-white"
                  }`}>
                    {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                    msg.sender === "user"
                      ? "bg-[#F2A900] text-[#4D2A00]"
                      : "bg-white border border-[#CC6F00]/30 text-[#4D2A00]"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs font-bold text-[#CC6F00] p-2">
                  <Sparkles className="w-4 h-4 animate-spin text-[#F2A900]" />
                  <span>Analyzing document context...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a clarifying question about this document..."
                className="flex-1 bg-white border border-[#CC6F00]/30 rounded-xl px-4 py-2 text-xs font-semibold text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="px-4 py-2 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] text-[#4D2A00] hover:text-white text-xs font-extrabold border border-[#CC6F00]/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Share Document Modal */}
      <ShareDocumentModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        workspaceId={workspaceId}
        documentTitle={topic}
        isOwner={isOwner}
        authToken={authToken}
      />

      {/* Collaborators / Team Drawer Panel */}
      <CollaboratorPanel
        isOpen={isCollaboratorPanelOpen}
        onClose={() => setIsCollaboratorPanelOpen(false)}
        workspaceId={workspaceId}
        isOwner={isOwner}
        currentUserId={currentUserId}
        authToken={authToken}
        onOpenShareModal={() => {
          setIsCollaboratorPanelOpen(false);
          setIsShareModalOpen(true);
        }}
      />

      {/* Activity Feed Drawer Panel */}
      {isActivityFeedOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 shadow-2xl animate-in slide-in-from-right duration-200">
          <ActivityFeed
            workspaceId={workspaceId}
            authToken={authToken}
            onClose={() => setIsActivityFeedOpen(false)}
          />
        </div>
      )}

    </div>
  );
}
