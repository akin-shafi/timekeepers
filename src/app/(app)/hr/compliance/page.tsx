import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { getHRComplianceMetricsAction } from "@/lib/actions/hr.actions";
import { db } from "@/lib/db";
import { ShieldCheck, Filter, TrendingUp, CheckCircle, AlertTriangle, Download } from "lucide-react";

export default async function HRAttendanceCompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string; month?: string; year?: string }>;
}) {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const params = await searchParams;
  
  const selectedMonth = params.month ? Number(params.month) : new Date().getMonth() + 1;
  const selectedYear = params.year ? Number(params.year) : new Date().getFullYear();

  const metrics = await getHRComplianceMetricsAction({
    departmentId: params.departmentId,
    month: selectedMonth,
    year: selectedYear,
  });

  const departments = await db.department.findMany({
    where: { organizationId: hrUser.organizationId },
    select: { id: true, name: true },
  });

  const compliantCount = metrics.filter((m) => m.isCompliant).length;
  const nonCompliantCount = metrics.length - compliantCount;
  const avgCompliance = metrics.length > 0 ? Math.round(metrics.reduce((acc, m) => acc + m.compliancePercent, 0) / metrics.length) : 100;

  const currentMonthName = new Date(2000, selectedMonth - 1).toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Hybrid Work Policy Auditing
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Office Attendance Compliance</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Automated business rule compliance tracking per employee for {currentMonthName} {selectedYear}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-slate-900/80 px-4 py-2 rounded-2xl border border-gray-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Avg Compliance</p>
            <p className="text-lg font-extrabold text-emerald-400">{avgCompliance}%</p>
          </div>
          <div className="bg-gray-100 dark:bg-slate-900/80 px-4 py-2 rounded-2xl border border-gray-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Compliant</p>
            <p className="text-lg font-extrabold text-emerald-400">{compliantCount}</p>
          </div>
          <div className="bg-gray-100 dark:bg-slate-900/80 px-4 py-2 rounded-2xl border border-gray-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Below Target</p>
            <p className="text-lg font-extrabold text-rose-400">{nonCompliantCount}</p>
          </div>

          <a
            href={`/api/hr/export/compliance?${new URLSearchParams(params as Record<string, string>).toString()}`}
            download="compliance_report.csv"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-900 dark:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30"
          >
            <Download className="h-4 w-4" /> Export Report
          </a>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-3xl border border-gray-200 dark:border-slate-800">
        <form method="GET" className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
            <Filter className="h-4 w-4" /> Filters
          </div>

          <div className="flex items-center gap-2">
            <select
              name="departmentId"
              defaultValue={params.departmentId || ""}
              className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/85 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 outline-none focus:border-brand-500 transition-colors"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              name="month"
              defaultValue={String(selectedMonth)}
              className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/85 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 outline-none focus:border-brand-500 transition-colors"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                return (
                  <option key={m} value={String(m)}>
                    {new Date(2000, i).toLocaleString("default", { month: "long" })}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              name="year"
              defaultValue={String(selectedYear)}
              className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/85 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 outline-none focus:border-brand-500 transition-colors"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm ml-auto active:scale-[0.98]"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Compliance Table */}
      <div className="glass-panel rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-100 dark:bg-slate-900/80 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Work Arrangement</th>
                <th className="px-6 py-4">Required Office</th>
                <th className="px-6 py-4">Actual Office</th>
                <th className="px-6 py-4">Remote / Leave</th>
                <th className="px-6 py-4">Compliance %</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
              {metrics.map((m, index) => (
                <tr key={m.userId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 font-mono w-12">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{m.employeeName}</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">{m.employeeId}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{m.department}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {m.workArrangement}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700 dark:text-slate-200">{m.requiredOfficeDays} days</td>
                  <td className="px-6 py-4 font-bold text-brand-400">{m.actualOfficeDays} days</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                    {m.remoteDays} remote / {m.leaveDays} leave
                  </td>
                  <td className="px-6 py-4 font-extrabold text-sm">
                    <span className={m.isCompliant ? "text-emerald-400" : "text-rose-400"}>
                      {m.compliancePercent}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                        m.isCompliant
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {m.isCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
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
