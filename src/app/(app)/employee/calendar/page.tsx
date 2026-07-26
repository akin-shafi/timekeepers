import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Calendar as CalendarIcon, Building, Laptop, CheckCircle, AlertCircle } from "lucide-react";

export default async function EmployeeCalendarPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const records = await db.attendanceRecord.findMany({
    where: {
      userId: user.id,
      workDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const recordMap = new Map();
  records.forEach((r) => {
    const key = new Date(r.workDate).toISOString().split("T")[0];
    recordMap.set(key, r);
  });

  const daysInMonth = endOfMonth.getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(now.getFullYear(), now.getMonth(), dayNum);
    const dateStr = dateObj.toISOString().split("T")[0];
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const record = recordMap.get(dateStr);
    return { dayNum, dateStr, isWeekend, record };
  });

  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-brand-400" /> Attendance Calendar
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Monthly breakdown for {monthName}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-100 dark:bg-slate-900/80 p-3 rounded-2xl border border-gray-200 dark:border-slate-800">
          <span className="flex items-center gap-1.5 text-brand-300 font-medium">
            <span className="h-3 w-3 rounded-full bg-brand-500" /> Office Day
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
            <span className="h-3 w-3 rounded-full bg-cyan-400" /> Remote Day
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
              item.record?.workLocation === "OFFICE"
                ? "bg-brand-950/40 border-brand-500/30 text-gray-900 dark:text-white"
                : item.record?.workLocation === "REMOTE"
                ? "bg-cyan-950/40 border-cyan-500/30 text-gray-900 dark:text-white"
                : item.isWeekend
                ? "bg-slate-900/40 border-slate-800/50 text-slate-600 opacity-60"
                : "bg-gray-100 dark:bg-slate-900/80 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm">{item.dayNum}</span>
              {item.record && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700">
                  {item.record.workLocation}
                </span>
              )}
            </div>

            {item.record ? (
              <div className="mt-2 text-[11px] font-mono text-gray-600 dark:text-slate-300 flex items-center justify-between">
                <span>{new Date(item.record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-emerald-400 font-bold">✓</span>
              </div>
            ) : item.isWeekend ? (
              <span className="text-[10px] text-slate-600 font-medium italic">Weekend</span>
            ) : (
              <span className="text-[10px] text-gray-400 dark:text-slate-500">Not checked in</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
