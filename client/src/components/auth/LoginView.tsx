"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight, BrainCircuit } from "lucide-react";

interface LoginViewProps {
  onSwitchToSignUp: () => void;
}

export default function LoginView({ onSwitchToSignUp }: LoginViewProps) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || "Invalid email or password.");
      }
    } catch (err: any) {
      setError("An error occurred connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setError("");
    setLoading(true);
    const res = await register("Demo Researcher", "demo@researchflow.ai", "demo123456");
    if (!res.success) {
      const loginRes = await login("demo@researchflow.ai", "demo123456");
      if (!loginRes.success) setError("Demo login failed.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#F9E6A8] text-[#4D2A00] relative">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 bg-white border border-[#CC6F00]/30 text-[#CC6F00] rounded-2xl mb-4 shadow-md">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#4D2A00] via-[#CC6F00] to-[#4D2A00] bg-clip-text text-transparent">
            ResearchFlow AI
          </h1>
          <p className="text-xs font-semibold text-[#4D2A00]/80 mt-1">
            Sign in to access your multi-agent research dashboard
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white border-2 border-[#CC6F00]/20 rounded-3xl p-8 shadow-xl">
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4D2A00] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#CC6F00]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@gmail.com"
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900] focus:border-[#CC6F00]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-[#4D2A00]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#CC6F00]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 pl-10 pr-10 text-sm text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900] focus:border-[#CC6F00]"
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

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-[#CC6F00]/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Access */}
            <button
              type="button"
              onClick={handleDemoAccess}
              className="w-full py-2.5 rounded-xl bg-[#F9E6A8]/50 hover:bg-[#F9E6A8] border border-[#CC6F00]/40 text-[#4D2A00] text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#CC6F00]" />
              <span>Quick Demo Access</span>
            </button>
          </form>

          {/* Footer Navigation Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-[#4D2A00]/80">
              Don&apos;t have an account?{" "}
              <button
                onClick={onSwitchToSignUp}
                className="font-bold text-[#CC6F00] hover:underline ml-1"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
