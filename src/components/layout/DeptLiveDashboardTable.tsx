"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar } from "@/components/layout/Avatar";
import { DataTable } from "@/components/ui/DataTable";

interface MemberRecord {
  id: string;
  userId: string;
  department: { name: string };
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface AttendanceRecord {
  id: string;
  workLocation: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  status: string;
}

interface DeptLiveDashboardTableProps {
  deptMemberships: MemberRecord[];
  recordsData: Array<[string, AttendanceRecord]>;
}

export function DeptLiveDashboardTable({
  deptMemberships,
  recordsData,
}: DeptLiveDashboardTableProps) {
  // Convert serializable list back to Map
  const recordMap = new Map<string, AttendanceRecord>(recordsData);

  const columns: ColumnDef<MemberRecord>[] = [
    {
      id: "employee",
      header: "Employee",
      accessorFn: (row) => row.user.name || row.user.email,
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar src={m.user.avatarUrl} name={m.user.name} email={m.user.email} className="h-9 w-9" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                {m.user.name || m.user.email}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{m.user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "department",
      header: "Department",
      accessorFn: (row) => row.department.name,
      cell: ({ row }) => (
        <span className="text-xs font-medium text-gray-600 dark:text-slate-300">
          {row.original.department.name}
        </span>
      ),
    },
    {
      id: "workLocation",
      header: "Work Location",
      cell: ({ row }) => {
        const record = recordMap.get(row.original.userId);
        if (!record) return <span className="text-gray-400 dark:text-slate-500">--</span>;
        const loc = record.workLocation;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              loc === "OFFICE"
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-300 border-brand-500/30"
                : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/30"
            }`}
          >
            {loc}
          </span>
        );
      },
    },
    {
      id: "checkInTime",
      header: "Check-In Time",
      cell: ({ row }) => {
        const record = recordMap.get(row.original.userId);
        if (!record) return <span className="font-mono text-gray-400 dark:text-slate-500">--:--</span>;
        return (
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            {new Date(record.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        );
      },
    },
    {
      id: "checkOutTime",
      header: "Check-Out Time",
      cell: ({ row }) => {
        const record = recordMap.get(row.original.userId);
        if (!record || !record.checkOutTime) {
          return <span className="font-mono text-gray-400 dark:text-slate-500">--:--</span>;
        }
        return (
          <span className="font-mono text-amber-600 dark:text-amber-450">
            {new Date(record.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const record = recordMap.get(row.original.userId);
        if (!record) {
          return (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-150 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-transparent">
              ABSENT
            </span>
          );
        }
        return (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
              record.status === "APPROVED"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : record.status === "REJECTED"
                ? "bg-red-500/15 text-red-500 border-red-500/30"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
            }`}
          >
            {record.status}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={deptMemberships}
      searchKey="employee"
      searchPlaceholder="Search employee name or email..."
    />
  );
}
