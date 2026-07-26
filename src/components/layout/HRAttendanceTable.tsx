"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar } from "@/components/layout/Avatar";
import { DataTable } from "@/components/ui/DataTable";

interface HRAttendanceSummary {
  userId: string;
  employeeName: string;
  employeeId: string;
  email: string;
  avatarUrl: string | null;
  department: string;
  totalDaysWorked: number;
  officeDays: number;
  remoteDays: number;
  lateDays: number;
  specialDaysWorked?: number;
  totalHours: number;
  avgHoursPerDay: number;
  recordCount: number;
}

interface HRAttendanceTableProps {
  records: HRAttendanceSummary[];
}

export function HRAttendanceTable({ records }: HRAttendanceTableProps) {
  const columns: ColumnDef<HRAttendanceSummary>[] = [
    {
      id: "employee",
      header: "Employee",
      accessorFn: (row) => row.employeeName || row.email,
      cell: ({ row }) => {
        const rec = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar src={rec.avatarUrl} name={rec.employeeName} email={rec.email} className="w-7 h-7" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white leading-tight">{rec.employeeName}</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono mt-0.5">{rec.employeeId}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-gray-600 dark:text-slate-350">
          {row.original.department}
        </span>
      ),
    },
    {
      accessorKey: "totalDaysWorked",
      header: "Total Days",
      cell: ({ row }) => (
        <span className="font-bold text-gray-900 dark:text-white">
          {row.original.totalDaysWorked}
        </span>
      ),
    },
    {
      accessorKey: "officeDays",
      header: "Office Days",
      cell: ({ row }) => (
        <span className="font-bold text-brand-500 dark:text-brand-400">
          {row.original.officeDays}
        </span>
      ),
    },
    {
      accessorKey: "remoteDays",
      header: "Remote Days",
      cell: ({ row }) => (
        <span className="font-bold text-cyan-500 dark:text-cyan-400">
          {row.original.remoteDays}
        </span>
      ),
    },
    {
      accessorKey: "lateDays",
      header: "Late Arrivals",
      cell: ({ row }) => {
        const late = row.original.lateDays;
        return (
          <span className={`font-bold ${late > 0 ? "text-amber-500" : "text-gray-400 dark:text-slate-500"}`}>
            {late}
          </span>
        );
      },
    },
    {
      accessorKey: "specialDaysWorked",
      header: "Non-Working Days",
      cell: ({ row }) => {
        const special = row.original.specialDaysWorked || 0;
        return (
          <span className={`font-bold ${special > 0 ? "text-amber-500 animate-pulse" : "text-gray-400 dark:text-slate-500"}`}>
            {special}
          </span>
        );
      },
    },
    {
      accessorKey: "totalHours",
      header: "Total Hours",
      cell: ({ row }) => (
        <span className="font-mono text-gray-700 dark:text-slate-300">
          {row.original.totalHours.toFixed(1)} hrs
        </span>
      ),
    },
    {
      accessorKey: "avgHoursPerDay",
      header: "Avg Hrs/Day",
      cell: ({ row }) => (
        <span className="font-mono text-emerald-500 dark:text-emerald-400">
          {row.original.avgHoursPerDay} hrs
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      searchKey="employee"
      searchPlaceholder="Search employee name or email..."
    />
  );
}
