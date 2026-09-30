"use client";

import React, { useEffect, useState } from "react";
import { BrainCircuit, ArrowRight } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress slider animation over 2.5s
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const timer = setTimeout(() => {
      handleComplete();
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const handleComplete = () => {
    setFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#F9E6A8] text-[#4D2A00] transition-opacity duration-500 ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Glow Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F2A900]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative flex flex-col items-center text-center max-w-lg mx-auto">
        
        {/* Logo Container */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#F2A900] to-[#CC6F00] p-1 shadow-xl shadow-[#CC6F00]/20">
            <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center border border-[#CC6F00]/30">
              <BrainCircuit className="w-12 h-12 text-[#CC6F00]" />
            </div>
          </div>
        </div>

        {/* Project Name */}
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-[#4D2A00] via-[#CC6F00] to-[#4D2A00] bg-clip-text text-transparent">
            ResearchFlow AI
          </span>
        </h1>

        {/* Quote */}
        <p className="text-[#4D2A00]/90 text-sm italic font-medium leading-relaxed mb-8 max-w-md">
          &ldquo;Empowering Literature Reviews & Deep Research with Stateful Multi-Agent Intelligence&rdquo;
        </p>

        {/* Animated Slider Progress Bar */}
        <div className="w-64 h-2.5 bg-white/80 rounded-full overflow-hidden mb-6 p-0.5 border border-[#CC6F00]/30 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#F2A900] to-[#CC6F00] rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Skip / Continue Button */}
        <button
          onClick={handleComplete}
          className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white border border-[#CC6F00]/40 text-xs font-bold text-[#4D2A00] transition-all shadow-md"
        >
          <span>Get Started</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#4D2A00] group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
