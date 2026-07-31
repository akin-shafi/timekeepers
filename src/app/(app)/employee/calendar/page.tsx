import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import Link from "next/link";
import { Calendar as CalendarIcon, Building, Laptop, CheckCircle, AlertCircle } from "lucide-react";

export default async function EmployeeCalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const now = new Date();
  
  const currentYear = params.year ? parseInt(params.year) : now.getFullYear();
  const currentMonth = params.month ? parseInt(params.month) - 1 : now.getMonth();

  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
  
  const startOfMonthUTC = new Date(Date.UTC(currentYear, currentMonth, 1));
  const endOfMonthUTC = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
  
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);

  const records = await db.attendanceRecord.findMany({
    where: {
      userId: user.id,
      workDate: {
        gte: startOfMonthUTC,
        lte: endOfMonthUTC,
      },
    },
  });

  const leaves = await db.leaveRecord.findMany({
    where: {
      userId: user.id,
      status: "APPROVED",
      startDate: { lte: endOfMonthUTC },
      endDate: { gte: startOfMonthUTC }
    }
  });

  const exceptions = await db.attendanceException.findMany({
    where: {
      userId: user.id,
      workDate: {
        gte: startOfMonthUTC,
        lte: endOfMonthUTC,
      },
    },
  });

  const formatDateLocal = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const recordMap = new Map();
  records.forEach((r) => {
    const key = r.workDate.toISOString().split("T")[0];
    recordMap.set(key, r);
  });

  const leaveMap = new Map();
  leaves.forEach((l) => {
    let curr = new Date(l.startDate);
    const end = new Date(l.endDate);
    while (curr <= end) {
      if (curr >= startOfMonthUTC && curr <= endOfMonthUTC) {
        leaveMap.set(curr.toISOString().split("T")[0], l);
      }
      curr.setDate(curr.getDate() + 1);
    }
  });

  const exceptionMap = new Map();
  exceptions.forEach((e) => {
    const key = e.workDate.toISOString().split("T")[0];
    if (!exceptionMap.has(key)) {
      exceptionMap.set(key, []);
    }
    exceptionMap.get(key).push(e);
  });

  const daysInMonth = endOfMonth.getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(currentYear, currentMonth, dayNum);
    const dateStr = formatDateLocal(dateObj);
    const dayOfWeek = dateObj.getDay();
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const record = recordMap.get(dateStr);
    const leave = leaveMap.get(dateStr);
    const dayExceptions = exceptionMap.get(dateStr) || [];
    return { dayNum, dayName, dateStr, isWeekend, record, leave, exceptions: dayExceptions };
  });

  const monthName = startOfMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-brand-400" /> Attendance Calendar
          </h1>
          <div className="flex items-center gap-4 mt-3">
            <Link 
              href={`/employee/calendar?month=${prevMonthDate.getMonth() + 1}&year=${prevMonthDate.getFullYear()}`}
              className="text-xs font-semibold px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-slate-300"
            >
              &larr; Prev
            </Link>
            <p className="text-sm font-bold text-gray-700 dark:text-slate-200 min-w-[120px] text-center">{monthName}</p>
            <Link 
              href={`/employee/calendar?month=${nextMonthDate.getMonth() + 1}&year=${nextMonthDate.getFullYear()}`}
              className="text-xs font-semibold px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-slate-300"
            >
              Next &rarr;
            </Link>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-100 dark:bg-slate-900/80 p-3 rounded-2xl border border-gray-200 dark:border-slate-800">
          <span className="flex items-center gap-1.5 text-brand-300 font-medium">
            <span className="h-3 w-3 rounded-full bg-brand-500" /> Office Day
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
            <span className="h-3 w-3 rounded-full bg-cyan-400" /> Remote Day
          </span>
          <span className="flex items-center gap-1.5 text-purple-300 font-medium">
            <span className="h-3 w-3 rounded-full bg-purple-500" /> On Leave
          </span>
          <span className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 font-medium">
            <span className="h-3 w-3 rounded-full bg-slate-700" /> Off / Weekend
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {calendarDays.map((item) => (
          <div
            key={item.dayNum}
            className={`p-4 rounded-2xl border min-h-[90px] flex flex-col justify-between transition-all ${
              item.leave
                ? "bg-purple-950/40 border-purple-500/30 text-gray-900 dark:text-white"
                : item.record?.workLocation === "OFFICE"
                ? "bg-brand-950/40 border-brand-500/30 text-gray-900 dark:text-white"
                : item.record?.workLocation === "REMOTE"
                ? "bg-cyan-950/40 border-cyan-500/30 text-gray-900 dark:text-white"
                : item.isWeekend
                ? "bg-slate-900/40 border-slate-800/50 text-slate-600 opacity-60"
                : "bg-gray-100 dark:bg-slate-900/80 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-sm">{item.dayNum}</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium uppercase">{item.dayName}</span>
              </div>
              {item.leave ? (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  LEAVE
                </span>
              ) : item.record ? (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700">
                  {item.record.workLocation}
                </span>
              ) : null}
            </div>

            {item.leave ? (
              <span className="text-[10px] text-purple-400 font-medium italic mt-2 block">{item.leave.leaveType}</span>
            ) : item.record ? (
              <div className="mt-2 text-[11px] font-mono text-gray-600 dark:text-slate-300 flex items-center justify-between">
                <span>{new Date(item.record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-emerald-400 font-bold">✓</span>
              </div>
            ) : item.isWeekend ? (
              <span className="text-[10px] text-slate-600 font-medium italic">Weekend</span>
            ) : (
              <span className="text-[10px] text-gray-400 dark:text-slate-500">Not checked in</span>
            )}
            
            {/* Exceptions rendering below everything else */}
            {item.exceptions && item.exceptions.length > 0 && (
              <div className="mt-1.5 flex flex-col gap-1">
                {item.exceptions.map((ex: any) => (
                  <div key={ex.id} className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50" title={ex.description}>
                    <AlertCircle className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="truncate uppercase tracking-wider">{ex.exceptionType.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
