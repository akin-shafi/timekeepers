"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Users, Building, Clock, Sliders, MapPin, Banknote,
  History, Globe, Shield, LayoutDashboard, RefreshCw,
} from "lucide-react";
import { InviteSection } from "@/components/layout/InviteSection";
import { updateUserRoleAction } from "@/lib/actions/admin.actions";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "departments", label: "Departments", icon: Building },
  { key: "employees", label: "Employees & Roles", icon: Users },
  { key: "attendance", label: "Org Attendance", icon: Clock },
  { key: "policies", label: "Hybrid Work Policies", icon: Sliders },
  { key: "geofencing", label: "Office Geofencing", icon: MapPin },
  { key: "stipend", label: "Transport Stipend", icon: Banknote },
  { key: "modules", label: "Modules", icon: Sliders },
  { key: "audit", label: "Audit Logs", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function OrganizationPreview({ data }: { data: any }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const { org, recentAttendance, attendanceSummary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{org.name}</h1>
          <p className="text-xs font-mono text-gray-400 dark:text-slate-500">{org.slug}</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-slate-800 pb-0">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === key
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tab === "overview" && <OverviewTab org={org} summary={attendanceSummary} />}
        {tab === "departments" && <DepartmentsTab departments={org.departments} />}
        {tab === "employees" && (
          <EmployeesTab
            memberships={org.memberships}
            departments={org.departments}
            invitations={org.invitations || []}
            organizationId={org.id}
          />
        )}
        {tab === "attendance" && <AttendanceTab records={recentAttendance} summary={attendanceSummary} />}
        {tab === "policies" && <PoliciesTab policies={org.policies} org={org} />}
        {tab === "geofencing" && <GeofencingTab locations={org.officeLocations} />}
        {tab === "stipend" && <StipendTab policies={org.stipendPolicies} />}
        {tab === "modules" && <ModulesTab org={org} />}
        {tab === "audit" && <AuditTab logs={org.auditLogs} />}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function OverviewTab({ org, summary }: { org: any; summary: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Members" value={org._count.memberships} />
        <StatCard label="Departments" value={org._count.departments} />
        <StatCard label="Office Locations" value={org._count.officeLocations} />
        <StatCard label="Attendance Records" value={org._count.attendanceRecords} />
      </div>
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { icon: Globe, label: "Timezone", value: org.timezone },
            { icon: Clock, label: "Work Hours", value: `${org.workStartTime} – ${org.workEndTime}` },
            { icon: Shield, label: "Verification", value: org.verificationType.replace(/_/g, " ") },
            { icon: Clock, label: "Grace Period", value: `${org.gracePeriodMins} minutes` },
            { icon: Globe, label: "Allowed Domains", value: org.allowedDomains.length ? org.allowedDomains.map((d: string) => `@${d}`).join(", ") : "None" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
              <Icon className="h-4 w-4 text-gray-400 dark:text-slate-500 flex-shrink-0" />
              <span className="text-gray-400 dark:text-slate-500 w-32 flex-shrink-0">{label}:</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DepartmentsTab({ departments }: { departments: any[] }) {
  if (!departments.length) return <Empty message="No departments found." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {departments.map((d: any) => {
        const head = d.memberships[0]?.user;
        return (
          <div key={d.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-400" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{d.name}</h3>
            </div>
            {d.description && <p className="text-xs text-gray-500 dark:text-slate-400">{d.description}</p>}
            <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1 pt-1 border-t border-gray-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Members</span>
                <span className="font-semibold text-gray-900 dark:text-white">{d._count.memberships}</span>
              </div>
              <div className="flex justify-between">
                <span>Head</span>
                <span className="font-semibold text-amber-500">{head ? (head.name || head.email) : "None"}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmployeesTab({
  memberships,
  departments,
  invitations,
  organizationId,
}: {
  memberships: any[];
  departments: any[];
  invitations: any[];
  organizationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRoleUpdate = async (userId: string, newRole: any) => {
    setErrorMsg("");
    setSuccessMsg("");
    startTransition(async () => {
      try {
        const res = await updateUserRoleAction({
          userId,
          newRole,
          organizationId,
        });
        if (res.success) {
          setSuccessMsg("Successfully updated user role.");
          router.refresh();
        } else {
          setErrorMsg(res.error || "Failed to update user role.");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Invite Member Section */}
      <InviteSection
        departments={departments}
        pendingInvitations={invitations}
        organizationId={organizationId}
      />

      {/* Alert Messages */}
      {errorMsg && (
        <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 text-xs rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
          {successMsg}
        </div>
      )}

      {/* Members Table */}
      {!memberships.length ? (
        <Empty message="No members found." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-xs text-gray-500 dark:text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role / Update</th>
                <th className="px-4 py-3 text-left">Departments</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {memberships.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{m.user.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 font-mono text-xs">{m.user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={m.role}
                        onChange={(e) => handleRoleUpdate(m.user.id, e.target.value as any)}
                        disabled={isPending}
                        className="bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700/80 rounded-lg text-xs text-gray-700 dark:text-slate-200 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50"
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="DEPARTMENT_HEAD">DEPARTMENT_HEAD</option>
                        <option value="HR">HR</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                      {isPending && <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
                    {m.user.deptMemberships.map((dm: any) => dm.department.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.user.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                      {m.user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AttendanceTab({ records, summary }: { records: any[]; summary: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Records (last 30)" value={summary.total} />
        <StatCard label="Office" value={summary.officeCount} />
        <StatCard label="Remote" value={summary.remoteCount} />
      </div>
      {records.length === 0 ? <Empty message="No attendance records found." /> : (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-xs text-gray-500 dark:text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {records.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-xs">{r.user.name || r.user.email}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{r.department?.name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{new Date(r.workDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.workLocation === "OFFICE" ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20" : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"}`}>
                      {r.workLocation}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PoliciesTab({ policies, org }: { policies: any[]; org: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Org-Level Settings</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-slate-300">
          <div>Work Start: <span className="font-semibold">{org.workStartTime}</span></div>
          <div>Work End: <span className="font-semibold">{org.workEndTime}</span></div>
          <div>Grace Period: <span className="font-semibold">{org.gracePeriodMins}m</span></div>
          <div>Verification: <span className="font-semibold">{org.verificationType.replace(/_/g, " ")}</span></div>
        </div>
      </div>
      {policies.length === 0 ? <Empty message="No attendance policies configured." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((p: any) => (
            <div key={p.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">{p.scope}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
                <div>Office days/week: <span className="font-semibold text-gray-900 dark:text-white">{p.requiredOfficeDaysPerWeek}</span></div>
                <div>Office days/month: <span className="font-semibold text-gray-900 dark:text-white">{p.requiredOfficeDaysPerMonth}</span></div>
                <div>Flexible: <span className="font-semibold text-gray-900 dark:text-white">{p.isFlexible ? "Yes" : "No"}</span></div>
                {p.mandatoryOfficeDays?.length > 0 && (
                  <div>Mandatory days: <span className="font-semibold text-gray-900 dark:text-white">{p.mandatoryOfficeDays.join(", ")}</span></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GeofencingTab({ locations }: { locations: any[] }) {
  if (!locations.length) return <Empty message="No office locations configured." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {locations.map((loc: any) => (
        <div key={loc.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-400" />
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">{loc.name}</h4>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${loc.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-gray-100 dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700"}`}>
              {loc.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {loc.address && <p className="text-xs text-gray-500 dark:text-slate-400">{loc.address}</p>}
          <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
            <div>Coordinates: <span className="font-mono">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</span></div>
            <div>Radius: <span className="font-semibold text-gray-900 dark:text-white">{loc.radiusMeters}m</span></div>
            {loc.allowedIPs?.length > 0 && <div>Allowed IPs: <span className="font-mono">{loc.allowedIPs.join(", ")}</span></div>}
            {loc.allowedSSIDs?.length > 0 && <div>SSIDs: <span className="font-semibold text-gray-900 dark:text-white">{loc.allowedSSIDs.join(", ")}</span></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function StipendTab({ policies }: { policies: any[] }) {
  if (!policies.length) return <Empty message="No transport stipend policies configured." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {policies.map((p: any) => (
        <div key={p.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">{p.stipendType.replace(/_/g, " ")}</span>
          </div>
          {p.department && <p className="text-xs text-gray-400 dark:text-slate-500">Dept: {p.department.name}</p>}
          <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
            <div>Rate/day: <span className="font-semibold text-gray-900 dark:text-white">{p.ratePerOfficeDay}</span></div>
            <div>Fixed monthly: <span className="font-semibold text-gray-900 dark:text-white">{p.fixedMonthlyStipend}</span></div>
            {p.maxMonthlyStipend != null && <div>Max monthly: <span className="font-semibold text-gray-900 dark:text-white">{p.maxMonthlyStipend}</span></div>}
            <div>Min attendance days: <span className="font-semibold text-gray-900 dark:text-white">{p.minRequiredAttendanceDays}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTab({ logs }: { logs: any[] }) {
  if (!logs.length) return <Empty message="No audit logs found." />;
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-slate-800 text-xs text-gray-500 dark:text-slate-400 uppercase">
          <tr>
            <th className="px-4 py-3 text-left">Action</th>
            <th className="px-4 py-3 text-left">Entity</th>
            <th className="px-4 py-3 text-left">By</th>
            <th className="px-4 py-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {logs.map((log: any) => (
            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {log.action}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{log.entity}{log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}</td>
              <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{log.user ? (log.user.name || log.user.email) : "System"}</td>
              <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-gray-400 dark:text-slate-500">
      <p className="text-sm">{message}</p>
    </div>
  );
}

import { updateOrganizationModulesAction } from "@/lib/actions/organization.actions";

function ModulesTab({ org }: { org: any }) {
  const router = useRouter();
  const [disabledModules, setDisabledModules] = useState<string[]>(org.disabledModules || []);
  const [isPending, startTransition] = useTransition();

  const MODULES = [
    { key: "ATTENDANCE", label: "Attendance Module", description: "Log, track, and manage employee attendance." },
    { key: "CALENDAR", label: "Calendar", description: "View check-in times visually on a calendar." },
    { key: "LEAVE", label: "Leave Management", description: "Request, review, and approve leave requests." },
    { key: "BULLETIN", label: "Bulletin Board", description: "View announcements and global updates." },
    { key: "CORRECTIONS", label: "Corrections", description: "Allow employees to submit timesheet corrections." },
    { key: "MILESTONES", label: "Milestones", description: "Employee performance tracking and milestones." },
    { key: "STIPENDS", label: "Transport Stipends", description: "Manage commuting allowances and stipends." },
  ];

  const handleToggle = (moduleKey: string) => {
    let next: string[];
    if (disabledModules.includes(moduleKey)) {
      next = disabledModules.filter(m => m !== moduleKey);
    } else {
      next = [...disabledModules, moduleKey];
    }
    setDisabledModules(next);

    startTransition(async () => {
      try {
        await updateOrganizationModulesAction(org.id, next);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Module Configuration</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
          Toggle these modules on or off for your entire organization. Disabling a module hides it from all users in the sidebar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map(({ key, label, description }) => {
            const isEnabled = !disabledModules.includes(key);
            return (
              <div key={key} className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>
                </div>
                <button
                  disabled={isPending}
                  onClick={() => handleToggle(key)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                    isEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
