import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Clock, Building, Laptop, ShieldCheck } from "lucide-react";

export default async function AdminAttendancePage() {
  const admin = await getCurrentUser();
  if (!admin) return null;

  const records = await db.attendanceRecord.findMany({
    where: { organizationId: admin.organizationId },
    include: {
      user: true,
      department: true,
      officeLocation: true,
    },
    orderBy: { workDate: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="h-6 w-6 text-purple-400" /> Organization Attendance Records
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Audit log of all employee check-in and check-out events</p>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-100 dark:bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Work Date</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Check-In</th>
                <th className="px-6 py-4">Check-Out</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
              {records.map((r, index) => (
                <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 font-mono w-12">{index + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    {r.user.name || r.user.email}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 dark:text-slate-300">
                    {r.department?.name || "General"}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-slate-300">
                    {new Date(r.workDate).toISOString().split("T")[0]}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                      r.workLocation === "OFFICE"
                        ? "bg-brand-500/10 text-brand-300 border border-brand-500/20"
                        : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                    }`}>
                      {r.workLocation === "OFFICE" ? <Building className="h-3 w-3" /> : <Laptop className="h-3 w-3" />}
                      {r.workLocation}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-slate-300">
                    {new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-slate-300">
                    {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-emerald-400">
                    {r.verificationStatus}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
