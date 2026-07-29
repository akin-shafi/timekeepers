"use client";

import React, { useEffect, useState } from "react";
import { getMyMilestonesAction } from "@/lib/actions/attendance.actions";
import { checkAiFeatureEnabledAction, generateMilestoneSummaryAction } from "@/lib/actions/ai.actions";
import { CheckCircle2, Calendar, Clock, NotebookText, Sparkles, X, Loader2 } from "lucide-react";

export default function MyMilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  
  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [milestonesRes, aiRes] = await Promise.all([
          getMyMilestonesAction(),
          checkAiFeatureEnabledAction()
        ]);
        
        if (milestonesRes.success && milestonesRes.records) {
          setMilestones(milestonesRes.records);
        }
        if (aiRes.success) {
          setAiEnabled(aiRes.enabled);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setAiError("Please enter a valid 6-digit OTP code.");
      return;
    }
    
    setIsGenerating(true);
    setAiError("");
    setAiSummary(null);

    const res = await generateMilestoneSummaryAction(otpCode);
    if (res.success && res.summary) {
      setAiSummary(res.summary);
      setOtpCode("");
    } else {
      setAiError(res.error || "An unknown error occurred.");
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand-500 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <NotebookText className="h-3.5 w-3.5" /> Performance & KPIs
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">My Milestones</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            A record of your weekly achievements and completed tasks.
          </p>
        </div>
        
        {aiEnabled && milestones.length > 0 && (
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all"
          >
            <Sparkles className="h-4 w-4" /> Generate AI Summary
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      ) : milestones.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-4">
          <div className="mx-auto h-16 w-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-400">
            <NotebookText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Milestones Yet</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
            When you check out and add your daily achievements, they will appear here for your future reference and KPI reviews.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {milestones.map((m) => (
            <div key={m.id} className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400 font-semibold">
                  <Calendar className="h-5 w-5" />
                  {new Date(m.workDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  {m.hoursWorked} hrs worked
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="mt-1 h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {m.dailyMilestone}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Summary Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI KPI Summary</h2>
              </div>
              <button
                onClick={() => {
                  setShowAiModal(false);
                  setAiSummary(null);
                  setAiError("");
                  setOtpCode("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {!aiSummary ? (
                <div className="space-y-6">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 rounded-2xl p-5 text-sm text-purple-800 dark:text-purple-300">
                    <p>
                      Generate a professional, structured KPI report based on your milestones from the last 30 days. 
                      You need a <strong>6-digit OTP code</strong> from your HR department to use this feature.
                    </p>
                  </div>

                  <form onSubmit={handleGenerateSummary} className="space-y-4">
                    {aiError && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                        {aiError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                        HR OTP Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full text-center text-2xl tracking-widest font-mono font-bold px-4 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isGenerating || otpCode.length !== 6}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all"
                    >
                      {isGenerating ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="h-5 w-5" /> Generate Report</>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="prose prose-purple dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                    {aiSummary}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiSummary);
                      alert("Copied to clipboard!");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-semibold rounded-xl transition-all"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
