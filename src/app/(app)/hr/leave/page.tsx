import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { LeaveStatus } from "@prisma/client";
import {
  getHRLeaveRequestsAction,
  createLeaveRequestAction,
  reviewLeaveRequestAction,
  getHREmployeesAction,
} from "@/lib/actions/hr.actions";
import { CalendarDays, Plus, CheckCircle2, XCircle, Clock, Filter, User, Download } from "lucide-react";

export default async function HRLeaveManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; departmentId?: string; leaveType?: string }>;
}) {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const params = await searchParams;
  const leaves = await getHRLeaveRequestsAction(params);
  const employees = await getHREmployeesAction();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <CalendarDays className="h-3.5 w-3.5 text-purple-400" /> Leave Operations
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Leave Management</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Organisation-wide leave records, approvals, and attendance integration</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* Modal Toggle Form for HR to Grant/Create Leave */}
          <form
            action={async (formData: FormData) => {
              "use server";
              const userId = formData.get("userId") as string;
              const startDate = formData.get("startDate") as string;
              const endDate = formData.get("endDate") as string;
              const leaveType = formData.get("leaveType") as string;
              const reason = formData.get("reason") as string;

              await createLeaveRequestAction({
                userId,
                startDate,
                endDate,
                leaveType,
                reason,
              });
            }}
            className="glass-card p-4 rounded-2xl border border-gray-300 dark:border-slate-700 flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto"
          >
            <span className="font-bold text-purple-300">Grant Leave:</span>

            <select name="userId" required className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-gray-700 dark:text-slate-200 outline-none">
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.department})
                </option>
              ))}
            </select>

            <select name="leaveType" required className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-gray-700 dark:text-slate-200 outline-none">
              <option value="Annual">Annual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Casual">Casual Leave</option>
              <option value="Maternity">Maternity</option>
              <option value="Paternity">Paternity</option>
              <option value="Unpaid">Unpaid</option>
            </select>

            <input type="date" name="startDate" required className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-2 py-1 text-gray-700 dark:text-slate-200" />
            <input type="date" name="endDate" required className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-2 py-1 text-gray-700 dark:text-slate-200" />
            <input type="text" name="reason" placeholder="Reason..." className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-2 py-1 text-gray-700 dark:text-slate-200 w-28" />

            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-gray-900 dark:text-white font-semibold flex items-center gap-1 transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Submit
            </button>
          </form>

          <a
            href={`/api/hr/export/leave?${new URLSearchParams(params as Record<string, string>).toString()}`}
            download="leave_requests.csv"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-900 dark:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30 whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <Download className="h-4 w-4" /> Export Report
          </a>
        </div>
      </div>

      {/* Leave Table */}
      <div className="glass-panel rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-100 dark:bg-slate-900/80 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Leave Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                leaves.map((l, index) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 font-mono w-12">{index + 1}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{l.employeeName}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">{l.employeeId}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{l.department}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {l.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {new Date(l.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                      {new Date(l.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-slate-200">{l.daysCount} days</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300 max-w-xs">{l.reason || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : l.status === "REJECTED"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {l.status === "PENDING" ? (
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            const status = formData.get("status") as LeaveStatus;
                            await reviewLeaveRequestAction({ leaveId: l.id, status });
                          }}
                          className="flex items-center justify-end gap-2"
                        >
                          <button
                            type="submit"
                            name="status"
                            value="APPROVED"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-gray-900 dark:text-white font-semibold text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            type="submit"
                            name="status"
                            value="REJECTED"
                            className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-gray-900 dark:text-white font-semibold text-[11px]"
                          >
                            Reject
                          </button>
                        </form>
                      ) : (
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">
                          {l.reviewerName ? `By ${l.reviewerName}` : "Processed"}
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
