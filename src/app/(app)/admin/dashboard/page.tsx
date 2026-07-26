import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import {
  Users,
  Building,
  Laptop,
  Clock,
  Banknote,
  ShieldAlert,
  Sparkles,
  Sliders,
  TrendingUp,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const admin = await getCurrentUser();
  if (!admin) return null;

  const totalEmployees = await db.user.count();
  const totalDepartments = await db.department.count();

  const today = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const todayRecords = await db.attendanceRecord.findMany({
    where: {
      organizationId: admin.organizationId,
      workDate: today,
    },
  });

  const officeToday = todayRecords.filter((r) => r.workLocation === "OFFICE").length;
  const remoteToday = todayRecords.filter((r) => r.workLocation === "REMOTE").length;
  const lateToday = todayRecords.filter((r) => r.isLate).length;

  const compliancePercentage = totalEmployees > 0 ? Math.round(((officeToday + remoteToday) / totalEmployees) * 100) : 0;
  const estimatedStipendLiability = officeToday * 2500;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Super Admin Control Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Organization Command Center</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Multi-tenant management, policy enforcement, and compliance analytics</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
            Organization: {admin.organizationName}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-purple-400" /> Total Employees
          </p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{totalEmployees}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <Building className="h-3.5 w-3.5 text-brand-400" /> Office Today
          </p>
          <p className="text-3xl font-extrabold text-brand-400">{officeToday}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <Laptop className="h-3.5 w-3.5 text-cyan-400" /> Remote Today
          </p>
          <p className="text-3xl font-extrabold text-cyan-400">{remoteToday}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Compliance Rate
          </p>
          <p className="text-3xl font-extrabold text-emerald-400">{compliancePercentage}%</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <Banknote className="h-3.5 w-3.5 text-emerald-400" /> Daily Stipend
          </p>
          <p className="text-2xl font-extrabold text-emerald-300">₦{estimatedStipendLiability.toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Navigation Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-gray-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-400" /> Departments ({totalDepartments})
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            Manage organizational hierarchy, department leads, and department-specific policies.
          </p>
          <a
            href="/admin/departments"
            className="inline-block text-xs font-bold text-purple-300 hover:text-purple-200 transition-colors"
          >
            Manage Departments →
          </a>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-4 border border-gray-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sliders className="h-5 w-5 text-cyan-400" /> Hybrid Work Policy
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            Configure default required office days (e.g. 2 days/week, mandatory Mondays/Wednesdays).
          </p>
          <a
            href="/admin/policies"
            className="inline-block text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            Configure Policies →
          </a>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-4 border border-gray-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-400" /> Payroll Stipends
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            Run automated monthly transport stipend calculations and export payroll files.
          </p>
          <a
            href="/admin/stipend"
            className="inline-block text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            Calculate & Export →
          </a>
        </div>
      </div>
    </div>
  );
}
