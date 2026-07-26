import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Clock, Calendar, Building, Laptop, CheckCircle, AlertTriangle } from "lucide-react";

export default async function EmployeeAttendancePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const records = await db.attendanceRecord.findMany({
    where: { userId: user.id },
    orderBy: { workDate: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-brand-400" /> Attendance History
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Your recent check-in and check-out activity logs</p>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-100 dark:bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Check-In</th>
                <th className="px-6 py-4">Check-Out</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400 dark:text-slate-500">
                    No attendance records found yet.
                  </td>
                </tr>
              ) : (
                records.map((r, index) => {
                  const date = new Date(r.workDate);
                  const day = date.getDay();
                  const isWeekend = day === 0 || day === 6;
                  return (
                    <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 font-mono w-12">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-gray-755 dark:text-slate-200">
                            {date.toISOString().split("T")[0]}
                          </span>
                          {isWeekend && (
                            <span className="inline-flex items-center text-[9px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-1 rounded mt-0.5 w-fit">
                              Weekend
                            </span>
                          )}
                        </div>
                      </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        r.workLocation === "OFFICE"
                          ? "bg-brand-500/10 text-brand-300 border border-brand-500/20"
                          : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                      }`}>
                        {r.workLocation === "OFFICE" ? <Building className="h-3.5 w-3.5" /> : <Laptop className="h-3.5 w-3.5" />}
                        {r.workLocation}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-slate-300">
                      {new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-slate-300">
                      {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-slate-200">
                      {r.hoursWorked ? `${r.hoursWorked} hrs` : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="text-emerald-400 font-medium">{r.verificationStatus}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
