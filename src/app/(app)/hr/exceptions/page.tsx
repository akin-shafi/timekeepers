import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { getHRAttendanceExceptionsAction, resolveAttendanceExceptionAction } from "@/lib/actions/hr.actions";
import { AlertTriangle, CheckCircle2, XCircle, Clock, Filter, MessageSquare, Download } from "lucide-react";

export default async function HRAttendanceExceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const params = await searchParams;
  const exceptions = await getHRAttendanceExceptionsAction(params);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Attendance Risk & Compliance
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Attendance Exceptions</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Automated detection of attendance anomalies, missed check-ins, and policy deviations</p>
        </div>

        <a
          href={`/api/hr/export/exceptions?${new URLSearchParams(params as Record<string, string>).toString()}`}
          download="attendance_exceptions.csv"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-900 dark:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30 whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <Download className="h-4 w-4" /> Export Report
        </a>
      </div>

      {/* Exceptions Table */}
      <div className="glass-panel rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-100 dark:bg-slate-900/80 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Exception Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions / Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
              {exceptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                    No active attendance exceptions recorded.
                  </td>
                </tr>
              ) : (
                exceptions.map((ex, index) => (
                  <tr key={ex.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 font-mono w-12">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{ex.employeeName}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{ex.department}</td>
                    <td className="px-6 py-4 font-mono">
                      {new Date(ex.workDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {ex.exceptionType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300 max-w-xs">{ex.description}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ex.status === "RESOLVED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : ex.status === "DISMISSED"
                            ? "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {ex.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ex.status === "OPEN" || ex.status === "UNDER_REVIEW" ? (
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            const status = formData.get("status") as string;
                            const hrComments = formData.get("hrComments") as string;
                            await resolveAttendanceExceptionAction({ exceptionId: ex.id, status, hrComments });
                          }}
                          className="flex items-center justify-end gap-2"
                        >
                          <input
                            type="text"
                            name="hrComments"
                            placeholder="Add HR comment..."
                            className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-gray-700 dark:text-slate-200 outline-none w-36"
                          />
                          <button
                            type="submit"
                            name="status"
                            value="RESOLVED"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-gray-900 dark:text-white text-[11px] font-semibold transition-all"
                          >
                            Resolve
                          </button>
                          <button
                            type="submit"
                            name="status"
                            value="DISMISSED"
                            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-[11px] font-semibold transition-all"
                          >
                            Dismiss
                          </button>
                        </form>
                      ) : (
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">
                          {ex.resolvedBy ? `By ${ex.resolvedBy}` : "Completed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
