"use server";

import { db } from "@/lib/db";
import { requireDepartmentHead, requireDepartmentHeadOrGroupManager } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { WorkLocation, AttendanceStatus, Role } from "@prisma/client";

/**
 * Allows a Department Head (or HR/Super Admin) to edit the personal profile
 * fields of a member within a department they head. Scope is enforced: the
 * target must belong to a department the caller is head of (HR/Super Admin
 * bypass this check via their elevated role but still stay within the org).
 */
export async function updateDeptMemberProfileAction({
  userId,
  name,
  phone,
  jobTitle,
  avatarUrl,
}: {
  userId: string;
  name?: string;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
}) {
  const manager = await requireDepartmentHead();
  const orgId = manager.organizationId;

  try {
    // Confirm the target user is in the same organization.
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        orgMemberships: { where: { organizationId: orgId } },
        deptMemberships: { select: { departmentId: true } },
      },
    });

    if (!targetUser || targetUser.orgMemberships.length === 0) {
      return { success: false, error: "Member not found in your organization." };
    }

    // Department Heads may only edit members of a department they head.
    // HR and Super Admin have org-wide reach and skip the department scope check.
    if (manager.role === "DEPARTMENT_HEAD") {
      const headOf = await db.departmentMembership.findMany({
        where: { userId: manager.id, isHead: true },
        select: { departmentId: true },
      });
      const headDeptIds = new Set(headOf.map((d) => d.departmentId));
      const targetDeptIds = targetUser.deptMemberships.map((d) => d.departmentId);
      const sharesDept = targetDeptIds.some((id) => headDeptIds.has(id));

      if (!sharesDept) {
        return {
          success: false,
          error: "You can only edit members of a department you manage.",
        };
      }
    }

    const trimmedName = name?.trim();
    if (trimmedName !== undefined && trimmedName.length === 0) {
      return { success: false, error: "Display name cannot be empty." };
    }

    const dataToUpdate: {
      name?: string;
      phone?: string | null;
      jobTitle?: string | null;
      avatarUrl?: string | null;
    } = {
      ...(trimmedName !== undefined ? { name: trimmedName } : {}),
      ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
      ...(jobTitle !== undefined ? { jobTitle: jobTitle.trim() || null } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl.trim() || null } : {}),
    };

    await db.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    await db.auditLog.create({
      data: {
        organizationId: orgId,
        userId: manager.id,
        action: "MEMBER_UPDATED_BY_DEPT_HEAD",
        entity: "User",
        entityId: userId,
        newValue: dataToUpdate,
      },
    });

    revalidatePath("/dept/members");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update member profile." };
  }
}

export async function getDeptAttendanceRecordsAction(filters?: {
  startDate?: string;
  endDate?: string;
  workLocation?: string;
  status?: string;
}) {
  const manager = await requireDepartmentHeadOrGroupManager();
  const orgId = manager.organizationId;

  // Find department of this user (either as head or as member)
  const deptMembership = await db.departmentMembership.findFirst({
    where: { userId: manager.id },
    select: { departmentId: true, isHead: true },
  });

  if (!deptMembership || !deptMembership.departmentId) {
    return [];
  }

  const deptId = deptMembership.departmentId;

  // If the user is a Group Manager (not Dept Head, Admin, or HR), scope to their groups
  let allowedUserIds: string[] | undefined = undefined;
  if (manager.role !== Role.SUPER_ADMIN && manager.role !== Role.HR && !deptMembership.isHead) {
    const managedGroups = await db.group.findMany({
      where: { managerId: manager.id },
      include: {
        memberships: { select: { userId: true } },
      },
    });
    allowedUserIds = managedGroups.flatMap((g) => g.memberships.map((m) => m.userId));
  }

  // Load holidays for the organization to perform holiday check-in validation
  const holidays = await db.holiday.findMany({
    where: { organizationId: orgId },
    select: { date: true },
  });
  const holidayTimestamps = new Set(
    holidays.map((h) => new Date(Date.UTC(h.date.getUTCFullYear(), h.date.getUTCMonth(), h.date.getUTCDate())).getTime())
  );

  const startDate = filters?.startDate && filters.startDate.trim() !== "" ? new Date(filters.startDate) : undefined;
  const endDate = filters?.endDate && filters.endDate.trim() !== "" ? new Date(filters.endDate) : undefined;

  const records = await db.attendanceRecord.findMany({
    where: {
      organizationId: orgId,
      departmentId: deptId,
      ...(allowedUserIds ? { userId: { in: allowedUserIds } } : {}),
      ...(filters?.workLocation ? { workLocation: filters.workLocation as WorkLocation } : {}),
      ...(filters?.status ? { status: filters.status as AttendanceStatus } : {}),
      ...((startDate || endDate)
        ? {
            workDate: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    },
    include: {
      user: true,
      department: true,
    },
    orderBy: [{ workDate: "desc" }, { checkInTime: "desc" }],
  });

  const NON_WORKED_STATUSES: AttendanceStatus[] = [
    AttendanceStatus.REJECTED,
    AttendanceStatus.ABSENT,
    AttendanceStatus.ON_LEAVE,
    AttendanceStatus.PENDING_APPROVAL,
    AttendanceStatus.NOT_CHECKED_IN,
  ];

  const employeeMap = new Map<
    string,
    {
      userId: string;
      employeeName: string;
      employeeId: string;
      email: string;
      avatarUrl: string | null;
      department: string;
      totalDaysWorked: number;
      officeDays: number;
      remoteDays: number;
      lateDays: number;
      specialDaysWorked: number;
      totalHours: number;
      recordCount: number;
    }
  >();

  for (const r of records) {
    const day = r.workDate.getDay(); // 0=Sun, 6=Sat
    const isWeekend = day === 0 || day === 6;
    const workDateUtc = new Date(Date.UTC(r.workDate.getUTCFullYear(), r.workDate.getUTCMonth(), r.workDate.getUTCDate())).getTime();
    const isHoliday = holidayTimestamps.has(workDateUtc);
    const isSpecialDay = isWeekend || isHoliday;

    const isWorked = !NON_WORKED_STATUSES.includes(r.status);

    let entry = employeeMap.get(r.userId);
    if (!entry) {
      entry = {
        userId: r.userId,
        employeeName: r.user.name || r.user.email,
        employeeId: r.user.employeeId || r.userId.slice(0, 8),
        email: r.user.email,
        avatarUrl: r.user.avatarUrl,
        department: r.department?.name || "N/A",
        totalDaysWorked: 0,
        officeDays: 0,
        remoteDays: 0,
        lateDays: 0,
        specialDaysWorked: 0,
        totalHours: 0,
        recordCount: 0,
      };
      employeeMap.set(r.userId, entry);
    }

    entry.recordCount++;

    if (isWorked) {
      entry.totalDaysWorked++;
      if (r.workLocation === WorkLocation.OFFICE) entry.officeDays++;
      if (r.workLocation === WorkLocation.REMOTE) entry.remoteDays++;
      if (r.isLate) entry.lateDays++;
      if (isSpecialDay) entry.specialDaysWorked++;
      entry.totalHours += r.hoursWorked || 0;
    }
  }

  return Array.from(employeeMap.values())
    .map((e) => ({
      ...e,
      avgHoursPerDay: e.totalDaysWorked > 0
        ? Math.round((e.totalHours / e.totalDaysWorked) * 10) / 10
        : 0,
    }))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}
