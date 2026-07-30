import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { LeaveStatus } from "@prisma/client";
import { getDeptLeaveRequestsAction, reviewDeptLeaveRequestAction } from "@/lib/actions/dept.actions";
import { CalendarDays } from "lucide-react";

export default async function DeptLeaveManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const leaves = await getDeptLeaveRequestsAction(params);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
          <CalendarDays className="h-3.5 w-3.5 text-amber-500" /> Department Leave Review
        </span>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Leave Management</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Review and manage leave requests from members of your department.
        </p>
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
                    No leave requests found for your department.
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
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
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
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold \${
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
                            const status = formData.get("status") as "APPROVED" | "REJECTED" | "CANCELLED";
                            await reviewDeptLeaveRequestAction({ leaveId: l.id, status });
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
                          {l.reviewerName ? `By \${l.reviewerName}` : "Processed"}
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
