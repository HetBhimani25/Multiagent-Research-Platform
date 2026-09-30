"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Lock, Mail, User, Eye, EyeOff, Loader2, Sparkles, AlertCircle, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLoginTab) {
      if (!fullName.trim()) {
        setError("Full Name is required.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLoginTab) {
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || "Login failed");
        }
      } else {
        const res = await register(fullName, email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || "Registration failed");
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("demo@researchflow.ai");
    setPassword("demo123456");
    setError("");
    setLoading(true);
    const res = await register("Demo Researcher", "demo@researchflow.ai", "demo123456");
    if (!res.success) {
      const loginRes = await login("demo@researchflow.ai", "demo123456");
      if (loginRes.success) onClose();
      else setError("Demo login failed.");
    } else {
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4D2A00]/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border-2 border-[#CC6F00]/30 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#CC6F00] hover:text-[#4D2A00] p-1.5 rounded-lg hover:bg-[#F9E6A8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="p-6 pb-4 text-center border-b border-[#CC6F00]/20 bg-[#F9E6A8]/40">
          <div className="inline-flex p-3 bg-[#F2A900]/20 border border-[#CC6F00]/30 text-[#CC6F00] rounded-2xl mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[#4D2A00]">
            {isLoginTab ? "Welcome Back to ResearchFlow AI" : "Create Your Free Account"}
          </h2>
          <p className="text-xs font-semibold text-[#4D2A00]/70 mt-1">
            Access multi-agent research automation & paper generation
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#CC6F00]/20 bg-[#F9E6A8]/20">
          <button
            onClick={() => { setIsLoginTab(true); setError(""); }}
            className={`flex-1 py-3 text-xs font-extrabold tracking-wider transition-all border-b-2 ${
              isLoginTab
                ? "border-[#CC6F00] text-[#CC6F00] bg-white"
                : "border-transparent text-[#4D2A00]/60 hover:text-[#4D2A00]"
            }`}
          >
            SIGN IN
          </button>
          <button
            onClick={() => { setIsLoginTab(false); setError(""); }}
            className={`flex-1 py-3 text-xs font-extrabold tracking-wider transition-all border-b-2 ${
              !isLoginTab
                ? "border-[#CC6F00] text-[#CC6F00] bg-white"
                : "border-transparent text-[#4D2A00]/60 hover:text-[#4D2A00]"
            }`}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLoginTab && (
            <div>
              <label className="block text-xs font-bold text-[#4D2A00] mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-[#CC6F00]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. John Doe"
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#4D2A00] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#CC6F00]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@gmail.com"
                className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4D2A00] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#CC6F00]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 pl-10 pr-10 text-sm text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#CC6F00] hover:text-[#4D2A00]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLoginTab && (
            <div>
              <label className="block text-xs font-bold text-[#4D2A00] mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#CC6F00]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-[#CC6F00]/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : isLoginTab ? (
              "Sign In to Account"
            ) : (
              "Complete Account Setup"
            )}
          </button>

          {/* Quick Demo Access Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 rounded-xl bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] border border-[#CC6F00]/40 text-[#4D2A00] text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#CC6F00]" />
            Sign in as Quick Demo User
          </button>
        </form>
      </div>
    </div>
  );
}
