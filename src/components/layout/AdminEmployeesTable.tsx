"use client";

import React, { useTransition, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Shield, RefreshCw } from "lucide-react";
import { updateUserRoleAction } from "@/lib/actions/admin.actions";
import { Avatar } from "@/components/layout/Avatar";
import { DataTable } from "@/components/ui/DataTable";

interface UserMembership {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  orgMemberships: Array<{ role: string }>;
  deptMemberships: Array<{ department: { name: string } }>;
}

interface AdminEmployeesTableProps {
  users: UserMembership[];
}

export function AdminEmployeesTable({ users }: AdminEmployeesTableProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRoleUpdate = async (userId: string, newRole: any) => {
    setErrorMsg("");
    setSuccessMsg("");
    startTransition(async () => {
      try {
        const res = await updateUserRoleAction({ userId, newRole });
        if (res.success) {
          setSuccessMsg("Successfully updated user role.");
        } else {
          setErrorMsg(res.error || "Failed to update user role.");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    });
  };

  const columns: ColumnDef<UserMembership>[] = [
    {
      id: "user",
      header: "User",
      accessorFn: (row) => row.name || row.email,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar src={u.avatarUrl} name={u.name} email={u.email} className="h-10 w-10 ring-1 ring-gray-250 dark:ring-slate-800" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white leading-tight">{u.name || u.email}</p>
              <p className="text-xs text-gray-450 dark:text-slate-500 mt-0.5">{u.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "department",
      header: "Department",
      accessorFn: (row) => row.deptMemberships[0]?.department?.name || "Unassigned",
      cell: ({ row }) => {
        const deptName = row.original.deptMemberships[0]?.department?.name || "Unassigned";
        return (
          <span className="text-xs font-medium text-gray-600 dark:text-slate-350">
            {deptName}
          </span>
        );
      },
    },
    {
      id: "role",
      header: "Current Role",
      accessorFn: (row) => row.orgMemberships[0]?.role || "EMPLOYEE",
      cell: ({ row }) => {
        const role = row.original.orgMemberships[0]?.role || "EMPLOYEE";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              role === "SUPER_ADMIN"
                ? "bg-purple-500/20 text-purple-350 border-purple-500/30"
                : role === "HR"
                ? "bg-emerald-500/20 text-emerald-350 border-emerald-500/30"
                : role === "DEPARTMENT_HEAD"
                ? "bg-amber-500/20 text-amber-350 border-amber-500/30"
                : "bg-sky-500/20 text-sky-350 border-sky-500/30"
            }`}
          >
            {role}
          </span>
        );
      },
    },
    {
      id: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => {
        const time = row.original.lastLoginAt;
        return (
          <span className="text-xs font-mono text-gray-500 dark:text-slate-400">
            {time ? new Date(time).toLocaleString() : "Never"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions / Update Role",
      cell: ({ row }) => {
        const u = row.original;
        const currentRole = u.orgMemberships[0]?.role || "EMPLOYEE";
        return (
          <div className="flex items-center gap-2">
            <select
              defaultValue={currentRole}
              onChange={(e) => handleRoleUpdate(u.id, e.target.value as any)}
              disabled={isPending}
              className="bg-gray-150 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-lg text-xs text-gray-800 dark:text-slate-200 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50"
            >
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="DEPARTMENT_HEAD">DEPARTMENT_HEAD</option>
              <option value="HR">HR</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
            {isPending && <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Messaging alerts */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 text-xs">
          {successMsg}
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        searchKey="user"
        searchPlaceholder="Search by user name or email..."
      />
    </div>
  );
}
