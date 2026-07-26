"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Save, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Avatar } from "@/components/layout/Avatar";
import { DataTable } from "@/components/ui/DataTable";
import { updateDeptMemberProfileAction } from "@/lib/actions/dept.actions";

interface MemberRow {
  id: string;
  isHead: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    jobTitle: string | null;
    isActive: boolean;
    orgMemberships: { role: string }[];
  };
}

interface DeptMembersTableProps {
  members: MemberRow[];
}

export function DeptMembersTable({ members }: DeptMembersTableProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<MemberRow["user"] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const openEdit = (u: MemberRow["user"]) => {
    setEditing(u);
    setName(u.name || "");
    setPhone(u.phone || "");
    setJobTitle(u.jobTitle || "");
    setAvatarUrl(u.avatarUrl || "");
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await updateDeptMemberProfileAction({
        userId: editing.id,
        name,
        phone,
        jobTitle,
        avatarUrl,
      });
      if (res.success) {
        setSuccessMsg("Member profile updated.");
        router.refresh();
        setTimeout(() => setEditing(null), 800);
      } else {
        setErrorMsg(res.error || "Failed to update member.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500";
  const labelClass =
    "block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5";

  const columns: ColumnDef<MemberRow>[] = [
    {
      id: "name",
      header: "Name",
      accessorFn: (row) => row.user.name || row.user.email,
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <div className="flex items-center gap-3">
            <Avatar src={u.avatarUrl} name={u.name} email={u.email} className="h-10 w-10 ring-1 ring-gray-250 dark:ring-slate-800" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                {u.name || u.email}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{u.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "jobTitle",
      header: "Job Title",
      accessorFn: (row) => row.user.jobTitle || "Staff",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-gray-700 dark:text-slate-350">
          {row.original.user.jobTitle || "Staff"}
        </span>
      ),
    },
    {
      accessorKey: "isHead",
      header: "Role / Title",
      cell: ({ row }) => {
        const orgRole = row.original.user.orgMemberships[0]?.role || "EMPLOYEE";
        const roleLabel: Record<string, string> = {
          SUPER_ADMIN: "Super Admin",
          HR: "Human Resources",
          DEPARTMENT_HEAD: "Department Head",
          EMPLOYEE: "Employee",
        };
        return (
          <span className="text-xs font-medium text-gray-650 dark:text-slate-400">
            {roleLabel[orgRole] || orgRole}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => (row.user.isActive ? "ACTIVE" : "INACTIVE"),
      cell: ({ row }) => {
        const active = row.original.user.isActive;
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              active
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                : "bg-red-500/10 text-red-400 border-red-500/25"
            }`}
          >
            {active ? "ACTIVE" : "INACTIVE"}
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
          <button
            onClick={() => openEdit(row.original.user)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-medium transition-all border border-amber-500/25"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={members}
        searchKey="name"
        searchPlaceholder="Search member name or email..."
      />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg rounded-3xl border border-gray-200 dark:border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-500" /> Edit Member Profile
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar src={avatarUrl} name={name} email={editing.email} className="h-14 w-14 ring-2 ring-amber-500/40" />
                <div className="flex-1">
                  <label className={labelClass}>Avatar URL</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Display Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Job Title</label>
                  <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-lg shadow-amber-600/25 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
