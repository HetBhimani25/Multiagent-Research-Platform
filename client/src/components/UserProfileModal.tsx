"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Calendar, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, token } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: fullName !== user.fullName ? fullName : undefined,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setStatusMsg("Profile updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setErrorMsg(data.error || "Failed to update profile.");
      }
    } catch (err: any) {
      setErrorMsg("Network error updating profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4D2A00]/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border-2 border-[#CC6F00]/30 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-[#CC6F00]/20 bg-[#F9E6A8]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F2A900] border border-[#CC6F00]/30 text-[#4D2A00] flex items-center justify-center font-extrabold text-base">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#4D2A00]">{user.fullName}</h2>
              <p className="text-xs font-semibold text-[#CC6F00]">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#CC6F00] hover:text-[#4D2A00] p-1.5 rounded-lg hover:bg-[#F9E6A8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6">
          
          {/* Account Details Box */}
          <div className="p-4 bg-[#F9E6A8]/30 border border-[#CC6F00]/20 rounded-2xl grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#4D2A00]/70 flex items-center gap-1.5 mb-1 font-bold">
                <Calendar className="w-3.5 h-3.5 text-[#CC6F00]" /> Member Since
              </span>
              <p className="font-extrabold text-[#4D2A00]">
                {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div>
              <span className="text-[#4D2A00]/70 flex items-center gap-1.5 mb-1 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#CC6F00]" /> Session Status
              </span>
              <p className="font-extrabold text-[#CC6F00]">JWT Verified (7 Days)</p>
            </div>
          </div>

          {/* Update Profile Form */}
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4D2A00]/70">Edit Profile & Security</h3>

            {statusMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4D2A00] mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 px-3.5 text-xs text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#4D2A00] mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 px-3.5 text-xs text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4D2A00] mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-[#F9E6A8]/20 border border-[#CC6F00]/30 rounded-xl py-2.5 px-3.5 text-xs text-[#4D2A00] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 rounded-xl bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white text-[#4D2A00] font-extrabold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 border border-[#CC6F00]/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                "Save Profile Changes"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
