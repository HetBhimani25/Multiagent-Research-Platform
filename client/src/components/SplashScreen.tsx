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

    // Auto-transition after 2.5 seconds
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 transition-opacity duration-500 ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative flex flex-col items-center text-center max-w-lg mx-auto">
        
        {/* Logo Placeholder Container */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 shadow-xl shadow-indigo-500/15">
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center border border-indigo-100">
              <BrainCircuit className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Project Name */}
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 bg-clip-text text-transparent">
            ResearchFlow AI
          </span>
        </h1>

        {/* Quote */}
        <p className="text-slate-600 text-sm italic font-medium leading-relaxed mb-8 max-w-md">
          &ldquo;Empowering Literature Reviews & Deep Research with Stateful Multi-Agent Intelligence&rdquo;
        </p>

        {/* Animated Slider Progress Bar */}
        <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden mb-6 p-0.5 border border-slate-300/60 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Skip / Continue Button */}
        <button
          onClick={handleComplete}
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-all shadow-sm hover:text-indigo-600"
        >
          <span>Get Started</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
