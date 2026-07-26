"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Building2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const domain = searchParams?.get("domain") || "unapproved";

  return (
    <div className="flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-red-500/30 text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">
            Your email domain (<span className="font-mono text-red-400 font-bold">@{domain}</span>) is not authorized to access this organization.
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-slate-900/80 rounded-2xl p-4 text-xs text-gray-500 dark:text-slate-400 text-left space-y-2 border border-gray-200 dark:border-slate-800">
          <p className="font-semibold text-gray-700 dark:text-slate-200">Security Requirement:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Only approved Google Workspace accounts ending with <strong className="text-cyan-600 dark:text-cyan-300">@getrova.com</strong> can log in.</li>
            <li>Personal Gmail addresses or external corporate accounts are blocked for data isolation.</li>
          </ul>
        </div>

        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors w-full"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-3xl text-center">
          <p className="text-gray-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
