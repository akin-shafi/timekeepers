import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { getHRAttendanceRecordsAction } from "@/lib/actions/hr.actions";
import { db } from "@/lib/db";
import { Clock, Filter, Download } from "lucide-react";
import { HRAttendanceTable } from "@/components/layout/HRAttendanceTable";

export default async function HRAttendanceMonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    workLocation?: string;
    status?: string;
  }>;
}) {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const params = await searchParams;

  // Default the date range to the current calendar month when HR hasn't chosen one.
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toISODate = (d: Date) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD, local

  const startDate = params.startDate || toISODate(firstOfMonth);
  const endDate = params.endDate || toISODate(lastOfMonth);

  const effectiveParams = { ...params, startDate, endDate };
  const records = await getHRAttendanceRecordsAction(effectiveParams);

  const departments = await db.department.findMany({
    where: { organizationId: hrUser.organizationId },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5 text-emerald-400" /> Attendance Operations
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Organisation-Wide Attendance Log</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Real-time cross-departmental attendance and check-in logs</p>
        </div>

        <a
          href={`/api/hr/export/attendance?${new URLSearchParams(effectiveParams as Record<string, string>).toString()}`}
          download="hr_attendance_log.csv"
          className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 border border-gray-300 dark:border-slate-700 transition-all"
        >
          <Download className="h-4 w-4 text-emerald-400" /> Export CSV
        </a>
      </div>

      {/* Multi-Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
        <form className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" />
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Filters:</span>
          </div>

          <select
            name="departmentId"
            defaultValue={params.departmentId || ""}
            className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-slate-200 outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            name="workLocation"
            defaultValue={params.workLocation || ""}
            className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-slate-200 outline-none"
          >
            <option value="">All Locations</option>
            <option value="OFFICE">Office</option>
            <option value="REMOTE">Remote</option>
          </select>

          <input
            type="date"
            name="startDate"
            defaultValue={startDate}
            className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 outline-none"
          />

          <input
            type="date"
            name="endDate"
            defaultValue={endDate}
            className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 outline-none"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-900 dark:text-white text-xs font-semibold transition-all"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Attendance Table */}
      <HRAttendanceTable records={records} />
    </div>
  );
}
