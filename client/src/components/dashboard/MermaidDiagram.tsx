"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      fontFamily: "inherit",
      flowchart: {
        htmlLabels: true,
        useMaxWidth: false,
        nodeSpacing: 50,
        rankSpacing: 50,
        curve: "basis",
      },
    });

    let isMounted = true;
    const uniqueId = `mermaid_${Math.random().toString(36).substring(2, 9)}`;

    const renderChart = async () => {
      try {
        if (!chart || !chart.trim()) return;
        // Convert any graph TD to graph LR for horizontal layout
        let cleanChart = chart.trim();
        if (cleanChart.startsWith("graph TD") || cleanChart.startsWith("graph TB")) {
          cleanChart = cleanChart.replace(/^graph (TD|TB)/i, "graph LR");
        }

        const { svg } = await mermaid.render(uniqueId, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
          setError(false);
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        if (isMounted) {
          setError(true);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  // Parse nodes for visual flowchart fallback list
  const parseNodes = (mermaidCode: string) => {
    const lines = mermaidCode.split("\n");
    const nodes: string[] = [];
    lines.forEach((line) => {
      const match = line.match(/\["([^"]+)"\]|\[([^\]]+)\]/);
      if (match) {
        const label = match[1] || match[2];
        if (label && !nodes.includes(label)) {
          nodes.push(label);
        }
      }
    });
    return nodes;
  };

  const nodeLabels = parseNodes(chart);

  return (
    <div className="my-6 p-4 sm:p-6 bg-[#F9E6A8]/20 border-2 border-[#CC6F00]/30 rounded-2xl shadow-md overflow-x-auto">
      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#CC6F00] mb-4 flex items-center justify-between">
        <span>System Architecture Flowchart</span>
        <span className="bg-[#F9E6A8] text-[#4D2A00] px-2 py-0.5 rounded-md border border-[#CC6F00]/20 text-[10px]">
          Horizontal Flow Graph
        </span>
      </div>

      {svgContent && !error ? (
        <div
          ref={containerRef}
          className="overflow-x-auto flex justify-center p-4 min-w-max [&>svg]:max-w-none [&>svg]:h-auto [&_foreignObject]:overflow-visible [&_foreignObject]:w-auto [&_.nodeLabel]:whitespace-nowrap [&_.nodeLabel]:writing-mode-horizontal [&_.nodeLabel]:font-black [&_.nodeLabel]:text-xs [&_text]:overflow-visible [&_.node_rect]:min-w-[140px]"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        /* Horizontal Flowchart Card Sequence (Left-to-Right Horizontal Flow) */
        <div className="flex flex-row flex-wrap items-center justify-center gap-3 w-full py-3">
          {nodeLabels.map((label, idx) => (
            <React.Fragment key={idx}>
              <div className="bg-[#F9E6A8] border-2 border-[#CC6F00] text-[#4D2A00] px-4 py-2.5 rounded-2xl text-xs font-extrabold shadow-sm flex items-center gap-2 text-center transition-all hover:border-[#4D2A00] shrink-0">
                <span className="w-5 h-5 rounded-full bg-[#F2A900] text-[#4D2A00] text-[10px] font-black flex items-center justify-center shrink-0 border border-[#CC6F00]/30 shadow-xs">
                  {idx + 1}
                </span>
                <span className="whitespace-nowrap font-bold">
                  {label}
                </span>
              </div>
              {idx < nodeLabels.length - 1 && (
                <div className="text-[#CC6F00] font-black text-lg leading-none shrink-0 px-1">
                  ➔
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
