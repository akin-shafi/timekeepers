"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Clock, ShieldCheck, ArrowRight, Lock, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [idleLogout, setIdleLogout] = useState(false);

  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reason") === "idle") {
      setIdleLogout(true);
    }
  }, []);

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Ambient Gradient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center relative">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-cyan-500 to-sky-400 p-0.5 shadow-xl shadow-brand-500/30 flex items-center justify-center">
            <div className="h-full w-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Clock className="h-7 w-7 text-cyan-500 dark:text-cyan-400" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Time Keeper</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Attendance Management System
          </p>
        </div>

        {/* Domain Restriction Notice Box */}
        <div className="bg-brand-500/10 border border-brand-500/30 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600 dark:text-slate-300">
            <p className="font-semibold text-gray-900 dark:text-white">Domain Restricted Access</p>
            <p className="mt-0.5 text-gray-500 dark:text-slate-400">
              Only Google Workspace accounts ending with <span className="font-mono text-cyan-600 dark:text-cyan-300 font-bold">@getrova.com</span> are permitted to register or log in.
            </p>
          </div>
        </div>

        {idleLogout && !errorMsg && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-600 dark:text-amber-300 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
            <span>You were signed out after 15 minutes of inactivity. Please sign in again.</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Action: Google Workspace OAuth */}
        <div className="space-y-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-all shadow-lg hover:shadow-cyan-500/10 active:scale-[0.99] border border-gray-200 dark:border-transparent"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google Workspace
          </button>

          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-gray-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-950 px-3 text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest absolute">
              System Administration
            </span>
          </div>

          <div className="flex flex-col gap-3 text-center">
            <Link
              href="/auth/admin-login"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-slate-850 hover:bg-slate-800 transition-all shadow-md active:scale-[0.99] border border-gray-200 dark:border-slate-800"
            >
              Sign In to Admin Portal
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/auth/signup"
              className="text-xs text-gray-500 hover:text-cyan-500 dark:text-slate-400 dark:hover:text-cyan-400 font-semibold transition-colors mt-2"
            >
              New Employee? Complete Onboarding
            </Link>
          </div>
        </div>

        {/* Security Footer */}
        <div className="pt-4 text-center text-xs text-gray-400 dark:text-slate-500 flex items-center justify-center gap-2">
          <Lock className="h-3.5 w-3.5 text-gray-400 dark:text-slate-400" />
          <span>Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}
