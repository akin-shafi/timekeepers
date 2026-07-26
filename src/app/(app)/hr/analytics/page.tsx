import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { getHRDashboardMetricsAction, getHRDepartmentsOverviewAction } from "@/lib/actions/hr.actions";
import { BarChart3, TrendingUp, Users, Building, Laptop, CalendarDays, ShieldCheck } from "lucide-react";

export default async function HRAnalyticsPage() {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const metrics = await getHRDashboardMetricsAction();
  const departments = await getHRDepartmentsOverviewAction();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-400" /> Executive Workforce Intelligence
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">HR Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Organisation-wide trends, compliance distribution, and absenteeism metrics</p>
        </div>
      </div>

      {/* Top Visual Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Office vs Remote Trend */}
        <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Laptop className="h-4 w-4 text-cyan-400" /> Work Location Distribution
            </h3>
            <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">Today</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-slate-300">Office Attendance ({metrics.workingFromOffice})</span>
                <span className="text-brand-400 font-bold">
                  {Math.round((metrics.workingFromOffice / Math.max(1, metrics.activeEmployees)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-900 h-3 rounded-full overflow-hidden border border-gray-200 dark:border-slate-800">
                <div
                  style={{
                    width: `${Math.round((metrics.workingFromOffice / Math.max(1, metrics.activeEmployees)) * 100)}%`,
                  }}
                  className="bg-brand-500 h-full rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-slate-300">Remote Attendance ({metrics.workingRemotely})</span>
                <span className="text-cyan-400 font-bold">
                  {Math.round((metrics.workingRemotely / Math.max(1, metrics.activeEmployees)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-900 h-3 rounded-full overflow-hidden border border-gray-200 dark:border-slate-800">
                <div
                  style={{
                    width: `${Math.round((metrics.workingRemotely / Math.max(1, metrics.activeEmployees)) * 100)}%`,
                  }}
                  className="bg-cyan-500 h-full rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-slate-300">On Approved Leave ({metrics.onLeave})</span>
                <span className="text-purple-400 font-bold">
                  {Math.round((metrics.onLeave / Math.max(1, metrics.activeEmployees)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-900 h-3 rounded-full overflow-hidden border border-gray-200 dark:border-slate-800">
                <div
                  style={{
                    width: `${Math.round((metrics.onLeave / Math.max(1, metrics.activeEmployees)) * 100)}%`,
                  }}
                  className="bg-purple-500 h-full rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Department Compliance Comparison */}
        <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="h-4 w-4 text-amber-400" /> Department Compliance Comparison
            </h3>
            <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">By Dept</span>
          </div>

          <div className="space-y-3 pt-2">
            {departments.map((d) => (
              <div key={d.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-slate-300">{d.name} ({d.totalMembers} members)</span>
                  <span className="text-emerald-400 font-bold">{d.complianceRate}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-gray-200 dark:border-slate-800">
                  <div
                    style={{ width: `${d.complianceRate}%` }}
                    className="bg-emerald-500 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
