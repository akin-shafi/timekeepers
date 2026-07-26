import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Users, AlertTriangle, Clock, Filter, Sparkles, Building, Laptop, UserCheck, UserX } from "lucide-react";
import { DeptLiveDashboardTable } from "@/components/layout/DeptLiveDashboardTable";

export default async function DepartmentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Get department assigned to user
  const userDept = await db.departmentMembership.findFirst({
    where: { userId: user.id },
    include: { department: true },
  });

  const deptId = userDept?.departmentId;
  const isDeptHead = userDept?.isHead || false;

  // If the user is a Group Manager (not Dept Head, Admin, or HR), scope to their groups
  let allowedUserIds: string[] | undefined = undefined;
  if (user.role !== "SUPER_ADMIN" && user.role !== "HR" && !isDeptHead) {
    const managedGroups = await db.group.findMany({
      where: { managerId: user.id },
      include: {
        memberships: { select: { userId: true } },
      },
    });
    allowedUserIds = managedGroups.flatMap((g: { memberships: any[]; }) => g.memberships.map((m: { userId: any; }) => m.userId));
  }

  // Fetch department members
  const deptMemberships = await db.departmentMembership.findMany({
    where: {
      departmentId: deptId,
      ...(allowedUserIds ? { userId: { in: allowedUserIds } } : {}),
    },
    include: { user: true, department: true },
  });

  const today = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

  // Fetch today's attendance records for department members
  const todayRecords = await db.attendanceRecord.findMany({
    where: {
      organizationId: user.organizationId,
      workDate: today,
      ...(allowedUserIds ? { userId: { in: allowedUserIds } } : {}),
    },
    include: { user: true, officeLocation: true },
  });

  const recordMap = new Map(todayRecords.map((r) => [r.userId, r]));

  const totalEmployees = deptMemberships.length;
  let officeToday = 0;
  let remoteToday = 0;
  let checkedInCount = 0;
  let lateCount = 0;

  todayRecords.forEach((r) => {
    checkedInCount++;
    if (r.workLocation === "OFFICE") officeToday++;
    if (r.workLocation === "REMOTE") remoteToday++;
    if (r.isLate) lateCount++;
  });

  const notCheckedIn = Math.max(0, totalEmployees - checkedInCount);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Department Head Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            {userDept?.department?.name || "Engineering"} Department Daily Attendance
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Real-time attendance monitor and team check-ins</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
            {totalEmployees} Team Members
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-brand-400" /> Total Staff
          </p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{totalEmployees}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <Building className="h-3.5 w-3.5 text-brand-400" /> Office Today
          </p>
          <p className="text-2xl font-extrabold text-brand-400 mt-1">{officeToday}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <Laptop className="h-3.5 w-3.5 text-cyan-400" /> Remote Today
          </p>
          <p className="text-2xl font-extrabold text-cyan-400 mt-1">{remoteToday}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" /> Checked In
          </p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{checkedInCount}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <UserX className="h-3.5 w-3.5 text-amber-400" /> Not Checked In
          </p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{notCheckedIn}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Late Arrivals
          </p>
          <p className="text-2xl font-extrabold text-red-400 mt-1">{lateCount}</p>
        </div>
      </div>

      {/* Daily Attendance Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" /> Today's Team Attendance Matrix
          </h2>

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
            <Filter className="h-4 w-4" />
            <span>Showing real-time status</span>
          </div>
        </div>

        <DeptLiveDashboardTable deptMemberships={deptMemberships} recordsData={Array.from(recordMap.entries())} />
      </div>
    </div>
  );
}
