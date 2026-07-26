"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";
import { WorkLocation, AttendanceStatus, VerificationMethod, Role } from "@prisma/client";
import { verifyOfficeAttendance } from "@/lib/services/verification";
import { reverseGeocode } from "@/lib/services/geocoding";
import { revalidatePath } from "next/cache";

export interface CheckInPayload {
  workLocation: WorkLocation;
  officeLocationId?: string;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  deviceInfo?: string;
  overrideReason?: string;
}

export async function getActiveOfficeLocationsAction() {
  const user = await requireAuth();
  try {
    const locations = await db.officeLocation.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return { success: true, locations };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch office locations." };
  }
}

export async function checkInAction(payload: CheckInPayload) {
  const user = await requireAuth();

  // Get current date normalized to YYYY-MM-DD
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  // Check if attendance record already exists for today
  const existingRecord = await db.attendanceRecord.findUnique({
    where: {
      userId_workDate: {
        userId: user.id,
        workDate: today,
      },
    },
  });

  if (existingRecord) {
    return { success: false, error: "You have already checked in for today." };
  }

  // Get organization settings
  const org = await db.organization.findUnique({
    where: { id: user.organizationId },
  });

  if (!org) {
    return { success: false, error: "Organization not found." };
  }

  // Determine if location override is required
  const expectedLocation = await checkExpectedWorkMode(user.id, today, user.organizationId);
  if (payload.workLocation !== expectedLocation && !payload.overrideReason) {
    return {
      success: false,
      requiresOverride: true,
      expectedLocation,
      error: `You are scheduled to work from ${expectedLocation === WorkLocation.OFFICE ? "the office" : "remotely"} today.`,
    };
  }

  // Determine user's primary department
  const userDept = await db.departmentMembership.findFirst({
    where: { userId: user.id },
  });

  // Late check calculation
  const [startHour, startMin] = org.workStartTime.split(":").map(Number);
  const workStartDateTime = new Date(now);
  workStartDateTime.setHours(startHour, startMin + org.gracePeriodMins, 0, 0);
  const isLate = now > workStartDateTime;

  let verificationStatus = "VERIFIED" as any;
  let verificationNotes = "Remote work check-in automatically verified.";
  let officeLocId = payload.officeLocationId;

  if (payload.workLocation === WorkLocation.OFFICE) {
    let officeLocation = null;
    if (officeLocId) {
      officeLocation = await db.officeLocation.findUnique({
        where: { id: officeLocId },
      });
    } else {
      officeLocation = await db.officeLocation.findFirst({
        where: { organizationId: user.organizationId, isActive: true },
      });
      officeLocId = officeLocation?.id;
    }

    const verificationResult = verifyOfficeAttendance({
      method: org.verificationType,
      userLat: payload.latitude,
      userLng: payload.longitude,
      userIp: payload.ipAddress,
      officeLat: officeLocation?.latitude,
      officeLng: officeLocation?.longitude,
      radiusMeters: officeLocation?.radiusMeters ?? 100,
      allowedIPs: officeLocation?.allowedIPs ?? [],
    });

    verificationStatus = verificationResult.status;
    verificationNotes = verificationResult.notes;
  }

  const initialStatus = payload.workLocation === WorkLocation.REMOTE ? AttendanceStatus.REMOTE : AttendanceStatus.WORKING;
  const resolvedAddress = await reverseGeocode(payload.latitude, payload.longitude);

  const record = await db.attendanceRecord.create({
    data: {
      organizationId: user.organizationId,
      departmentId: userDept?.departmentId,
      userId: user.id,
      workDate: today,
      checkInTime: now,
      workLocation: payload.workLocation,
      officeLocationId: officeLocId,
      verificationStatus,
      verificationNotes: payload.overrideReason
        ? [verificationNotes, `Location Override Reason: ${payload.overrideReason}`].filter(Boolean).join(" | ")
        : verificationNotes,
      status: initialStatus,
      latitude: payload.latitude,
      longitude: payload.longitude,
      checkInLocation: resolvedAddress,
      ipAddress: payload.ipAddress,
      deviceInfo: payload.deviceInfo,
      isLate,
    },
  });

  // Log audit
  await db.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: "ATTENDANCE_CHECK_IN",
      entity: "AttendanceRecord",
      entityId: record.id,
      newValue: {
        workLocation: payload.workLocation,
        checkInTime: now.toISOString(),
        verificationStatus,
      },
    },
  });

  // Handle exceptions and notifications for Late or Unverified check-ins
  try {
    const isUnverifiedOffice = payload.workLocation === "OFFICE" && verificationStatus === "UNVERIFIED";
    
    if (isLate || isUnverifiedOffice) {
      const exceptionType = isUnverifiedOffice ? "UNVERIFIED_OFFICE" : "LATE_CHECK_IN";
      const description = isUnverifiedOffice 
        ? `${user.name || user.email} checked in at office but failed geofence/network verification: ${verificationNotes}`
        : `${user.name || user.email} checked in late at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;

      // Create attendance exception record
      await db.attendanceException.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          workDate: today,
          exceptionType,
          description,
          status: "OPEN",
        },
      });

      // Find HR managers to notify
      const hrMemberships = await db.organizationMembership.findMany({
        where: { organizationId: user.organizationId, role: "HR" },
        select: { userId: true },
      });

      for (const hr of hrMemberships) {
        await db.notification.create({
          data: {
            organizationId: user.organizationId,
            userId: hr.userId,
            title: isUnverifiedOffice ? "Unverified Office Check-In" : "Late Check-In Exception",
            message: description,
            type: "EXCEPTION",
          },
        });
      }
    }
  } catch (err) {
    console.error("Failed to generate check-in exceptions or notifications:", err);
  }

  revalidatePath("/employee/dashboard");
  revalidatePath("/dept/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/hr/exceptions");
  revalidatePath("/hr/notifications");
  revalidatePath("/notifications");

  return { success: true, record };
}

export async function checkOutAction(payload?: { latitude?: number; longitude?: number }) {
  const user = await requireAuth();

  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const record = await db.attendanceRecord.findUnique({
    where: {
      userId_workDate: {
        userId: user.id,
        workDate: today,
      },
    },
  });

  if (!record) {
    return { success: false, error: "No check-in record found for today." };
  }

  if (record.checkOutTime) {
    return { success: false, error: "You have already checked out for today." };
  }

  // Calculate hours worked
  const checkIn = new Date(record.checkInTime);
  const diffMs = now.getTime() - checkIn.getTime();
  const hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  // Check early departure
  const org = await db.organization.findUnique({
    where: { id: user.organizationId },
  });

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { workingHours: true },
  });

  let isEarlyDeparture = false;
  if (org) {
    let workEndTimeStr = org.workEndTime;
    if (dbUser?.workingHours && dbUser.workingHours.includes("-")) {
      const parts = dbUser.workingHours.split("-");
      if (parts.length === 2) {
        const endPart = parts[1].trim();
        if (/^\d{2}:\d{2}$/.test(endPart)) {
          workEndTimeStr = endPart;
        }
      }
    }
    const [endHour, endMin] = workEndTimeStr.split(":").map(Number);
    const workEndDateTime = new Date(now);
    workEndDateTime.setHours(endHour, endMin, 0, 0);
    isEarlyDeparture = now < workEndDateTime;
  }

  const resolvedAddress = payload ? await reverseGeocode(payload.latitude, payload.longitude) : undefined;

  const updatedRecord = await db.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOutTime: now,
      hoursWorked,
      isEarlyDeparture,
      status: AttendanceStatus.CHECKED_OUT,
      checkOutLatitude: payload?.latitude,
      checkOutLongitude: payload?.longitude,
      checkOutLocation: resolvedAddress,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: "ATTENDANCE_CHECK_OUT",
      entity: "AttendanceRecord",
      entityId: record.id,
      newValue: {
        checkOutTime: now.toISOString(),
        hoursWorked,
      },
    },
  });

  revalidatePath("/employee/dashboard");
  revalidatePath("/dept/dashboard");
  revalidatePath("/admin/dashboard");

  return { success: true, record: updatedRecord };
}

export async function getTodayAttendanceStatusAction() {
  const user = await requireAuth();

  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const record = await db.attendanceRecord.findUnique({
    where: {
      userId_workDate: {
        userId: user.id,
        workDate: today,
      },
    },
    include: {
      officeLocation: true,
    },
  });

  return { success: true, record };
}

export async function approveAttendanceRecordAction(recordId: string) {
  const reviewer = await requireAuth();

  const record = await db.attendanceRecord.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    return { success: false, error: "Attendance record not found." };
  }

  // Security checks:
  // 1. Must be from the same organization (tenant check)
  if (record.organizationId !== reviewer.organizationId) {
    return { success: false, error: "Security violation: Unauthorized access." };
  }

  // 2. Caller role validation:
  // Super Admins and HR can approve anyone's record in the organization.
  // Department Heads can only approve records of users in their assigned department.
  if (reviewer.role === Role.DEPARTMENT_HEAD) {
    // Check if targeting a record in the reviewer's department
    const isMember = await db.departmentMembership.findFirst({
      where: {
        userId: record.userId,
        departmentId: { in: reviewer.departmentIds },
      },
    });

    if (!isMember) {
      return { success: false, error: "Forbidden: You can only approve attendance within your department." };
    }
  } else if (reviewer.role !== Role.SUPER_ADMIN && reviewer.role !== Role.HR) {
    return { success: false, error: "Forbidden: Insufficient privileges." };
  }

  // Update status to APPROVED
  const updatedRecord = await db.attendanceRecord.update({
    where: { id: recordId },
    data: {
      status: AttendanceStatus.APPROVED,
    },
  });

  // Create audit trail
  await db.auditLog.create({
    data: {
      organizationId: reviewer.organizationId,
      userId: reviewer.id,
      action: "ATTENDANCE_RECORD_APPROVED",
      entity: "AttendanceRecord",
      entityId: recordId,
      newValue: { previousStatus: record.status, newStatus: AttendanceStatus.APPROVED },
    },
  });

  revalidatePath("/dept/attendance");
  revalidatePath("/dept/dashboard");
  revalidatePath("/hr/attendance");
  revalidatePath("/admin/attendance");

  return { success: true, record: updatedRecord };
}

export async function updateAttendanceRecordsStatusAction({
  recordIds,
  status,
  justification,
}: {
  recordIds: string[];
  status: "APPROVED" | "REJECTED";
  justification?: string;
}) {
  try {
    const reviewer = await requireAuth();

    if (recordIds.length === 0) {
      return { success: false, error: "No records selected." };
    }

    // Fetch target records
    const records = await db.attendanceRecord.findMany({
      where: { id: { in: recordIds } },
    });

    if (records.length !== recordIds.length) {
      return { success: false, error: "One or more attendance records were not found." };
    }

    // Verify tenant isolation
    const belongsToSameOrg = records.every((r) => r.organizationId === reviewer.organizationId);
    if (!belongsToSameOrg) {
      return { success: false, error: "Security violation: Unauthorized organization access." };
    }

    // Role-based scoping checks
    if (reviewer.role === Role.DEPARTMENT_HEAD) {
      // Validate that all record owners are members of the reviewer's department(s)
      const userIds = records.map((r) => r.userId);
      const matchingMemberships = await db.departmentMembership.findMany({
        where: {
          userId: { in: userIds },
          departmentId: { in: reviewer.departmentIds },
        },
      });

      const uniqueMemberIds = new Set(matchingMemberships.map((m) => m.userId));
      const allMembersAreInDept = userIds.every((uid) => uniqueMemberIds.has(uid));

      if (!allMembersAreInDept) {
        return { success: false, error: "Forbidden: You can only manage attendance within your department." };
      }
    } else if (reviewer.role !== Role.SUPER_ADMIN && reviewer.role !== Role.HR) {
      // Check if reviewer is a Group Manager for all record owners
      const userIds = records.map((r) => r.userId);
      const managedGroups = await db.group.findMany({
        where: { managerId: reviewer.id },
        include: {
          memberships: { select: { userId: true } },
        },
      });
      const managedUserIds = new Set(managedGroups.flatMap((g) => g.memberships.map((m) => m.userId)));
      const allMembersAreInGroup = userIds.every((uid) => managedUserIds.has(uid));

      if (!allMembersAreInGroup) {
        return { success: false, error: "Forbidden: You can only manage attendance for members of your team." };
      }
    }

    // Batch update records and insert audit logs in a transaction
    await db.$transaction(async (tx) => {
      for (const record of records) {
        let expectedMode = "REMOTE";
        // Calculate expected mode
        const user = await tx.user.findUnique({
          where: { id: record.userId },
          select: { workArrangement: true, officeDays: true },
        });

        if (user) {
          if (user.workArrangement === "REMOTE") {
            expectedMode = "REMOTE";
          } else if (user.workArrangement === "OFFICE") {
            expectedMode = "OFFICE";
          } else if (user.workArrangement === "HYBRID") {
            const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
            const dayName = weekdays[record.workDate.getDay()];
            
            let mandatoryDays = user.officeDays || [];
            if (mandatoryDays.length === 0) {
              const orgPolicy = await tx.attendancePolicy.findFirst({
                where: { organizationId: record.organizationId, scope: "ORGANIZATION" },
                select: { mandatoryOfficeDays: true },
              });
              mandatoryDays = orgPolicy?.mandatoryOfficeDays || [];
            }
            expectedMode = mandatoryDays.includes(dayName) ? "OFFICE" : "REMOTE";
          }
        }

        // Validate deviation justification requirement
        const isDeviation = expectedMode === "OFFICE" && record.workLocation === WorkLocation.REMOTE;
        if (status === "APPROVED" && isDeviation && !justification) {
          throw new Error(`Justification is required to approve remote check-in for a scheduled office day.`);
        }

        const defaultJustification = isDeviation 
          ? "Remote check-in approved on scheduled office day." 
          : "Approved by Department Head.";

        await tx.attendanceRecord.update({
          where: { id: record.id },
          data: {
            status: status === "APPROVED" ? AttendanceStatus.APPROVED : AttendanceStatus.REJECTED,
            expectedWorkMode: expectedMode,
            approvalJustification: status === "APPROVED" ? (justification || defaultJustification) : justification || "Rejected.",
            approvedAt: status === "APPROVED" ? new Date() : null,
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId: reviewer.organizationId,
            userId: reviewer.id,
            action: status === "APPROVED" ? "ATTENDANCE_RECORD_APPROVED" : "ATTENDANCE_RECORD_REJECTED",
            entity: "AttendanceRecord",
            entityId: record.id,
            newValue: {
              previousStatus: record.status,
              newStatus: status,
              justification: justification,
              expectedWorkMode: expectedMode,
              declaredWorkMode: record.workLocation,
            },
          },
        });
      }
    });

    revalidatePath("/dept/attendance");
    revalidatePath("/dept/dashboard");
    revalidatePath("/hr/attendance");
    revalidatePath("/admin/attendance");

    return { success: true, count: recordIds.length };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update attendance status." };
  }
}

export async function reverseCheckOutAction({ recordId }: { recordId: string }) {
  try {
    const reviewer = await requireAuth();
    
    if (reviewer.role !== Role.SUPER_ADMIN && reviewer.role !== Role.HR && reviewer.role !== Role.DEPARTMENT_HEAD) {
      return { success: false, error: "Forbidden: Insufficient privileges." };
    }

    const record = await db.attendanceRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      return { success: false, error: "Record not found." };
    }

    if (record.organizationId !== reviewer.organizationId) {
      return { success: false, error: "Security violation: Unauthorized access." };
    }

    // Role-based scoping checks
    if (reviewer.role === Role.DEPARTMENT_HEAD) {
      const isMember = await db.departmentMembership.findFirst({
        where: {
          userId: record.userId,
          departmentId: { in: reviewer.departmentIds },
        },
      });

      if (!isMember) {
        return { success: false, error: "Forbidden: You can only manage attendance within your department." };
      }
    }

    if (!record.checkOutTime) {
      return { success: false, error: "Record is not checked out." };
    }

    const revertedStatus = record.workLocation === WorkLocation.REMOTE ? AttendanceStatus.REMOTE : AttendanceStatus.WORKING;

    const updated = await db.attendanceRecord.update({
      where: { id: recordId },
      data: {
        checkOutTime: null,
        hoursWorked: 0.0,
        status: revertedStatus,
        checkOutLatitude: null,
        checkOutLongitude: null,
        checkOutLocation: null,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: reviewer.organizationId,
        userId: reviewer.id,
        action: "ATTENDANCE_CHECK_OUT_REVERSED",
        entity: "AttendanceRecord",
        entityId: recordId,
        newValue: { previousCheckOutTime: record.checkOutTime, newStatus: revertedStatus },
      },
    });

    revalidatePath("/employee/dashboard");
    revalidatePath("/dept/attendance");
    revalidatePath("/dept/dashboard");
    revalidatePath("/hr/attendance");
    revalidatePath("/admin/attendance");

    return { success: true, record: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reverse check-out." };
  }
}

export async function checkExpectedWorkMode(userId: string, date: Date, organizationId: string): Promise<WorkLocation> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { workArrangement: true, officeDays: true },
  });

  if (!user) return WorkLocation.REMOTE;

  if (user.workArrangement === "REMOTE") {
    return WorkLocation.REMOTE;
  }
  if (user.workArrangement === "OFFICE") {
    return WorkLocation.OFFICE;
  }

  // HYBRID
  const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const dayName = weekdays[date.getDay()];

  if (user.officeDays && user.officeDays.length > 0) {
    return user.officeDays.includes(dayName) ? WorkLocation.OFFICE : WorkLocation.REMOTE;
  }

  // Fallback to org policy
  const orgPolicy = await db.attendancePolicy.findFirst({
    where: { organizationId, scope: "ORGANIZATION" },
    select: { mandatoryOfficeDays: true },
  });

  if (orgPolicy?.mandatoryOfficeDays && orgPolicy.mandatoryOfficeDays.length > 0) {
    return orgPolicy.mandatoryOfficeDays.includes(dayName) ? WorkLocation.OFFICE : WorkLocation.REMOTE;
  }

  return WorkLocation.REMOTE;
}

/**
 * Checks if today is a working day based on organization holidays and weekends.
 */
export async function checkIfWorkingDayAction() {
  const user = await requireAuth();
  try {
    const now = new Date();
    
    // 1. Check if weekend (Saturday or Sunday)
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 2. Check if public holiday for this organization
    const todayStr = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const holiday = await db.holiday.findFirst({
      where: {
        organizationId: user.organizationId,
        date: todayStr,
      },
    });

    if (isWeekend) {
      return { isWorkingDay: false, reason: "weekend" };
    }
    if (holiday) {
      return { isWorkingDay: false, reason: `holiday: ${holiday.name}` };
    }

    return { isWorkingDay: true };
  } catch (err: any) {
    return { isWorkingDay: true }; // Fallback to true if check fails
  }
}

export async function getDashboardStatsAction() {
  const userSession = await requireAuth();
  
  const user = await db.user.findUnique({
    where: { id: userSession.id }
  });

  if (!user) return { success: false, error: "User not found" };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  let requiredDays = user.requiredOfficeDaysPerMonth;
  let isDynamic = false;

  if (user.officeDays && user.officeDays.length > 0) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let exactRequiredDays = 0;
    
    const dayMap: Record<string, number> = {
      "SUNDAY": 0, "MONDAY": 1, "TUESDAY": 2, "WEDNESDAY": 3,
      "THURSDAY": 4, "FRIDAY": 5, "SATURDAY": 6
    };
    
    const targetDays = user.officeDays.map(d => dayMap[d.toUpperCase()]).filter(d => d !== undefined);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (targetDays.includes(date.getDay())) {
        exactRequiredDays++;
      }
    }
    
    requiredDays = exactRequiredDays;
    isDynamic = true;
  }
  
  return { 
    success: true, 
    requiredDays, 
    requiredPerWeek: user.requiredOfficeDaysPerWeek,
    officeDays: user.officeDays,
    isDynamic 
  };
}
