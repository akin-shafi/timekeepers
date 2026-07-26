"use server";

import { db } from "@/lib/db";
import { requireAuth, requireDepartmentHeadOrGroupManager } from "@/lib/auth/guard";
import { WorkLocation, CorrectionStatus, AttendanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface SubmitCorrectionPayload {
  workDate: string; // YYYY-MM-DD
  requestedLocation: WorkLocation;
  requestedCheckIn: string; // ISO String
  requestedCheckOut?: string; // ISO String
  reason: string;
}

export async function submitCorrectionRequestAction(payload: SubmitCorrectionPayload): Promise<{ success: boolean; correction?: any; error?: string }> {
  try {
    const user = await requireAuth();

    const workDateObj = new Date(payload.workDate);

    // Check if attendance record exists
    const existingRecord = await db.attendanceRecord.findUnique({
      where: {
        userId_workDate: {
          userId: user.id,
          workDate: workDateObj,
        },
      },
    });

    const correction = await db.attendanceCorrection.create({
      data: {
        userId: user.id,
        attendanceRecordId: existingRecord?.id,
        workDate: workDateObj,
        requestedLocation: payload.requestedLocation,
        requestedCheckIn: new Date(payload.requestedCheckIn),
        requestedCheckOut: payload.requestedCheckOut ? new Date(payload.requestedCheckOut) : null,
        reason: payload.reason,
        status: CorrectionStatus.PENDING,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "ATTENDANCE_CORRECTION_REQUESTED",
        entity: "AttendanceCorrection",
        entityId: correction.id,
        newValue: {
          workDate: payload.workDate,
          reason: payload.reason,
        },
      },
    });

    // Notify Department Head or HR
    try {
      const userDept = await db.departmentMembership.findFirst({
        where: { userId: user.id },
        select: { departmentId: true },
      });

      let notifiedUserIds: string[] = [];
      if (userDept?.departmentId) {
        const headMembership = await db.departmentMembership.findFirst({
          where: { departmentId: userDept.departmentId, isHead: true },
        });
        if (headMembership) {
          notifiedUserIds.push(headMembership.userId);
        }
      }

      if (notifiedUserIds.length === 0) {
        const hrMemberships = await db.organizationMembership.findMany({
          where: { organizationId: user.organizationId, role: "HR" },
        });
        notifiedUserIds = hrMemberships.map((m) => m.userId);
      }

      for (const targetUserId of notifiedUserIds) {
        await db.notification.create({
          data: {
            organizationId: user.organizationId,
            userId: targetUserId,
            title: "New Correction Request",
            message: `${user.name || user.email} requested a correction for ${new Date(payload.workDate).toISOString().split("T")[0]}.`,
            type: "CORRECTION",
          },
        });
      }
    } catch (err) {
      console.error("Failed to create correction notifications:", err);
    }

    revalidatePath("/employee/corrections");
    revalidatePath("/dept/corrections");
    revalidatePath("/hr/notifications");
    revalidatePath("/notifications");

    return { success: true, correction };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit correction request." };
  }
}

export async function reviewCorrectionRequestAction({
  correctionId,
  status,
  reviewerNotes,
}: {
  correctionId: string;
  status: CorrectionStatus;
  reviewerNotes?: string;
}) {
  const reviewer = await requireDepartmentHeadOrGroupManager();

  const correction = await db.attendanceCorrection.findUnique({
    where: { id: correctionId },
    include: { user: true },
  });

  if (!correction) {
    return { success: false, error: "Correction request not found." };
  }

  // Verify tenant/role scope
  const targetUserId = correction.userId;
  if (reviewer.role !== "SUPER_ADMIN" && reviewer.role !== "HR") {
    const userDept = await db.departmentMembership.findFirst({
      where: { userId: reviewer.id },
      select: { departmentId: true, isHead: true },
    });

    const targetInDept = await db.departmentMembership.findFirst({
      where: { userId: targetUserId, departmentId: userDept?.departmentId },
    });

    if (!targetInDept) {
      return { success: false, error: "Forbidden: User is not in your department." };
    }

    if (!userDept?.isHead) {
      const isMemberOfManagedGroup = await db.groupMembership.findFirst({
        where: {
          userId: targetUserId,
          group: { managerId: reviewer.id },
        },
      });

      if (!isMemberOfManagedGroup) {
        return { success: false, error: "Forbidden: User is not in any team you manage." };
      }
    }
  }

  // Update correction status
  const updatedCorrection = await db.attendanceCorrection.update({
    where: { id: correctionId },
    data: {
      status,
      reviewerId: reviewer.id,
      reviewerNotes,
      updatedAt: new Date(),
    },
  });

  // If approved, update or create AttendanceRecord
  if (status === CorrectionStatus.APPROVED) {
    const checkIn = new Date(correction.requestedCheckIn);
    const checkOut = correction.requestedCheckOut ? new Date(correction.requestedCheckOut) : null;
    let hoursWorked = 0;
    if (checkOut) {
      const diffMs = checkOut.getTime() - checkIn.getTime();
      hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    if (correction.attendanceRecordId) {
      await db.attendanceRecord.update({
        where: { id: correction.attendanceRecordId },
        data: {
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workLocation: correction.requestedLocation,
          hoursWorked,
          status: checkOut ? AttendanceStatus.CHECKED_OUT : AttendanceStatus.WORKING,
          verificationNotes: `Correction approved by ${reviewer.name || reviewer.email}`,
        },
      });
    } else {
      await db.attendanceRecord.create({
        data: {
          organizationId: reviewer.organizationId,
          userId: correction.userId,
          workDate: correction.workDate,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workLocation: correction.requestedLocation,
          hoursWorked,
          status: checkOut ? AttendanceStatus.CHECKED_OUT : AttendanceStatus.WORKING,
          verificationNotes: `Correction created & approved by ${reviewer.name || reviewer.email}`,
        },
      });
    }
  }

  await db.auditLog.create({
    data: {
      organizationId: reviewer.organizationId,
      userId: reviewer.id,
      action: `ATTENDANCE_CORRECTION_${status}`,
      entity: "AttendanceCorrection",
      entityId: correctionId,
      newValue: { status, reviewerNotes },
    },
  });

  // Notify the employee about approval/rejection
  try {
    await db.notification.create({
      data: {
        organizationId: reviewer.organizationId,
        userId: correction.userId,
        title: `Correction Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message: `Your correction request for ${new Date(correction.workDate).toISOString().split("T")[0]} has been ${status.toLowerCase()} by ${reviewer.name || reviewer.email}.`,
        type: "CORRECTION",
      },
    });
  } catch (err) {
    console.error("Failed to notify user of correction review:", err);
  }

  revalidatePath("/dept/corrections");
  revalidatePath("/admin/attendance");
  revalidatePath("/employee/corrections");
  revalidatePath("/notifications");

  return { success: true, correction: updatedCorrection };
}
