"use server";

import { requireHR } from "@/lib/auth/guard";
import { calculateMonthlyStipendForOrg } from "@/lib/services/stipend";
import { db } from "@/lib/db";
import { StipendType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function calculateStipendAction({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  // Allow both HR and Super Admin to run stipend calculations
  const hrUser = await requireHR();

  const results = await calculateMonthlyStipendForOrg({
    organizationId: hrUser.organizationId,
    year,
    month,
  });

  // Fetch policy so we can return the actual rate to the UI
  const policy = await db.transportStipendPolicy.findFirst({
    where: { organizationId: hrUser.organizationId },
    orderBy: { createdAt: "desc" },
  });

  // Count records still awaiting department head approval for this month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const pendingApprovalCount = await db.attendanceRecord.count({
    where: {
      organizationId: hrUser.organizationId,
      workDate: { gte: startDate, lte: endDate },
      status: { in: ["CHECKED_OUT", "PENDING_APPROVAL", "CHECKED_IN", "WORKING"] },
    },
  });

  revalidatePath("/admin/stipend");
  revalidatePath("/hr/transport");
  revalidatePath("/hr/reports");

  return {
    success: true,
    count: results.length,
    data: results,
    ratePerOfficeDay: policy?.ratePerOfficeDay ?? 2500,
    minRequiredDays: policy?.minRequiredAttendanceDays ?? 4,
    maxMonthlyCap: policy?.maxMonthlyStipend ?? 50000,
    pendingApprovalCount,
  };
}

export async function getTransportStipendPolicyAction() {
  const hrUser = await requireHR();

  // Find or create default transport stipend policy
  let policy = await db.transportStipendPolicy.findFirst({
    where: { organizationId: hrUser.organizationId },
    orderBy: { createdAt: "desc" },
  });

  if (!policy) {
    policy = await db.transportStipendPolicy.create({
      data: {
        organizationId: hrUser.organizationId,
        name: "Default Transport Policy",
        stipendType: StipendType.PER_OFFICE_DAY,
        ratePerOfficeDay: 2500,
        fixedMonthlyStipend: 20000,
        maxMonthlyStipend: 50000,
        minRequiredAttendanceDays: 4,
      },
    });
  }

  return { success: true, data: policy };
}

export async function updateTransportStipendPolicyAction(data: {
  stipendType: StipendType;
  ratePerOfficeDay: number;
  fixedMonthlyStipend: number;
  maxMonthlyStipend?: number | null;
  minRequiredAttendanceDays: number;
}) {
  const hrUser = await requireHR();

  const policy = await db.transportStipendPolicy.findFirst({
    where: { organizationId: hrUser.organizationId },
    orderBy: { createdAt: "desc" },
  });

  let updated;
  if (policy) {
    updated = await db.transportStipendPolicy.update({
      where: { id: policy.id },
      data: {
        stipendType: data.stipendType,
        ratePerOfficeDay: data.ratePerOfficeDay,
        fixedMonthlyStipend: data.fixedMonthlyStipend,
        maxMonthlyStipend: data.maxMonthlyStipend,
        minRequiredAttendanceDays: data.minRequiredAttendanceDays,
      },
    });
  } else {
    updated = await db.transportStipendPolicy.create({
      data: {
        organizationId: hrUser.organizationId,
        name: "Default Transport Policy",
        stipendType: data.stipendType,
        ratePerOfficeDay: data.ratePerOfficeDay,
        fixedMonthlyStipend: data.fixedMonthlyStipend,
        maxMonthlyStipend: data.maxMonthlyStipend,
        minRequiredAttendanceDays: data.minRequiredAttendanceDays,
      },
    });
  }

  await db.auditLog.create({
    data: {
      organizationId: hrUser.organizationId,
      userId: hrUser.id,
      action: "TRANSPORT_POLICY_UPDATED",
      entity: "TransportStipendPolicy",
      entityId: updated.id,
      newValue: data,
    },
  });

  revalidatePath("/admin/stipend");
  revalidatePath("/hr/transport");

  return { success: true, data: updated };
}
