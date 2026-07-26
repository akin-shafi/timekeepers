"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, Building2, User, Briefcase, Phone, CheckCircle, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { verifyInvitationTokenAction, acceptInvitationAction } from "@/lib/actions/invite.actions";

function OnboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token") || "";

  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verifyError, setVerifyError] = useState("");
  const [invitationInfo, setInvitationInfo] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [step, setStep] = useState(1); // 1: Welcome/Verification, 2: Form, 3: Success

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setVerifyError("No invitation token was provided. Please verify the URL.");
        setVerificationLoading(false);
        return;
      }

      try {
        const res = await verifyInvitationTokenAction(token);
        if (res.success && res.invitation) {
          setInvitationInfo(res.invitation);
          setJobTitle(res.invitation.role === "EMPLOYEE" ? "Software Engineer" : res.invitation.role);
        } else {
          setVerifyError(res.error || "The invitation link is invalid or expired.");
        }
      } catch (err: any) {
        setVerifyError(err.message || "An unexpected error occurred during verification.");
      } finally {
        setVerificationLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSubmitError("Full Name is required.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await acceptInvitationAction(token, {
        name: name.trim(),
        jobTitle: jobTitle.trim() || "Staff",
        phone: phone.trim(),
      });

      if (res.success) {
        setStep(3);
      } else {
        setSubmitError(res.error || "Failed to complete onboarding.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verificationLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        <p className="text-sm text-gray-500 dark:text-slate-400">Verifying secure invitation token...</p>
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-red-500/30 text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invitation Invalid</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            {verifyError}
          </p>
        </div>

        <button
          onClick={() => router.push("/auth/signin")}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors w-full"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg w-full py-12 px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="glass-panel p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
        {/* Decorative Ambient Gradients */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
          <div className={`bg-emerald-500 h-full transition-all duration-500 ${step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full"}`} />
        </div>

        {step === 1 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5 shadow-xl shadow-brand-500/30 flex items-center justify-center">
              <div className="h-full w-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Building2 className="h-8 w-8 text-cyan-500 dark:text-cyan-400" />
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5" /> Welcome Aboard!
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Onboard Workspace</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                You have been invited to join <strong className="text-gray-900 dark:text-white">{invitationInfo.organizationName}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-150 dark:border-slate-800 text-left space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Invitation Details</p>
              <div className="text-xs space-y-1.5 text-gray-600 dark:text-slate-300">
                <p>Email: <span className="font-semibold text-gray-800 dark:text-white">{invitationInfo.email}</span></p>
                <p>Role: <span className="font-semibold text-gray-800 dark:text-white">{invitationInfo.role}</span></p>
                {invitationInfo.departmentName && (
                  <p>Department: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{invitationInfo.departmentName}</span></p>
                )}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-lg shadow-emerald-600/30"
            >
              Configure Profile <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Setup</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Let us know a little more about yourself to finalize registration.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    disabled
                    readOnly
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {submitError && (
                <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                  {submitError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-850 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-lg shadow-emerald-600/30"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Profile Configured!</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                Your workspace profile has been registered. You can now login to track your attendance.
              </p>
            </div>

            <button
              onClick={() => router.push("/auth/signin")}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 active:scale-[0.99] transition-all shadow-lg shadow-brand-600/30"
            >
              Sign In to Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-gray-500 dark:text-slate-400">Loading secure template...</p>
      </div>
    }>
      <OnboardContent />
    </Suspense>
  );
}
