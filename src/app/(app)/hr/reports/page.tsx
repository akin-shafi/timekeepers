import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import {
  FileSpreadsheet,
  Download,
  Clock,
  UserX,
  AlertTriangle,
  Building,
  Laptop,
  CalendarDays,
  Banknote,
  ShieldCheck,
} from "lucide-react";

export default async function HRReportsPage() {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const reportCategories = [
    {
      title: "Attendance Report",
      description: "Organisation-wide employee daily check-in, check-out, and hours log.",
      type: "attendance",
      icon: Clock,
      color: "text-emerald-400",
    },
    {
      title: "Absenteeism Report",
      description: "Unexplained absence records, missing check-ins, and absence rates.",
      type: "absenteeism",
      icon: UserX,
      color: "text-rose-400",
    },
    {
      title: "Lateness Report",
      description: "Employee late arrival trends, check-in timestamps, and grace period exceedances.",
      type: "lateness",
      icon: AlertTriangle,
      color: "text-amber-400",
    },
    {
      title: "Office Attendance Compliance",
      description: "Auditing of required vs actual office days per hybrid policy rules.",
      type: "compliance",
      icon: ShieldCheck,
      color: "text-brand-400",
    },
    {
      title: "Remote Work Report",
      description: "Remote work days summary, location distribution, and remote logs.",
      type: "remote",
      icon: Laptop,
      color: "text-cyan-400",
    },
    {
      title: "Leave Management Report",
      description: "Annual, sick, and casual leave records, leave days taken, and approvals.",
      type: "leave",
      icon: CalendarDays,
      color: "text-purple-400",
    },
    {
      title: "Transport Stipend Report",
      description: "Monthly transport stipend calculations based on verified office attendance.",
      type: "stipend",
      icon: Banknote,
      color: "text-emerald-300",
    },
    {
      title: "Attendance Exceptions Report",
      description: "Log of unresolved and resolved attendance anomalies and policy violations.",
      type: "exceptions",
      icon: AlertTriangle,
      color: "text-amber-300",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> HR Intelligence & Data Export
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">HR Reports Export Hub</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Generate and download official organisation workforce and attendance reports</p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCategories.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.type} className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className={`p-3 rounded-2xl bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 inline-block ${r.color}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{r.title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{r.description}</p>
              </div>

              <a
                href={`/api/hr/export/${r.type}`}
                download={`hr_${r.type}_report.csv`}
                className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-gray-300 dark:border-slate-700 transition-all"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" /> Download CSV
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
