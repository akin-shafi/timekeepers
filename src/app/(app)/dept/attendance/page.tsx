import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Clock, Filter, Building, Laptop, UserCheck, AlertTriangle, Download } from "lucide-react";
import { AttendanceTable } from "@/components/layout/AttendanceTable";
import { HRAttendanceTable } from "@/components/layout/HRAttendanceTable";
import { getDeptAttendanceRecordsAction } from "@/lib/actions/dept.actions";
import { DeptAttendanceFilterBar } from "@/components/layout/DeptAttendanceFilterBar";
import Link from "next/link";

export default async function DepartmentDailyLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    workLocation?: string;
    status?: string;
    tab?: string;
    quickDate?: string;
    userId?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  // Find department assigned to department head/manager
  const deptMembership = await db.departmentMembership.findFirst({
    where: { userId: user.id },
    include: { department: true },
  });

  if (!deptMembership || !deptMembership.department) {
    return (
      <div className="space-y-8">
        <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">No Department Assigned</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            You are not currently assigned to manage any department. Please contact your organization administrator.
          </p>
        </div>
      </div>
    );
  }

  const dept = deptMembership.department;
  const params = await searchParams;
  const isDeptHead = deptMembership.isHead || false;

  // If the user is a Group Manager (not Dept Head, Admin, or HR), scope to their groups
  let allowedUserIds: string[] | undefined = undefined;
  if (user.role !== "SUPER_ADMIN" && user.role !== "HR" && !isDeptHead) {
    const managedGroups = await db.group.findMany({
      where: { managerId: user.id },
      include: {
        memberships: { select: { userId: true } },
      },
    });
    allowedUserIds = managedGroups.flatMap((g) => g.memberships.map((m) => m.userId));
  }

  // Calculations for Today's Stats scoped to this Department
  const today = new Date();
  const startOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const endOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59));

  const todayRecords = await db.attendanceRecord.findMany({
    where: {
      departmentId: dept.id,
      workDate: { gte: startOfToday, lte: endOfToday },
      ...(allowedUserIds ? { userId: { in: allowedUserIds } } : {}),
    },
  });

  const activeDeptMembersCount = await db.departmentMembership.count({
    where: {
      departmentId: dept.id,
      ...(allowedUserIds ? { userId: { in: allowedUserIds } } : {}),
    },
  });

  const checkedInTodayCount = todayRecords.length;
  const officeTodayCount = todayRecords.filter((r) => r.workLocation === "OFFICE").length;
  const remoteTodayCount = todayRecords.filter((r) => r.workLocation === "REMOTE").length;
  const lateTodayCount = todayRecords.filter((r) => r.isLate).length;
  const pendingCheckinsCount = Math.max(0, activeDeptMembersCount - checkedInTodayCount);

  // Fetch department members list for filtering
  const deptMemberships = await db.departmentMembership.findMany({
    where: {
      departmentId: dept.id,
      ...(allowedUserIds ? { userId: { in: allowedUserIds } } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });
  const members = deptMemberships.map((m) => ({
    id: m.user.id,
    name: m.user.name || m.user.email,
    email: m.user.email,
  }));

  const now = new Date();
  const toISODate = (d: Date) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD, local

  const todayStr = toISODate(now);
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = toISODate(yesterday);

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  const oneWeekAgoStr = toISODate(oneWeekAgo);

  let startDateStr = "";
  let endDateStr = "";
  let quickDate = params.quickDate;

  const activeTab = params.tab === "summary" ? "summary" : "daily";

  if (activeTab === "daily") {
    if (params.startDate || params.endDate) {
      startDateStr = params.startDate || "";
      endDateStr = params.endDate || "";
      
      if (startDateStr === todayStr && endDateStr === todayStr) {
        quickDate = "today";
      } else if (startDateStr === yesterdayStr && endDateStr === yesterdayStr) {
        quickDate = "yesterday";
      } else if (startDateStr === oneWeekAgoStr && endDateStr === oneWeekAgoStr) {
        quickDate = "1week";
      } else {
        quickDate = "custom";
      }
    } else {
      if (!quickDate) {
        quickDate = "today";
      }

      if (quickDate === "today") {
        startDateStr = todayStr;
        endDateStr = todayStr;
      } else if (quickDate === "yesterday") {
        startDateStr = yesterdayStr;
        endDateStr = yesterdayStr;
      } else if (quickDate === "1week") {
        startDateStr = oneWeekAgoStr;
        endDateStr = oneWeekAgoStr;
      }
    }
  } else {
    // For summary view: default to current month
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    startDateStr = params.startDate || toISODate(firstOfMonth);
    endDateStr = params.endDate || toISODate(lastOfMonth);
  }

  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  let recordsWithExpected: any[] = [];
  let summaryRecords: any[] = [];

  if (activeTab === "summary") {
    summaryRecords = await getDeptAttendanceRecordsAction({
      startDate: startDateStr,
      endDate: endDateStr,
      workLocation: params.workLocation,
      status: params.status,
    });
  } else {
    const records = await db.attendanceRecord.findMany({
      where: {
        organizationId: user.organizationId,
        departmentId: dept.id,
        ...(params.userId ? { userId: params.userId } : {}),
        ...(allowedUserIds ? { userId: { in: allowedUserIds } } : {}),
        ...(params.workLocation ? { workLocation: params.workLocation as any } : {}),
        ...(params.status ? { status: params.status as any } : {}),
        ...((startDate || endDate)
          ? {
              workDate: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        user: true,
      },
      orderBy: { workDate: "desc" },
      take: 100,
    });

    const orgPolicy = await db.attendancePolicy.findFirst({
      where: { organizationId: user.organizationId, scope: "ORGANIZATION" },
      select: { mandatoryOfficeDays: true },
    });
    const defaultMandatoryDays = orgPolicy?.mandatoryOfficeDays || [];

    recordsWithExpected = records.map((r) => {
      const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const dayName = weekdays[r.workDate.getDay()];
      
      let expected = "REMOTE";
      if (r.user.workArrangement === "OFFICE") {
        expected = "OFFICE";
      } else if (r.user.workArrangement === "HYBRID") {
        const userDays = r.user.officeDays || [];
        const mandatoryDays = userDays.length > 0 ? userDays : defaultMandatoryDays;
        expected = mandatoryDays.includes(dayName) ? "OFFICE" : "REMOTE";
      }

      return {
        ...r,
        expectedWorkMode: expected,
      };
    });
  }

  const exportParams = new URLSearchParams({
    startDate: startDateStr,
    endDate: endDateStr,
    workLocation: params.workLocation || "",
    status: params.status || "",
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5" /> Department daily logs
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{dept.name} Attendance Log</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Real-time daily attendance logs for members of your department</p>
        </div>

        {activeTab === "summary" && (
          <a
            href={`/api/hr/export/attendance?${exportParams.toString()}`}
            download="department_attendance_report.csv"
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 border border-gray-300 dark:border-slate-700 transition-all"
          >
            <Download className="h-4 w-4 text-amber-500" /> Export CSV
          </a>
        )}
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-blue-500" /> Present Today
          </p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{checkedInTodayCount}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">{activeDeptMembersCount} active members</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-brand-500" /> Working Office
          </p>
          <p className="text-3xl font-extrabold text-brand-500">{officeTodayCount}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">HQ Victoria Island</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Laptop className="h-3.5 w-3.5 text-cyan-500" /> Working Remote
          </p>
          <p className="text-3xl font-extrabold text-cyan-500">{remoteTodayCount}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Approved arrangements</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Late Arrivals
          </p>
          <p className="text-3xl font-extrabold text-amber-500">{lateTodayCount}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Checked in late</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-450" /> Pending Check-in
          </p>
          <p className="text-3xl font-extrabold text-gray-500 dark:text-slate-450">{pendingCheckinsCount}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-550">Not yet registered</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800">
        <Link
          href={{ query: { ...params, tab: "daily" } }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "daily"
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-gray-550 hover:text-gray-700 dark:text-slate-450 dark:hover:text-slate-200"
          }`}
        >
          Daily Logs
        </Link>
        <Link
          href={{ query: { ...params, tab: "summary" } }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "summary"
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-gray-550 hover:text-gray-700 dark:text-slate-450 dark:hover:text-slate-200"
          }`}
        >
          Monthly Summary
        </Link>
      </div>

      {/* Filter Bar */}
      {activeTab === "daily" ? (
        <DeptAttendanceFilterBar
          currentQuickDate={quickDate || "today"}
          currentStartDate={params.startDate || ""}
          currentEndDate={params.endDate || ""}
          currentWorkLocation={params.workLocation || ""}
          currentStatus={params.status || ""}
          currentUserId={params.userId || ""}
          members={members}
          activeTab={activeTab}
        />
      ) : (
        <div className="glass-card p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
          <form className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="tab" value={activeTab} />
            
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" />
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Filters:</span>
            </div>

            <select
              name="workLocation"
              defaultValue={params.workLocation || ""}
              className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-slate-200 outline-none"
            >
              <option value="">All Locations</option>
              <option value="OFFICE">Office</option>
              <option value="REMOTE">Remote</option>
            </select>

            <select
              name="status"
              defaultValue={params.status || ""}
              className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-slate-200 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="WORKING">Working (Checked In)</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="LATE">Checked In Late</option>
            </select>

            <input
              type="date"
              name="startDate"
              defaultValue={startDateStr}
              className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 outline-none"
            />

            <input
              type="date"
              name="endDate"
              defaultValue={endDateStr}
              className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 outline-none"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-md shadow-amber-600/20"
            >
              Apply Filters
            </button>
          </form>
        </div>
      )}

      {/* Render selected view */}
      {activeTab === "summary" ? (
        <HRAttendanceTable records={summaryRecords} />
      ) : (
        <AttendanceTable records={recordsWithExpected as any} />
      )}
    </div>
  );
}
