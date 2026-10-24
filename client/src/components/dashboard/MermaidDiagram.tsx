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
        // Clean chart and strip title comment for mermaid.render
        let cleanChart = chart.trim();
        cleanChart = cleanChart.replace(/%%\s*title:[^\n]*\n?/i, "").trim();

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

  // Extract custom diagram title from comment if present: %% title: ...
  const titleMatch = chart.match(/%%\s*title:\s*([^\n]+)/i);
  const diagramTitle = titleMatch ? titleMatch[1].trim() : "Technical Workflow & Architecture Flowchart";

  // Detect orientation (vertical TD/TB, combination with subgraphs, or horizontal LR)
  const isVertical = /(graph|flowchart)\s+(TD|TB)/i.test(chart);
  const isCombination = /subgraph/i.test(chart);
  const layoutBadge = isCombination 
    ? "Multi-Tier Architecture" 
    : isVertical 
    ? "Vertical Process Flow" 
    : "Horizontal Workflow";

  return (
    <div className="my-6 p-4 sm:p-6 bg-[#F9E6A8]/20 border-2 border-[#CC6F00]/30 rounded-2xl shadow-md overflow-x-auto">
      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#CC6F00] mb-4 flex items-center justify-between gap-2 flex-wrap">
        <span>{diagramTitle}</span>
        <span className="bg-[#F9E6A8] text-[#4D2A00] px-2.5 py-0.5 rounded-md border border-[#CC6F00]/25 text-[10px] font-black">
          {layoutBadge}
        </span>
      </div>

      {svgContent && !error ? (
        <div
          ref={containerRef}
          className={`overflow-x-auto flex justify-center p-2 sm:p-4 w-full ${
            isVertical || isCombination ? "[&>svg]:max-w-full [&>svg]:h-auto" : "min-w-max [&>svg]:max-w-none [&>svg]:h-auto"
          } [&_foreignObject]:overflow-visible [&_foreignObject]:w-auto [&_.nodeLabel]:whitespace-nowrap [&_.nodeLabel]:writing-mode-horizontal [&_.nodeLabel]:font-black [&_.nodeLabel]:text-xs [&_text]:overflow-visible [&_.node_rect]:min-w-[140px]`}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        /* Fallback Visual Flowchart Card Sequence */
        <div className={`flex ${isVertical ? "flex-col items-center" : "flex-row flex-wrap items-center justify-center"} gap-3 w-full py-3`}>
          {nodeLabels.map((label, idx) => (
            <React.Fragment key={idx}>
              <div className="bg-[#F9E6A8] border-2 border-[#CC6F00] text-[#4D2A00] px-4 py-2.5 rounded-2xl text-xs font-extrabold shadow-sm flex items-center gap-2 text-center transition-all hover:border-[#4D2A00] shrink-0">
                <span className="w-5 h-5 rounded-full bg-[#F2A900] text-[#4D2A00] text-[10px] font-black flex items-center justify-center shrink-0 border border-[#CC6F00]/30 shadow-xs">
                  {idx + 1}
                </span>
                <span className="font-bold">
                  {label}
                </span>
              </div>
              {idx < nodeLabels.length - 1 && (
                <div className="text-[#CC6F00] font-black text-base leading-none shrink-0 px-1">
                  {isVertical ? "↓" : "➔"}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
