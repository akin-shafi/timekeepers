import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guard";
import { getHREmployeesAction } from "@/lib/actions/hr.actions";
import { db } from "@/lib/db";
import { Users, Search, Filter, UserPlus, Download } from "lucide-react";
import { InviteSection } from "@/components/layout/InviteSection";
import { HREmployeesTable } from "@/components/layout/HREmployeesTable";

export default async function HREmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    departmentId?: string;
    role?: string;
    employmentStatus?: string;
    workArrangement?: string;
  }>;
}) {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const params = await searchParams;
  const employees = await getHREmployeesAction(params);

  const departments = await db.department.findMany({
    where: { organizationId: hrUser.organizationId },
    select: { id: true, name: true },
  });

  const pendingInvitations = await db.invitation.findMany({
    where: {
      organizationId: hrUser.organizationId,
      status: "PENDING",
    },
    include: {
      department: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5 text-emerald-400" /> Workforce Directory
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Employee Directory</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Organisation-wide employee profiles and employment status</p>
        </div>

        <a
          href={`/api/hr/export/employees?${new URLSearchParams(params as Record<string, string>).toString()}`}
          download="employee_directory.csv"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-900 dark:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30 whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <Download className="h-4 w-4" /> Export Report
        </a>
      </div>

      <InviteSection departments={departments} pendingInvitations={pendingInvitations} />

      {/* Filters & Search */}
      <div className="glass-card p-4 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-wrap items-center gap-3 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <input
              type="text"
              name="search"
              placeholder="Search by name, email, or employee ID..."
              defaultValue={params.search || ""}
              className="w-full bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-700 dark:text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" />
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
              name="workArrangement"
              defaultValue={params.workArrangement || ""}
              className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-slate-200 outline-none"
            >
              <option value="">All Work Arrangements</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Fully Remote</option>
              <option value="OFFICE">Office-Based</option>
            </select>

            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-slate-700 text-gray-900 dark:text-white text-xs font-semibold transition-all"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Directory Table */}
      <HREmployeesTable employees={employees} />
    </div>
  );
}
