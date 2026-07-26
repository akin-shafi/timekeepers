"use client";

import React, { useState, useEffect } from "react";
import { FileCheck, Plus, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { submitCorrectionRequestAction } from "@/lib/actions/correction.actions";

export default function EmployeeCorrectionsPage() {
  const [workDate, setWorkDate] = useState(new Date().toISOString().split("T")[0]);
  const [requestedLocation, setRequestedLocation] = useState<"OFFICE" | "REMOTE">("OFFICE");
  const [requestedCheckIn, setRequestedCheckIn] = useState("09:00");
  const [requestedCheckOut, setRequestedCheckOut] = useState("17:00");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const checkInISO = new Date(`${workDate}T${requestedCheckIn}:00`).toISOString();
      const checkOutISO = requestedCheckOut ? new Date(`${workDate}T${requestedCheckOut}:00`).toISOString() : undefined;

      const res = await submitCorrectionRequestAction({
        workDate,
        requestedLocation,
        requestedCheckIn: checkInISO,
        requestedCheckOut: checkOutISO,
        reason,
      });

      if (res.success) {
        setSuccessMsg("Attendance correction request submitted successfully!");
        setReason("");
      } else {
        setErrorMsg(res.error || "Failed to submit correction request.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileCheck className="h-6 w-6 text-brand-400" /> Attendance Correction Requests
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Forgot to check in/out or selected wrong location? Request an attendance adjustment here.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Form */}
        <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-cyan-400" /> Submit New Request
          </h2>

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Work Date</label>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Actual Location</label>
                <select
                  value={requestedLocation}
                  onChange={(e) => setRequestedLocation(e.target.value as any)}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="OFFICE">Office</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Requested Check-In Time</label>
                <input
                  type="time"
                  value={requestedCheckIn}
                  onChange={(e) => setRequestedCheckIn(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Requested Check-Out Time</label>
                <input
                  type="time"
                  value={requestedCheckOut}
                  onChange={(e) => setRequestedCheckOut(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Reason / Explanation</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why the attendance record needs to be corrected..."
                rows={4}
                className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-gray-900 dark:text-white bg-brand-600 hover:bg-brand-500 active:scale-[0.99] transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting Request..." : "Submit Correction Request"}
            </button>
          </form>
        </div>

        {/* Workflow Info Box */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" /> Approval Workflow
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            All submitted requests enter <span className="text-amber-400 font-semibold">PENDING</span> status and are routed to your Department Head for review and audit logging.
          </p>
          <div className="bg-gray-100 dark:bg-slate-900/80 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> PENDING — Under review by Dept Head
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> APPROVED — Attendance record updated
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-red-400" /> REJECTED — Reason attached by reviewer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
