"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Avatar } from "@/components/layout/Avatar";
import { updateHREmployeeAction } from "@/lib/actions/hr.actions";

interface HREmployeeEditFormProps {
  userId: string;
  initial: {
    name: string;
    email: string;
    phone: string;
    jobTitle: string;
    avatarUrl: string | null;
    employmentStatus: string;
    workArrangement: string;
    role: string;
  };
}

const EMPLOYMENT_STATUSES = ["ACTIVE", "PROBATION", "CONTRACT", "TERMINATED"];
const WORK_ARRANGEMENTS = ["HYBRID", "REMOTE", "OFFICE"];

export function HREmployeeEditForm({ userId, initial }: HREmployeeEditFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone === "N/A" ? "" : initial.phone);
  const [jobTitle, setJobTitle] = useState(initial.jobTitle);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl || "");
  const [employmentStatus, setEmploymentStatus] = useState(initial.employmentStatus);
  const [workArrangement, setWorkArrangement] = useState(initial.workArrangement);
  const [role, setRole] = useState(initial.role);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const inputClass =
    "w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const labelClass =
    "block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await updateHREmployeeAction({
        userId,
        name,
        phone,
        jobTitle,
        avatarUrl,
        employmentStatus,
        workArrangement,
        role: role as any,
      });
      if (res.success) {
        setSuccessMsg("Employee profile updated.");
        router.refresh();
        setTimeout(() => setOpen(false), 800);
      } else {
        setErrorMsg(res.error || "Failed to update employee.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-600/25"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit Profile
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg rounded-3xl border border-gray-200 dark:border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Pencil className="h-4 w-4 text-emerald-500" /> Edit Employee Profile
          </h2>
          <button
            onClick={() => setOpen(false)}
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
            <Avatar src={avatarUrl} name={name} email={initial.email} className="h-14 w-14 ring-2 ring-emerald-500/40" />
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
            <div>
              <label className={labelClass}>Job Title</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Employment Status</label>
              <select value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)} className={inputClass}>
                {EMPLOYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={initial.role === "SUPER_ADMIN" || initial.role === "HR"}
                className={inputClass}
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="DEPARTMENT_HEAD">DEPARTMENT_HEAD</option>
                {(initial.role === "SUPER_ADMIN" || initial.role === "HR") && (
                  <option value={initial.role}>{initial.role}</option>
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>Work Arrangement</label>
              <select value={workArrangement} onChange={(e) => setWorkArrangement(e.target.value)} className={inputClass}>
                {WORK_ARRANGEMENTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
