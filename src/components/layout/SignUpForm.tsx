"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Building2, User, Briefcase, CheckCircle, ShieldAlert, ArrowRight, Loader2, Mail } from "lucide-react";
import { registerUserAction } from "@/lib/actions/auth.actions";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface DepartmentOption {
  id: string;
  name: string;
}

interface SignUpFormProps {
  allowedDomain: string;
  departments: DepartmentOption[];
}

export function SignUpForm({ allowedDomain, departments }: SignUpFormProps) {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [workArrangement, setWorkArrangement] = useState("HYBRID");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState(1); // 1: Form, 2: Success

  // Prefill details if user is already authenticated via Google
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setName(session.user.name);
      if (session.user.email) setEmail(session.user.email);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    const domain = cleanEmail.split("@")[1];

    if (domain !== allowedDomain) {
      setErrorMsg(`Invalid email domain. You must register with your @${allowedDomain} corporate email address.`);
      return;
    }

    if (!name.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }

    if (!departmentId) {
      setErrorMsg("Please select your department.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerUserAction({
        email: cleanEmail,
        name: name.trim(),
        jobTitle: jobTitle.trim() || "Staff",
        departmentId,
        workArrangement,
      });

      if (res.success) {
        setStep(2);
      } else {
        setErrorMsg(res.error || "Failed to register account.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg w-full py-12 px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="glass-panel p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
        {/* Decorative Ambient Gradients */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-cyan-500 to-sky-400 p-0.5 shadow-xl shadow-brand-500/30 flex items-center justify-center">
                <div className="h-full w-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-cyan-500 dark:text-cyan-400" />
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5" /> {session?.user ? "Complete Onboarding" : "Self-Onboarding"}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {session?.user ? "Setup Employee Profile" : "Create Employee Profile"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {session?.user 
                  ? "Configure your workspace profile to finalize registration."
                  : `Onboard yourself directly to the Getrova workspace using your company @${allowedDomain} email.`}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-gray-55 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Corporate Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Corporate Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    disabled={!!session?.user}
                    readOnly={!!session?.user}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`yourname@${allowedDomain}`}
                    className="w-full bg-gray-55 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                {!session?.user && (
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Must be an active @{allowedDomain} email address.</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-gray-55 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select your department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Arrangement */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Work Arrangement <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={workArrangement}
                  onChange={(e) => setWorkArrangement(e.target.value)}
                  className="w-full bg-gray-55 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="HYBRID">Hybrid (Office + Remote)</option>
                  <option value="REMOTE">Fully Remote</option>
                </select>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Complete Registration <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {!session?.user && (
                <div className="text-center pt-2">
                  <Link
                    href="/auth/signin"
                    className="text-xs text-gray-500 hover:text-amber-500 dark:text-slate-450 dark:hover:text-amber-400 font-semibold transition-colors"
                  >
                    Already have an account? Sign In
                  </Link>
                </div>
              )}
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {session?.user ? "Onboarding Complete!" : "Registration Successful!"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                {session?.user
                  ? "Your profile has been successfully configured. You can now proceed to your dashboard."
                  : "Your profile has been created and assigned to your department. You can now sign in to the workspace."}
              </p>
            </div>

            <button
              onClick={async () => {
                if (session?.user) {
                  await updateSession();
                  router.push("/dashboard");
                } else {
                  router.push("/auth/signin");
                }
              }}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 active:scale-[0.99] transition-all shadow-lg shadow-brand-600/30"
            >
              {session?.user ? "Go to Dashboard" : "Sign In to Workspace"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
