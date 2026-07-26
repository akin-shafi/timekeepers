import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Users, ShieldAlert } from "lucide-react";
import { InviteSection } from "@/components/layout/InviteSection";
import { DeptMembersTable } from "@/components/layout/DeptMembersTable";

export default async function DepartmentMembersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Find department assigned to department head/manager
  const deptMembership = await db.departmentMembership.findFirst({
    where: { userId: user.id },
    include: { department: true },
  });

  if (!deptMembership || !deptMembership.department) {
    return (
      <div className="space-y-8">
        <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">No Department Assigned</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            You are not currently assigned to manage any department. Please contact your organization administrator.
          </p>
        </div>
      </div>
    );
  }

  const dept = deptMembership.department;

  // Query pending invitations for this department
  const pendingInvitations = await db.invitation.findMany({
    where: {
      organizationId: user.organizationId,
      departmentId: dept.id,
      status: "PENDING",
    },
    include: {
      department: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Query actual department members, including their real organization role.
  const members = await db.departmentMembership.findMany({
    where: { departmentId: dept.id },
    include: {
      user: {
        include: {
          orgMemberships: {
            where: { organizationId: user.organizationId },
            select: { role: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5" /> Department Management Portal
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {dept.name} Members & Invites
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {dept.description || "Manage your department directory and send staff onboarding invitations"}
          </p>
        </div>
      </div>

      {/* Invitations Section (Scoped to their department) */}
      <InviteSection
        departments={[{ id: dept.id, name: dept.name }]}
        pendingInvitations={pendingInvitations}
        defaultDepartmentId={dept.id}
        hideRoleSelect={true}
      />

      {/* Members Directory List */}
      <div className="glass-card rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-500" /> Department Directory ({members.length})
        </h2>

        <DeptMembersTable members={members} />
      </div>
    </div>
  );
}
