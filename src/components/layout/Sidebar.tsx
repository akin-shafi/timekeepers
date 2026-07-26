"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  FileCheck,
  Users,
  Building,
  Building2,
  Sliders,
  MapPin,
  Banknote,
  FileSpreadsheet,
  History,
  Briefcase,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  Bell,
  UserCircle,
  Network,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "EMPLOYEE";

  const employeeLinks = [
    { label: "My Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
    { label: "Attendance Records", href: "/employee/attendance", icon: Clock },
    { label: "Attendance Calendar", href: "/employee/calendar", icon: CalendarDays },
    { label: "Correction Requests", href: "/employee/corrections", icon: FileCheck },
    { label: "My Profile", href: "/employee/profile", icon: UserCircle },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ];

  const hrLinks = [
    { label: "HR Dashboard", href: "/hr/dashboard", icon: LayoutDashboard },
    { label: "Employee Directory", href: "/hr/employees", icon: Users },
    { label: "Departments", href: "/hr/departments", icon: Building },
    { label: "Office Locations", href: "/hr/locations", icon: MapPin },
    { label: "Attendance Log", href: "/hr/attendance", icon: Clock },
    { label: "Exceptions", href: "/hr/exceptions", icon: AlertTriangle },
    { label: "Corrections", href: "/hr/corrections", icon: FileCheck },
    { label: "Leave Management", href: "/hr/leave", icon: CalendarDays },
    { label: "Work Arrangements", href: "/hr/work-arrangements", icon: Briefcase },
    { label: "Compliance", href: "/hr/compliance", icon: ShieldCheck },
    { label: "Transport Stipend", href: "/hr/transport", icon: Banknote },
    { label: "HR Reports", href: "/hr/reports", icon: FileSpreadsheet },
    { label: "HR Analytics", href: "/hr/analytics", icon: BarChart3 },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ];

  const deptHeadLinks = [
    { label: "Dept Overview", href: "/dept/dashboard", icon: LayoutDashboard },
    { label: "Department Daily Log", href: "/dept/attendance", icon: Clock },
    { label: "Department Members", href: "/dept/members", icon: Users },
    { label: "Department Teams", href: "/dept/teams", icon: Network },
    { label: "Correction Requests", href: "/dept/corrections", icon: FileCheck },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ];

  const adminLinks = [
    { label: "Org Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Organizations", href: "/admin/organizations", icon: Building2 },
    { label: "Office Locations", href: "/admin/locations", icon: MapPin },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ];

  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <aside className="w-64 glass-panel border-r border-gray-200 dark:border-slate-800 hidden md:flex flex-col min-h-[calc(100vh-4rem)] p-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Navigation Sections */}
      <div className="space-y-6 flex-1">
        {/* Section 1: Personal / Employee (hidden for Super Admin) */}
        {!isSuperAdmin && (
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
            Employee Workspace
          </p>
          <nav className="space-y-1">
            {employeeLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-400 dark:text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        )}

        {/* Section 2: HR Module (HR only — Super Admin accesses these via org preview) */}
        {role === "HR" && (
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 flex items-center justify-between">
              <span>HR Operations</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono">
                HR
              </span>
            </p>
            <nav className="space-y-1">
              {hrLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-400 dark:text-slate-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Section 3: Department Head / Team Manager */}
        {(role === "DEPARTMENT_HEAD" || session?.user?.managesGroups) && (
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 flex items-center justify-between">
              <span>{role === "DEPARTMENT_HEAD" ? "Department Head" : "Team Manager"}</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono">
                MGMT
              </span>
            </p>
            <nav className="space-y-1">
              {deptHeadLinks
                .filter((item) => {
                  // Only Department Heads (and Admins/HR) can manage/configure teams
                  if (item.href === "/dept/teams") {
                    return role === "DEPARTMENT_HEAD" || role === "SUPER_ADMIN" || role === "HR";
                  }
                  return true;
                })
                .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                        : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-400 dark:text-slate-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Section 4: Super Admin (if SUPER_ADMIN) */}
        {role === "SUPER_ADMIN" && (
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 flex items-center justify-between">
              <span>Super Admin</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-mono">
                ADMIN
              </span>
            </p>
            <nav className="space-y-1">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-400 dark:text-slate-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-200 dark:border-slate-800/80 text-xs text-gray-500 dark:text-slate-500 px-3 mt-4">
        <p className="font-semibold text-gray-600 dark:text-slate-400">Allowed Email Domain:</p>
        <p className="font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">@getrova.com</p>
      </div>
    </aside>
  );
}
