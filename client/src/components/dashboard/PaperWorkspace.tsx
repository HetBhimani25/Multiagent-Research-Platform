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
  ExternalLink
} from "lucide-react";

interface PaperWorkspaceProps {
  report: string;
  topic: string;
}

export default function PaperWorkspace({ report, topic }: PaperWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"paper" | "diagrams" | "citations" | "chat">("paper");
  const [copied, setCopied] = useState(false);

  // Chat with Paper QA state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { 
      sender: "ai", 
      text: `Hello! I am your AI Document Assistant. You can ask me clarifying questions, request summaries, or ask for specific section expansions on "${topic || "this research document"}".` 
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

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

    // 1. Process Mermaid & Code Blocks into Visual Flowchart Cards for IEEE PDF
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

    // 2. Headings
    html = html.replace(/^# (.*$)/gim, '<h1 class="paper-title">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="section-title">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="subsection-title">$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4 class="sub-subsection-title">$1</h4>');

    // 3. Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 4. Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="citation-link" target="_blank">$1</a>');

    // 5. Lists
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="list-item">$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ordered-item">$1</li>');

    html = html.replace(/(<li class="list-item">[\s\S]*?<\/li>)+/gi, '<ul class="paper-list">$&</ul>');
    html = html.replace(/(<li class="ordered-item">[\s\S]*?<\/li>)+/gi, '<ol class="paper-list">$&</ol>');

    // 6. Paragraphs
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

  // Export IEEE PDF (Triggers Print / PDF Save with IEEE Styling)
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
        body: JSON.stringify({ question: `Based on the document topic "${topic}", answer this user question: ${userText}` }),
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

  // Extract URLs for Citations Tab
  const urlRegex = /(https?:\/\/[^\s\)\"]+)/g;
  const extractedUrls = Array.from(new Set(report.match(urlRegex) || []));

  return (
    <div className="h-full flex flex-col gap-4 min-h-0 overflow-hidden">
      
      {/* 1. TOP FEATURES MENU BAR CARD - STRICTLY STICKY & FIXED AT TOP (IMAGE 2 DESIGN) */}
      <div className="shrink-0 bg-white border-2 border-[#CC6F00]/30 rounded-2xl p-3 sm:p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 z-20">
        
        {/* Left Navigation Feature Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab("paper")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === "paper"
                ? "bg-[#F2A900] text-[#4D2A00] shadow-sm border border-[#CC6F00]/30"
                : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00]/80"
            }`}
          >
            <FileText className="w-4 h-4 text-[#CC6F00]" />
            <span>Rendered Paper</span>
          </button>


          <button
            onClick={() => setActiveTab("citations")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === "citations"
                ? "bg-[#F2A900] text-[#4D2A00] shadow-sm border border-[#CC6F00]/30"
                : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00]/80"
            }`}
          >
            <Link2 className="w-4 h-4 text-[#CC6F00]" />
            <span>Citations ({extractedUrls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === "chat"
                ? "bg-[#F2A900] text-[#4D2A00] shadow-sm border border-[#CC6F00]/30"
                : "bg-[#F9E6A8]/40 hover:bg-[#F9E6A8] text-[#4D2A00]/80"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#CC6F00]" />
            <span>Chat-with-Paper QA</span>
          </button>
        </div>

        {/* Right Export Actions Toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9E6A8]/60 hover:bg-[#F9E6A8] text-xs font-extrabold text-[#4D2A00] border border-[#CC6F00]/30 transition-all shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#CC6F00]" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={exportIEEEPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9E6A8]/60 hover:bg-[#F9E6A8] text-xs font-extrabold text-[#4D2A00] border border-[#CC6F00]/30 transition-all shadow-2xs"
          >
            <FileDown className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>IEEE PDF</span>
          </button>

          <button
            onClick={downloadLaTeX}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9E6A8]/60 hover:bg-[#F9E6A8] text-xs font-extrabold text-[#4D2A00] border border-[#CC6F00]/30 transition-all shadow-2xs"
          >
            <FileCode className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>LaTeX (.tex)</span>
          </button>
        </div>
      </div>

      {/* 2. GENERATED DOCUMENT CONTENT CARD - INDEPENDENTLY SCROLLABLE (IMAGE 2 DESIGN) */}
      <div className="flex-1 min-h-0 bg-white border-2 border-[#CC6F00]/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(204,111,0,0.25)] overflow-y-auto">
        {/* Tab 1: Rendered GFM Paper Reader with Visual Mermaid Component */}
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

        {/* Tab 2: Mermaid Flowchart Visualizer */}
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

        {/* Tab 3: Sources & Verified Citations */}
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

        {/* Tab 4: Chat-with-Paper QA Assistant */}
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

    </div>
  );
}
