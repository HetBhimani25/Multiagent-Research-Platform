"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, Loader2, BrainCircuit, ArrowRight } from "lucide-react";

interface SignUpViewProps {
  onSwitchToLogin: () => void;
}

export default function SignUpView({ onSwitchToLogin }: SignUpViewProps) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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

    setLoading(true);

    try {
      const res = await register(fullName, email, password);
      if (!res.success) {
        setError(res.error || "Registration failed.");
      }
    } catch (err: any) {
      setError("An error occurred connecting to the server.");
    } finally {
      setLoading(false);
    }
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
            Join ResearchFlow AI
          </h1>
          <p className="text-xs font-semibold text-[#4D2A00]/80 mt-1">
            Create your account to unlock multi-agent literature research
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
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-[#CC6F00]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. John Doe"
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900] focus:border-[#CC6F00]"
                />
              </div>
            </div>

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
              <label className="block text-xs font-bold text-[#4D2A00] mb-1.5">
                Password
              </label>
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

            <div>
              <label className="block text-xs font-bold text-[#4D2A00] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#CC6F00]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A900] focus:border-[#CC6F00]"
                />
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
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-[#4D2A00]/80">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="font-bold text-[#CC6F00] hover:underline ml-1"
              >
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
