import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Users, ShieldAlert, Network } from "lucide-react";
import { TeamManager } from "@/components/layout/TeamManager";
import { getGroupsAction } from "@/lib/actions/group.actions";

export default async function DepartmentTeamsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Find department assigned to department head/manager
  const deptMembership = await db.departmentMembership.findFirst({
    where: { userId: user.id, isHead: true },
    include: { department: true },
  });

  if (!deptMembership || !deptMembership.department) {
    return (
      <div className="space-y-8">
        <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">No Department Assigned</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            You are not currently assigned to manage any department as Head. Please contact your organization administrator.
          </p>
        </div>
      </div>
    );
  }

  const dept = deptMembership.department;

  // Fetch groups
  const groups = await getGroupsAction();

  // Fetch department members
  const rawMembers = await db.departmentMembership.findMany({
    where: { departmentId: dept.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, jobTitle: true },
      },
    },
  });

  const departmentMembers = rawMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name || m.user.email,
    email: m.user.email,
    jobTitle: m.user.jobTitle,
  }));

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Network className="h-3.5 w-3.5" /> Department Teams & Delegation
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {dept.name} Teams
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Configure sub-departments/teams and delegate attendance approval responsibilities to team managers.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 p-6">
        <TeamManager
          groups={JSON.parse(JSON.stringify(groups))}
          departmentMembers={departmentMembers}
        />
      </div>
    </div>
  );
}
