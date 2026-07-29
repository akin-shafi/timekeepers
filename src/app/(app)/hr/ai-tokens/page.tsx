import React from "react";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";
import { TokenManager } from "./TokenManager";
import { Key } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AiTokensPage() {
  const hr = await requireAuth();

  if (hr.role !== "HR" && hr.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Verify feature is enabled
  const org = await db.organization.findUnique({
    where: { id: hr.organizationId },
    select: { aiMilestoneSummaryEnabled: true },
  });

  if (!org?.aiMilestoneSummaryEnabled) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-2">Feature Disabled</h2>
          <p>
            The AI Milestone Summary feature is currently disabled for your organization. 
            A Super Admin must enable it in the Organization Settings before HR can issue OTP tokens.
          </p>
        </div>
      </div>
    );
  }

  const tokens = await db.aiSummaryToken.findMany({
    where: { organizationId: hr.organizationId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const employees = await db.user.findMany({
    where: {
      orgMemberships: {
        some: { organizationId: hr.organizationId },
      },
      isActive: true,
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Key className="h-8 w-8 text-purple-600" />
            AI Summary Tokens
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-2xl text-sm">
            Issue secure, limited-use OTP codes for employees to generate AI KPI summaries. 
            Each token is valid for 2 uses to protect API costs.
          </p>
        </div>
      </div>

      <TokenManager 
        tokens={JSON.parse(JSON.stringify(tokens))} 
        employees={employees} 
      />
    </div>
  );
}
