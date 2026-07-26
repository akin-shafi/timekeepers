import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { getHRCorrectionRequestsAction, reviewHRCorrectionAction } from "@/lib/actions/hr.actions";
import { CorrectionStatus } from "@prisma/client";
import { FileCheck, CheckCircle2, XCircle, Clock, Filter, MessageSquare } from "lucide-react";

export default async function HRCorrectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; departmentId?: string }>;
}) {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const params = await searchParams;
  const corrections = await getHRCorrectionRequestsAction(params);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <FileCheck className="h-3.5 w-3.5 text-emerald-400" /> Attendance Approvals
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Attendance Correction Requests</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">HR review and final approval workflow for employee attendance corrections</p>
        </div>
      </div>

      {/* Corrections List */}
      <div className="space-y-4">
        {corrections.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-3xl border border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-500">
            No correction requests requiring review.
          </div>
        ) : (
          corrections.map((c) => (
            <div key={c.id} className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{c.employeeName}</h3>
                    <span className="text-xs text-gray-500 dark:text-slate-400">({c.department})</span>
                    <span className="font-mono text-cyan-300 text-xs">{c.employeeId}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Requested Date:{" "}
                    <strong className="text-gray-700 dark:text-slate-200">
                      {new Date(c.workDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      c.status === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : c.status === "REJECTED"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    STATUS: {c.status}
                  </span>
                </div>
              </div>

              {/* Request Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
                <div>
                  <p className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                    Employee Reason & Justification
                  </p>
                  <p className="text-gray-700 dark:text-slate-200 italic">{c.reason}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                    Requested Adjustments
                  </p>
                  <p className="text-gray-700 dark:text-slate-200 font-mono">
                    Location: <strong className="text-purple-300">{c.requestedLocation}</strong>
                  </p>
                  <p className="text-gray-700 dark:text-slate-200 font-mono">
                    Check-In:{" "}
                    <strong className="text-emerald-400">
                      {new Date(c.requestedCheckIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </strong>
                  </p>
                  <p className="text-gray-700 dark:text-slate-200 font-mono">
                    Check-Out:{" "}
                    <strong className="text-amber-400">
                      {c.requestedCheckOut
                        ? new Date(c.requestedCheckOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "N/A"}
                    </strong>
                  </p>
                </div>
              </div>

              {/* HR Review Action */}
              {c.status === "PENDING" ? (
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    const actionType = formData.get("actionType") as string;
                    const hrNotes = formData.get("hrNotes") as string;
                    const targetStatus = actionType === "APPROVE" ? CorrectionStatus.APPROVED : CorrectionStatus.REJECTED;
                    await reviewHRCorrectionAction({ correctionId: c.id, status: targetStatus, hrNotes });
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2"
                >
                  <input
                    type="text"
                    name="hrNotes"
                    placeholder="Add HR reviewer notes..."
                    className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-slate-200 outline-none flex-1 max-w-md"
                  />

                  <button
                    type="submit"
                    name="actionType"
                    value="APPROVE"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve Correction
                  </button>

                  <button
                    type="submit"
                    name="actionType"
                    value="REJECT"
                    className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-gray-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </form>
              ) : (
                <div className="text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                  <span>Reviewed by HR ({c.reviewerName || "HR Admin"})</span>
                  <span className="italic">{c.hrNotes ? `Notes: "${c.hrNotes}"` : "No notes provided"}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
