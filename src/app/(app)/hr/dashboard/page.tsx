import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { getHRDashboardMetricsAction } from "@/lib/actions/hr.actions";
import { db } from "@/lib/db";
import {
  Users,
  Building,
  Laptop,
  Clock,
  CalendarDays,
  UserX,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Filter,
} from "lucide-react";

export default async function HRDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string; period?: string; workLocation?: string }>;
}) {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const params = await searchParams;
  const metrics = await getHRDashboardMetricsAction({
    departmentId: params.departmentId,
    workLocation: params.workLocation,
  });

  const departments = await db.department.findMany({
    where: { organizationId: hrUser.organizationId },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Human Resources Management Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">HR Workforce Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Organisation-wide employee attendance, compliance, and work arrangement metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 px-3 py-2 rounded-xl text-xs">
              <Filter className="h-3.5 w-3.5 text-gray-400 dark:text-slate-400" />
              <select
                name="departmentId"
                defaultValue={params.departmentId || ""}
                className="bg-transparent text-gray-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              name="workLocation"
              defaultValue={params.workLocation || ""}
              className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 px-3 py-2 rounded-xl text-xs text-gray-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900">All Locations</option>
              <option value="OFFICE" className="bg-white dark:bg-slate-900">Office</option>
              <option value="REMOTE" className="bg-white dark:bg-slate-900">Remote</option>
            </select>

            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" /> Total Employees
          </p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{metrics.totalEmployees}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">{metrics.activeEmployees} active workforce</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Present Today
          </p>
          <p className="text-3xl font-extrabold text-emerald-500 dark:text-emerald-400">{metrics.presentToday}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Checked in today</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" /> Working from Office
          </p>
          <p className="text-3xl font-extrabold text-brand-500 dark:text-brand-400">{metrics.workingFromOffice}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Geofence verified</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Laptop className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" /> Working Remotely
          </p>
          <p className="text-3xl font-extrabold text-cyan-500 dark:text-cyan-400">{metrics.workingRemotely}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Approved remote</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> Not Checked In
          </p>
          <p className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">{metrics.notCheckedIn}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Pending check-in</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <UserX className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" /> Absent Today
          </p>
          <p className="text-3xl font-extrabold text-rose-500 dark:text-rose-400">{metrics.absent}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">No record & no leave</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" /> On Leave
          </p>
          <p className="text-3xl font-extrabold text-purple-500 dark:text-purple-400">{metrics.onLeave}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Approved leave</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> Late Employees
          </p>
          <p className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">{metrics.late}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Past grace period</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Attendance Compliance
          </p>
          <p className="text-3xl font-extrabold text-emerald-500 dark:text-emerald-400">{metrics.attendanceRate}%</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Overall workforce rate</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" /> Office Compliance
          </p>
          <p className="text-3xl font-extrabold text-brand-500 dark:text-brand-400">{metrics.officeComplianceRate}%</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Target hybrid requirement</p>
        </div>
      </div>

      {/* Example Visual Widget */}
      <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500 dark:text-emerald-400" /> Workforce Status Summary
          </h2>
          <span className="text-xs text-gray-500 dark:text-slate-400">Real-time Organisation Breakdown</span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-slate-900 rounded-full h-4 overflow-hidden flex border border-gray-300 dark:border-slate-800">
          <div
            style={{ width: `${(metrics.workingFromOffice / Math.max(1, metrics.totalEmployees)) * 100}%` }}
            className="bg-brand-500 h-full title='Office'"
          />
          <div
            style={{ width: `${(metrics.workingRemotely / Math.max(1, metrics.totalEmployees)) * 100}%` }}
            className="bg-cyan-500 h-full title='Remote'"
          />
          <div
            style={{ width: `${(metrics.onLeave / Math.max(1, metrics.totalEmployees)) * 100}%` }}
            className="bg-purple-500 h-full title='On Leave'"
          />
          <div
            style={{ width: `${(metrics.absent / Math.max(1, metrics.totalEmployees)) * 100}%` }}
            className="bg-rose-500 h-full title='Absent'"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 dark:text-slate-400 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-500" />
            <span>Office ({metrics.workingFromOffice})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500" />
            <span>Remote ({metrics.workingRemotely})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span>On Leave ({metrics.onLeave})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>Absent ({metrics.absent})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
