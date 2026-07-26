"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Clock, ShieldAlert, ArrowRight, Lock, Key, Mail, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        redirect: false, // Handle redirect manually to capture errors
        callbackUrl: "/dashboard",
      });

      if (res?.error) {
        setErrorMsg(res.error || "Authentication failed.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 glass-panel p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Ambient Gradient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center relative">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-400 p-0.5 shadow-xl shadow-rose-500/30 flex items-center justify-center">
            <div className="h-full w-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Clock className="h-7 w-7 text-rose-500 dark:text-rose-400" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Portal</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            System Administrator Sign In
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdminSignIn} className="space-y-4 relative">
          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                className="w-full bg-gray-55 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-55 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.99] transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Authenticate Administrator <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-450 font-semibold transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Employee Sign In
            </Link>
          </div>
        </form>

        {/* Security Footer */}
        <div className="pt-4 text-center text-xs text-gray-400 dark:text-slate-500 flex items-center justify-center gap-2">
          <Lock className="h-3.5 w-3.5 text-gray-400 dark:text-slate-400" />
          <span>Encrypted System Console Session</span>
        </div>
      </div>
    </div>
  );
}
