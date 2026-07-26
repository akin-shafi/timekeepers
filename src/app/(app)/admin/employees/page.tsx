import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Users, Shield } from "lucide-react";
import { InviteSection } from "@/components/layout/InviteSection";
import { AdminEmployeesTable } from "@/components/layout/AdminEmployeesTable";

export default async function AdminEmployeesPage() {
  const admin = await getCurrentUser();
  if (!admin) return null;

  const users = await db.user.findMany({
    include: {
      orgMemberships: {
        include: { organization: true },
      },
      deptMemberships: {
        include: { department: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const departments = await db.department.findMany({
    where: { organizationId: admin.organizationId },
    select: { id: true, name: true },
  });

  const pendingInvitations = await db.invitation.findMany({
    where: {
      organizationId: admin.organizationId,
      status: "PENDING",
    },
    include: {
      department: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-purple-400" /> Employee & Role Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">View all organization users, update roles, and manage permissions</p>
      </div>

      <InviteSection departments={departments} pendingInvitations={pendingInvitations} />

      <div className="glass-card rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-400" /> Organization User Directory ({users.length})
        </h2>

        <AdminEmployeesTable users={users} />
      </div>
    </div>
  );
}
