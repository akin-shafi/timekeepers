"use client";

import React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Building, Briefcase } from "lucide-react";
import { Avatar } from "@/components/layout/Avatar";
import { DataTable } from "@/components/ui/DataTable";

interface EmployeeRow {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  employeeId: string;
  department: string;
  jobTitle: string;
  role: string;
  workArrangement: string;
  isActive: boolean;
  currentStatus: string;
}

interface HREmployeesTableProps {
  employees: EmployeeRow[];
}

export function HREmployeesTable({ employees }: HREmployeesTableProps) {
  const columns: ColumnDef<EmployeeRow>[] = [
    {
      id: "employee",
      header: "Employee",
      accessorFn: (row) => row.name || row.email,
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar src={emp.avatarUrl} name={emp.name} email={emp.email} className="w-8 h-8" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white leading-tight">{emp.name}</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{emp.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "employeeId",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-cyan-300 text-[11px]">{row.original.employeeId}</span>
      ),
    },
    {
      id: "dept_role",
      header: "Department & Role",
      accessorFn: (row) => `${row.department} ${row.jobTitle} ${row.role}`,
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="space-y-0.5">
            <p className="font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1">
              <Building className="h-3 w-3 text-gray-500 dark:text-slate-400" /> {emp.department}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              {emp.jobTitle} • ({emp.role})
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "workArrangement",
      header: "Work Arrangement",
      cell: ({ row }) => {
        const arr = row.original.workArrangement;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              arr === "REMOTE"
                ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                : arr === "OFFICE"
                ? "bg-brand-500/10 text-brand-300 border-brand-500/30"
                : "bg-purple-500/10 text-purple-300 border-purple-500/30"
            }`}
          >
            <Briefcase className="h-3 w-3" /> {arr}
          </span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.isActive;
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              active
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
            }`}
          >
            {active ? "ACTIVE" : "INACTIVE"}
          </span>
        );
      },
    },
    {
      accessorKey: "currentStatus",
      header: "Today Attendance",
      cell: ({ row }) => {
        const status = row.original.currentStatus;
        return (
          <span
            className={`px-2 py-1 rounded text-[11px] font-semibold ${
              status === "CHECKED_IN" || status === "WORKING"
                ? "bg-emerald-500/20 text-emerald-300"
                : status === "REMOTE"
                ? "bg-cyan-500/20 text-cyan-300"
                : status === "ON_LEAVE"
                ? "bg-purple-500/20 text-purple-300"
                : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
            }`}
          >
            {status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <Link
            href={`/hr/employees/${row.original.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-150 dark:bg-slate-800 hover:bg-slate-700/80 text-gray-700 dark:text-slate-200 text-xs font-medium transition-all"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> View Profile
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={employees}
      searchKey="employee"
      searchPlaceholder="Search by employee name or email..."
    />
  );
}
