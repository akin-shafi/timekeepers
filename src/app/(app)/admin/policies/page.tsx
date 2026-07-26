import React from "react";
import { requireHR } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Sliders } from "lucide-react";
import { PolicyEditForm } from "@/components/layout/PolicyEditForm";

export default async function AdminPoliciesPage() {
  const hrUser = await requireHR();

  const org = await db.organization.findUnique({
    where: { id: hrUser.organizationId },
    select: {
      workStartTime: true,
      workEndTime: true,
      gracePeriodMins: true,
      verificationType: true,
    },
  });

  if (!org) {
    return (
      <div className="p-6 text-center text-red-500 font-bold bg-red-100 rounded-xl">
        Organization not found.
      </div>
    );
  }

  const defaultPolicy = await db.attendancePolicy.findFirst({
    where: { organizationId: hrUser.organizationId, scope: "ORGANIZATION" },
    select: {
      requiredOfficeDaysPerWeek: true,
      requiredOfficeDaysPerMonth: true,
      mandatoryOfficeDays: true,
      isFlexible: true,
    },
  });

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sliders className="h-6 w-6 text-brand-400" /> Work Policy Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Configure work hours, grace periods, verification locking, and hybrid compliance rules organisation-wide.
        </p>
      </div>

      <PolicyEditForm initialOrg={org} initialPolicy={defaultPolicy} />
    </div>
  );
}
