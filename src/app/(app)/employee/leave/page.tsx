import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { CalendarDays, Clock, FileCheck } from "lucide-react";
import LeaveRequestForm from "./LeaveRequestForm";

export default async function EmployeeLeavePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const leaves = await db.leaveRecord.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { reviewer: true },
  });

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-purple-400" /> Leave Requests
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Submit new time-off requests and track the status of your past leaves.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <LeaveRequestForm />
          
          <div className="glass-panel rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-slate-800 font-bold text-gray-900 dark:text-white">
              My Leave History
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
                <thead className="bg-gray-100 dark:bg-slate-900/80 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Leave Type</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Days</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                        No leave requests found.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{l.leaveType}</td>
                        <td className="px-6 py-4 font-mono">
                          {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">{l.daysCount}</td>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Workflow Info Box */}
        <div className="glass-card p-6 rounded-3xl space-y-4 h-fit">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-400" /> Approval Workflow
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            All submitted requests enter <span className="text-amber-400 font-semibold">PENDING</span> status and are routed to HR for review.
          </p>
          <div className="bg-gray-100 dark:bg-slate-900/80 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> PENDING — Under HR review
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> APPROVED — Leave granted
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-red-400" /> REJECTED — Request denied
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
