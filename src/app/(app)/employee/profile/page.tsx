"use client";

import React, { useEffect, useState } from "react";
import { EmploymentStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { UserCircle, Save, CheckCircle2, AlertCircle, Lock, Sparkles } from "lucide-react";
import { Avatar } from "@/components/layout/Avatar";
import { getMyProfileAction, updateMyProfileAction } from "@/lib/actions/profile.actions";

type ProfileData = Awaited<ReturnType<typeof getMyProfileAction>>["data"];

export default function ProfilePage() {
  const { update: updateSession } = useSession();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("ACTIVE");
  const [requiredOfficeDaysPerWeek, setRequiredOfficeDaysPerWeek] = useState(2);
  const [officeDays, setOfficeDays] = useState<string[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await getMyProfileAction();
        if (res.success && res.data) {
          setProfile(res.data);
          setName(res.data.name);
          setPhone(res.data.phone);
          setAvatarUrl(res.data.avatarUrl);
          setJobTitle(res.data.jobTitle);
          setEmploymentStatus(res.data.employmentStatus as EmploymentStatus);
          setRequiredOfficeDaysPerWeek(res.data.requiredOfficeDaysPerWeek || 2);
          setOfficeDays(res.data.officeDays || []);
          setDepartmentId(res.data.departmentId || "");
        } else {
          setErrorMsg(res.error || "Failed to load profile.");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await updateMyProfileAction({ 
        name, 
        phone, 
        avatarUrl, 
        jobTitle, 
        employmentStatus,
        requiredOfficeDaysPerWeek,
        officeDays,
        departmentId
      });
      if (res.success) {
        setSuccessMsg("Profile updated successfully.");
        // Refresh the JWT/session so the Navbar reflects the new name/avatar.
        await updateSession();
      } else {
        setErrorMsg(res.error || "Failed to update profile.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-3xl animate-pulse flex flex-col space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800/40 w-1/3 rounded-xl"></div>
        <div className="h-24 bg-gray-200 dark:bg-slate-800/40 rounded-2xl"></div>
        <div className="h-40 bg-gray-200 dark:bg-slate-800/40 rounded-2xl"></div>
      </div>
    );
  }

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    HR: "Human Resources",
    DEPARTMENT_HEAD: "Department Head",
    EMPLOYEE: "Employee",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <span className="text-xs font-semibold text-brand-500 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
          <Sparkles className="h-3.5 w-3.5" /> Personal Settings
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Update your display name, contact number, and avatar. Job details are managed by HR.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-600 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-brand-500 dark:text-brand-400" /> Editable Details
        </h2>

        <div className="flex items-center gap-4">
          <Avatar
            src={avatarUrl}
            name={name}
            email={profile?.email}
            className="h-16 w-16 ring-2 ring-brand-500/40"
          />
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
              Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Unassigned</option>
              {profile?.availableDepartments?.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
              Employment Type
            </label>
            <select
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {["ACTIVE", "PROBATION", "CONTRACT", "TERMINATED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
              Required Office Days Per Week
            </label>
            <input
              type="number"
              min="0"
              max="7"
              value={requiredOfficeDaysPerWeek}
              onChange={(e) => setRequiredOfficeDaysPerWeek(parseInt(e.target.value) || 0)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
              Specific Office Days
            </label>
            <select
              multiple
              value={officeDays}
              onChange={(e) => setOfficeDays(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-[104px]"
            >
              {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Hold Cmd/Ctrl to select multiple</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 py-3 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 active:scale-[0.99] transition-all shadow-xl shadow-brand-500/25 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Lock className="h-4 w-4 text-gray-400 dark:text-slate-500" /> Managed by HR
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          These details are set by your organization. Contact HR to request changes.
        </p>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-2">
          {[
            { label: "Email", value: profile?.email },
            { label: "Role", value: profile ? roleLabel[profile.role] || profile.role : "" },
            { label: "Work Arrangement", value: profile?.workArrangement },
            { label: "Working Hours", value: profile?.workingHours },
            {
              label: "Required Office Days (Monthly)",
              value: profile
                ? `${profile.requiredOfficeDaysPerMonth}/month`
                : "",
            },
            {
              label: "Date Joined",
              value: profile?.dateJoined
                ? new Date(profile.dateJoined).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "",
            },
          ].map((item) => (
            <div key={item.label} className="border-b border-gray-100 dark:border-slate-800/60 pb-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                {item.label}
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 break-words">
                {item.value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
