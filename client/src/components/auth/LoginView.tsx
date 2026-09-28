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
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50 text-slate-900 relative">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 rounded-2xl mb-4 shadow-sm">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            ResearchFlow AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to access your multi-agent research dashboard
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Quick Demo Access</span>
            </button>
          </form>

          {/* Footer Navigation Link */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <button
                onClick={onSwitchToSignUp}
                className="font-semibold text-indigo-600 hover:underline ml-1"
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
