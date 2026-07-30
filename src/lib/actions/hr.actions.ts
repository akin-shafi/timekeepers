"use server";

import { db } from "@/lib/db";
import { requireHR, verifyTenantAccess } from "@/lib/auth/guard";
import { Role, AttendanceStatus, CorrectionStatus, WorkLocation, VerificationMethod, PolicyScope, ExceptionStatus, LeaveStatus, EmploymentStatus, WorkArrangement } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getHRDashboardMetricsAction(filters?: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  workLocation?: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  // 1. Employee Counts
  const totalEmployees = await db.organizationMembership.count({
    where: {
      organizationId: orgId,
      ...(filters?.departmentId
        ? {
            user: {
              deptMemberships: {
                some: { departmentId: filters.departmentId },
              },
            },
          }
        : {}),
    },
  });

  const activeEmployees = await db.user.count({
    where: {
      orgMemberships: { some: { organizationId: orgId } },
      isActive: true,
      ...(filters?.departmentId
        ? { deptMemberships: { some: { departmentId: filters.departmentId } } }
        : {}),
    },
  });

  // Today Date bounds
  const today = new Date();
  const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const endOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59));

  // Today Attendance Records
  const todayRecords = await db.attendanceRecord.findMany({
    where: {
      organizationId: orgId,
      workDate: { gte: startOfDay, lte: endOfDay },
      ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters?.workLocation ? { workLocation: filters.workLocation as WorkLocation } : {}),
    },
    include: {
      user: true,
    },
  });

  const workingFromOffice = todayRecords.filter((r: { workLocation: any; }) => r.workLocation === WorkLocation.OFFICE).length;
  const workingRemotely = todayRecords.filter((r: { workLocation: any; }) => r.workLocation === WorkLocation.REMOTE).length;
  const late = todayRecords.filter((r: { isLate: any; }) => r.isLate).length;
  const presentToday = todayRecords.length;

  // Today Approved Leaves
  const todayLeaves = await db.leaveRecord.count({
    where: {
      organizationId: orgId,
      status: "APPROVED",
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
      ...(filters?.departmentId
        ? { user: { deptMemberships: { some: { departmentId: filters.departmentId } } } }
        : {}),
    },
  });

  const absent = Math.max(0, activeEmployees - presentToday - todayLeaves);
  const notCheckedIn = Math.max(0, activeEmployees - presentToday);

  // Compliance Rates
  const attendanceRate = activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0;
  const officeComplianceRate = activeEmployees > 0 ? Math.round((workingFromOffice / Math.max(1, activeEmployees * 0.4)) * 100) : 0;

  return {
    totalEmployees,
    activeEmployees,
    presentToday,
    workingFromOffice,
    workingRemotely,
    notCheckedIn,
    absent,
    onLeave: todayLeaves,
    late,
    attendanceRate: Math.min(100, attendanceRate),
    officeComplianceRate: Math.min(100, officeComplianceRate),
  };
}

export async function getHREmployeesAction(filters?: {
  search?: string;
  departmentId?: string;
  role?: string;
  employmentStatus?: string;
  workArrangement?: string;
  isActive?: boolean;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const users = await db.user.findMany({
    where: {
      orgMemberships: {
        some: {
          organizationId: orgId,
          ...(filters?.role ? { role: filters.role as Role } : {}),
        },
      },
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { employeeId: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters?.departmentId
        ? { deptMemberships: { some: { departmentId: filters.departmentId } } }
        : {}),
      ...(filters?.employmentStatus ? { employmentStatus: filters.employmentStatus as EmploymentStatus } : {}),
      ...(filters?.workArrangement ? { workArrangement: filters.workArrangement as WorkArrangement } : {}),
      ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    include: {
      orgMemberships: { where: { organizationId: orgId } },
      deptMemberships: { include: { department: true } },
      attendanceRecords: {
        orderBy: { workDate: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name || u.email.split("@")[0],
    email: u.email,
    avatarUrl: u.avatarUrl,
    employeeId: u.employeeId || `EMP-${u.id.slice(0, 6).toUpperCase()}`,
    jobTitle: u.jobTitle || "Staff",
    role: u.orgMemberships[0]?.role || Role.EMPLOYEE,
    department: u.deptMemberships[0]?.department?.name || "Unassigned",
    departmentId: u.deptMemberships[0]?.departmentId || null,
    employmentStatus: u.employmentStatus || "ACTIVE",
    workArrangement: u.workArrangement || "HYBRID",
    isActive: u.isActive,
    dateJoined: u.dateJoined || u.createdAt,
    lastCheckIn: u.attendanceRecords[0]?.checkInTime || null,
    currentStatus: u.attendanceRecords[0]?.status || AttendanceStatus.NOT_CHECKED_IN,
    workingHours: u.workingHours,
  }));
}

export async function getHREmployeeProfileAction(userId: string) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      orgMemberships: { where: { organizationId: orgId } },
      deptMemberships: { include: { department: true } },
      attendanceRecords: {
        orderBy: { workDate: "desc" },
        take: 30,
        include: { officeLocation: true },
      },
      leaveRecords: {
        orderBy: { startDate: "desc" },
        take: 10,
      },
      stipendCalculations: {
        where: { organizationId: orgId },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 6,
      },
    },
  });

  if (!user || user.orgMemberships.length === 0) {
    throw new Error("Employee not found in your organization.");
  }

  // Aggregate attendance stats for past 30 records
  const totalRecords = user.attendanceRecords.length;
  const officeDays = user.attendanceRecords.filter((r: { workLocation: any; }) => r.workLocation === WorkLocation.OFFICE).length;
  const remoteDays = user.attendanceRecords.filter((r: { workLocation: any; }) => r.workLocation === WorkLocation.REMOTE).length;
  const lateDays = user.attendanceRecords.filter((r: { isLate: any; }) => r.isLate).length;
  const totalHours = user.attendanceRecords.reduce((acc: any, r: { hoursWorked: any; }) => acc + (r.hoursWorked || 0), 0);
  const avgHours = totalRecords > 0 ? (totalHours / totalRecords).toFixed(1) : "0.0";
  const requiredOffice = user.requiredOfficeDaysPerMonth || 8;
  const compliancePercent = Math.min(100, Math.round((officeDays / requiredOffice) * 100));

  return {
    user: {
      id: user.id,
      name: user.name || user.email.split("@")[0],
      email: user.email,
      avatarUrl: user.avatarUrl,
      employeeId: user.employeeId || `EMP-${user.id.slice(0, 6).toUpperCase()}`,
      phone: user.phone || "N/A",
      jobTitle: user.jobTitle || "Staff",
      role: user.orgMemberships[0]?.role || Role.EMPLOYEE,
      department: user.deptMemberships[0]?.department?.name || "Unassigned",
      departmentId: user.deptMemberships[0]?.departmentId || null,
      employmentStatus: user.employmentStatus || "ACTIVE",
      dateJoined: user.dateJoined || user.createdAt,
      isActive: user.isActive,
    },
    workArrangement: {
      arrangement: user.workArrangement || "HYBRID",
      requiredOfficeDaysPerWeek: user.requiredOfficeDaysPerWeek || 2,
      requiredOfficeDaysPerMonth: user.requiredOfficeDaysPerMonth || 8,
      officeDays: user.officeDays || ["TUESDAY", "THURSDAY"],
      workingHours: user.workingHours || "09:00 - 17:00",
      officeLocationId: user.officeLocationId || null,
    },
    attendanceSummary: {
      totalWorkingDays: totalRecords,
      officeDays,
      remoteDays,
      lateDays,
      absentDays: 0,
      leaveDays: user.leaveRecords.length,
      averageHoursPerDay: avgHours,
      compliancePercent,
    },
    attendanceHistory: user.attendanceRecords,
    leaveRecords: user.leaveRecords,
    stipendCalculations: user.stipendCalculations,
  };
}
export async function updateHREmployeeAction({
  userId,
  name,
  email,
  avatarUrl,
  jobTitle,
  phone,
  departmentId,
  employmentStatus,
  workArrangement,
  requiredOfficeDaysPerWeek,
  requiredOfficeDaysPerMonth,
  officeDays,
  workingHours,
  role,
}: {
  userId: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  jobTitle?: string;
  phone?: string;
  departmentId?: string;
  employmentStatus?: string;
  workArrangement?: string;
  requiredOfficeDaysPerWeek?: number;
  requiredOfficeDaysPerMonth?: number;
  officeDays?: string[];
  workingHours?: string;
  role?: Role;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    include: { orgMemberships: { where: { organizationId: orgId } } },
  });

  if (!targetUser || targetUser.orgMemberships.length === 0) {
    return { success: false, error: "Target user not found in organization." };
  }

  const currentRole = targetUser.orgMemberships[0].role;

  // Enforce role boundaries for HR:
  // 1. HR cannot update a SUPER_ADMIN or another HR user
  // 2. HR cannot set a role to SUPER_ADMIN or HR
  if (role !== undefined && role !== currentRole) {
    if (currentRole === Role.SUPER_ADMIN || currentRole === Role.HR) {
      return { success: false, error: "Forbidden: HR Officers cannot modify roles of Super Admins or HR Officers." };
    }
    if (role === Role.SUPER_ADMIN || role === Role.HR) {
      return { success: false, error: "Forbidden: HR Officers cannot assign Super Admin or HR Officer roles." };
    }

    // Perform role update
    await db.organizationMembership.update({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: userId,
        },
      },
      data: { role: role },
    });

    // Cascade role demotion: if role is changed to EMPLOYEE, clear head status
    if (role === Role.EMPLOYEE) {
      await db.departmentMembership.updateMany({
        where: { userId: userId },
        data: { isHead: false },
      });
    }
  }

  const trimmedName = name?.trim();
  if (trimmedName !== undefined && trimmedName.length === 0) {
    return { success: false, error: "Display name cannot be empty." };
  }

  // Email update — SUPER_ADMIN only
  let trimmedEmail: string | undefined;
  if (email !== undefined) {
    if (hrUser.role !== Role.SUPER_ADMIN) {
      return { success: false, error: "Forbidden: Only Super Admins can change a staff email address." };
    }
    trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: "Email address cannot be empty." };
    }
    // Check uniqueness — make sure no other user already has this email
    const conflict = await db.user.findFirst({
      where: { email: trimmedEmail, NOT: { id: userId } },
      select: { id: true },
    });
    if (conflict) {
      return { success: false, error: `Email ${trimmedEmail} is already in use by another account.` };
    }
  }

  // Update user metadata
  const dataToUpdate: any = {
    ...(trimmedName !== undefined ? { name: trimmedName } : {}),
    ...(trimmedEmail !== undefined ? { email: trimmedEmail } : {}),
    ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl.trim() || null } : {}),
    ...(jobTitle !== undefined ? { jobTitle } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(employmentStatus !== undefined ? { employmentStatus: employmentStatus as EmploymentStatus } : {}),
    ...(workArrangement !== undefined ? { workArrangement: workArrangement as WorkArrangement } : {}),
    ...(workingHours !== undefined ? { workingHours } : {}),
  };

  if (requiredOfficeDaysPerWeek !== undefined) {
    dataToUpdate.requiredOfficeDaysPerWeek = requiredOfficeDaysPerWeek;
    if (requiredOfficeDaysPerMonth === undefined) {
      dataToUpdate.requiredOfficeDaysPerMonth = requiredOfficeDaysPerWeek * 4;
    }
  }
  if (requiredOfficeDaysPerMonth !== undefined) {
    dataToUpdate.requiredOfficeDaysPerMonth = requiredOfficeDaysPerMonth;
  }
  if (officeDays !== undefined) {
    dataToUpdate.officeDays = officeDays;
  }

  await db.user.update({
    where: { id: userId },
    data: dataToUpdate,
  });

  // Update Department Membership if specified
  if (departmentId) {
    await db.departmentMembership.deleteMany({
      where: { userId },
    });
    await db.departmentMembership.create({
      data: {
        userId,
        departmentId,
        isHead: false,
      },
    });
  }

  // Audit log
  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: hrUser.id,
      action: "EMPLOYEE_UPDATED_BY_HR",
      entity: "User",
      entityId: userId,
      newValue: {
        name: trimmedName,
        email: trimmedEmail,
        avatarUrl,
        jobTitle,
        phone,
        employmentStatus,
        workArrangement,
        departmentId,
      },
    },
  });

  revalidatePath("/hr/employees");
  revalidatePath(`/hr/employees/${userId}`);
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
  revalidatePath("/hr/work-arrangements");

  return { success: true };
}

export async function deactivateHREmployeeAction({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  await db.user.update({
    where: { id: userId },
    data: { isActive },
  });

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: hrUser.id,
      action: isActive ? "EMPLOYEE_ACTIVATED" : "EMPLOYEE_DEACTIVATED",
      entity: "User",
      entityId: userId,
      newValue: { isActive },
    },
  });

  revalidatePath("/hr/employees");
  return { success: true };
}

export async function getHRAttendanceRecordsAction(filters?: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employeeId?: string;
  workLocation?: string;
  status?: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

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

  // Fetch all matching records (no cap) so we can aggregate per employee.
  const records = await db.attendanceRecord.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters?.employeeId ? { userId: filters.employeeId } : {}),
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
      user: {
        include: {
          deptMemberships: { include: { department: true } },
        },
      },
      department: true,
    },
    orderBy: [{ workDate: "desc" }, { checkInTime: "desc" }],
  });

  // Statuses that don't count as "worked"
  const NON_WORKED_STATUSES: AttendanceStatus[] = [
    AttendanceStatus.REJECTED,
    AttendanceStatus.ABSENT,
    AttendanceStatus.ON_LEAVE,
    AttendanceStatus.PENDING_APPROVAL,
    AttendanceStatus.NOT_CHECKED_IN,
  ];

  // Aggregate per employee
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

  // Convert to sorted array
  return Array.from(employeeMap.values())
    .map((e) => ({
      ...e,
      avgHoursPerDay: e.totalDaysWorked > 0
        ? Math.round((e.totalHours / e.totalDaysWorked) * 10) / 10
        : 0,
    }))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

export async function getHRAttendanceExceptionsAction(filters?: {
  status?: string;
  exceptionType?: string;
  departmentId?: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const exceptions = await db.attendanceException.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.status ? { status: filters.status as ExceptionStatus } : {}),
      ...(filters?.exceptionType ? { exceptionType: filters.exceptionType } : {}),
      ...(filters?.departmentId
        ? { user: { deptMemberships: { some: { departmentId: filters.departmentId } } } }
        : {}),
    },
    include: {
      user: {
        include: { deptMemberships: { include: { department: true } } },
      },
      resolvedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return exceptions.map((e) => ({
    id: e.id,
    employeeName: e.user.name || e.user.email,
    employeeId: e.user.employeeId || e.userId.slice(0, 8),
    department: e.user.deptMemberships[0]?.department?.name || "N/A",
    workDate: e.workDate,
    exceptionType: e.exceptionType,
    description: e.description,
    status: e.status,
    hrComments: e.hrComments,
    resolvedBy: e.resolvedBy?.name || null,
    createdAt: e.createdAt,
  }));
}

export async function resolveAttendanceExceptionAction({
  exceptionId,
  status,
  hrComments,
}: {
  exceptionId: string;
  status: ExceptionStatus; // OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
  hrComments?: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const exception = await db.attendanceException.findUnique({
    where: { id: exceptionId },
  });

  if (!exception || exception.organizationId !== orgId) {
    return { success: false, error: "Exception not found in organization." };
  }

  await db.attendanceException.update({
    where: { id: exceptionId },
    data: {
      status,
      hrComments,
      resolvedById: hrUser.id,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: hrUser.id,
      action: "ATTENDANCE_EXCEPTION_RESOLVED",
      entity: "AttendanceException",
      entityId: exceptionId,
      newValue: { status, hrComments },
    },
  });

  revalidatePath("/hr/exceptions");
  revalidatePath("/hr/dashboard");

  return { success: true };
}

export async function getHRCorrectionRequestsAction(filters?: {
  status?: string;
  departmentId?: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const corrections = await db.attendanceCorrection.findMany({
    where: {
      user: { orgMemberships: { some: { organizationId: orgId } } },
      ...(filters?.status ? { status: filters.status as CorrectionStatus } : {}),
      ...(filters?.departmentId
        ? { user: { deptMemberships: { some: { departmentId: filters.departmentId } } } }
        : {}),
    },
    include: {
      user: {
        include: { deptMemberships: { include: { department: true } } },
      },
      reviewer: true,
      attendanceRecord: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return corrections.map((c) => ({
    id: c.id,
    employeeName: c.user.name || c.user.email,
    employeeId: c.user.employeeId || c.userId.slice(0, 8),
    department: c.user.deptMemberships[0]?.department?.name || "N/A",
    workDate: c.workDate,
    requestedLocation: c.requestedLocation,
    requestedCheckIn: c.requestedCheckIn,
    requestedCheckOut: c.requestedCheckOut,
    reason: c.reason,
    status: c.status,
    hrStatus: c.hrStatus,
    reviewerNotes: c.reviewerNotes,
    hrNotes: c.hrNotes,
    reviewerName: c.reviewer?.name || null,
    createdAt: c.createdAt,
    originalRecord: c.attendanceRecord,
  }));
}

export async function reviewHRCorrectionAction({
  correctionId,
  status,
  hrNotes,
}: {
  correctionId: string;
  status: CorrectionStatus;
  hrNotes?: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const correction = await db.attendanceCorrection.findUnique({
    where: { id: correctionId },
    include: { user: { include: { deptMemberships: true } } },
  });

  if (!correction) {
    return { success: false, error: "Correction request not found." };
  }

  await db.attendanceCorrection.update({
    where: { id: correctionId },
    data: {
      status,
      hrStatus: status,
      hrNotes,
      reviewerId: hrUser.id,
    },
  });

  if (status === CorrectionStatus.APPROVED) {
    const deptId = correction.user.deptMemberships[0]?.departmentId || null;
    const hoursWorked = correction.requestedCheckOut
      ? (correction.requestedCheckOut.getTime() - correction.requestedCheckIn.getTime()) / (1000 * 60 * 60)
      : 8.0;

    await db.attendanceRecord.upsert({
      where: {
        userId_workDate: {
          userId: correction.userId,
          workDate: correction.workDate,
        },
      },
      update: {
        checkInTime: correction.requestedCheckIn,
        checkOutTime: correction.requestedCheckOut,
        workLocation: correction.requestedLocation,
        status: AttendanceStatus.APPROVED,
        hoursWorked,
      },
      create: {
        organizationId: orgId,
        departmentId: deptId,
        userId: correction.userId,
        workDate: correction.workDate,
        checkInTime: correction.requestedCheckIn,
        checkOutTime: correction.requestedCheckOut,
        workLocation: correction.requestedLocation,
        status: AttendanceStatus.APPROVED,
        hoursWorked,
      },
    });
  }

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: hrUser.id,
      action: status === CorrectionStatus.APPROVED ? "CORRECTION_APPROVED_BY_HR" : "CORRECTION_REJECTED_BY_HR",
      entity: "AttendanceCorrection",
      entityId: correctionId,
      newValue: { status, hrNotes },
    },
  });

  revalidatePath("/hr/corrections");
  revalidatePath("/hr/attendance");

  return { success: true };
}

export async function getHRLeaveRequestsAction(filters?: {
  status?: string;
  departmentId?: string;
  leaveType?: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const leaves = await db.leaveRecord.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.status ? { status: filters.status as LeaveStatus } : {}),
      ...(filters?.leaveType ? { leaveType: filters.leaveType } : {}),
      ...(filters?.departmentId
        ? { user: { deptMemberships: { some: { departmentId: filters.departmentId } } } }
        : {}),
    },
    include: {
      user: {
        include: { deptMemberships: { include: { department: true } } },
      },
      reviewer: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return leaves.map((l) => ({
    id: l.id,
    employeeName: l.user.name || l.user.email,
    employeeId: l.user.employeeId || l.userId.slice(0, 8),
    department: l.user.deptMemberships[0]?.department?.name || "N/A",
    startDate: l.startDate,
    endDate: l.endDate,
    daysCount: l.daysCount,
    leaveType: l.leaveType,
    reason: l.reason,
    status: l.status,
    reviewerNotes: l.reviewerNotes,
    reviewerName: l.reviewer?.name || null,
    createdAt: l.createdAt,
  }));
}

export async function createLeaveRequestAction({
  userId,
  startDate,
  endDate,
  leaveType,
  reason,
  supportingDoc,
}: {
  userId?: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason?: string;
  supportingDoc?: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const targetUserId = userId || hrUser.id;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const leave = await db.leaveRecord.create({
    data: {
      organizationId: orgId,
      userId: targetUserId,
      startDate: start,
      endDate: end,
      daysCount,
      leaveType,
      reason,
      supportingDoc,
      status: "APPROVED",
      reviewerId: hrUser.id,
      reviewerNotes: "Created & approved directly by HR",
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: hrUser.id,
      action: "LEAVE_RECORD_CREATED",
      entity: "LeaveRecord",
      entityId: leave.id,
      newValue: { targetUserId, leaveType, daysCount },
    },
  });

  // Notify the employee
  try {
    await db.notification.create({
      data: {
        organizationId: orgId,
        userId: targetUserId,
        title: "Leave Registered",
        message: `A leave of type ${leaveType} has been recorded for you from ${startDate} to ${endDate} by HR.`,
        type: "LEAVE",
      },
    });
  } catch (err) {
    console.error("Failed to notify user of leave registration:", err);
  }

  revalidatePath("/hr/leave");
  revalidatePath("/hr/dashboard");
  revalidatePath("/notifications");

  return { success: true, leave };
}

export async function reviewLeaveRequestAction({
  leaveId,
  status,
  reviewerNotes,
}: {
  leaveId: string;
  status: LeaveStatus; // APPROVED, REJECTED, CANCELLED
  reviewerNotes?: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const leave = await db.leaveRecord.findUnique({
    where: { id: leaveId },
  });

  if (!leave || leave.organizationId !== orgId) {
    return { success: false, error: "Leave record not found in organization." };
  }

  await db.leaveRecord.update({
    where: { id: leaveId },
    data: {
      status,
      reviewerNotes,
      reviewerId: hrUser.id,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: hrUser.id,
      action: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      entity: "LeaveRecord",
      entityId: leaveId,
      newValue: { status, reviewerNotes },
    },
  });

  // Notify the employee and Dept Heads
  try {
    const employee = await db.user.findUnique({ where: { id: leave.userId } });
    if (employee) {
      await db.notification.create({
        data: {
          organizationId: orgId,
          userId: employee.id,
          title: `Leave Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
          message: `Your leave request starting ${new Date(leave.startDate).toISOString().split("T")[0]} has been ${status.toLowerCase()} by HR.`,
          type: "LEAVE",
        },
      });
      
      const { sendLeaveStatusEmail } = await import("@/lib/mail");
      await sendLeaveStatusEmail(
        employee.email, 
        leave.leaveType, 
        new Date(leave.startDate).toISOString().split("T")[0], 
        new Date(leave.endDate).toISOString().split("T")[0], 
        status as any, 
        reviewerNotes || undefined
      );

      // Notify Dept Heads
      const deptMemberships = await db.departmentMembership.findMany({ where: { userId: employee.id } });
      const deptIds = deptMemberships.map((d) => d.departmentId);
      const deptHeads = await db.user.findMany({
        where: { deptMemberships: { some: { departmentId: { in: deptIds }, isHead: true } } }
      });

      for (const head of deptHeads) {
        await db.notification.create({
          data: {
            organizationId: orgId,
            userId: head.id,
            title: `Leave Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
            message: `${employee.name || employee.email}'s leave request has been ${status.toLowerCase()} by HR.`,
            type: "LEAVE",
          }
        });
        await sendLeaveStatusEmail(
          head.email, 
          leave.leaveType, 
          new Date(leave.startDate).toISOString().split("T")[0], 
          new Date(leave.endDate).toISOString().split("T")[0], 
          status as any, 
          reviewerNotes ? `(HR Note): ${reviewerNotes}` : undefined
        );
      }
    }
  } catch (err) {
    console.error("Failed to notify users of leave review:", err);
  }

  revalidatePath("/hr/leave");
  revalidatePath("/notifications");
  revalidatePath("/hr/dashboard");

  return { success: true };
}

export async function getHRComplianceMetricsAction(filters?: {
  departmentId?: string;
  month?: number;
  year?: number;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const now = new Date();
  const selectedMonth = filters?.month ?? (now.getMonth() + 1);
  const selectedYear = filters?.year ?? now.getFullYear();

  const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
  const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));

  const users = await db.user.findMany({
    where: {
      orgMemberships: { some: { organizationId: orgId } },
      isActive: true,
      ...(filters?.departmentId
        ? { deptMemberships: { some: { departmentId: filters.departmentId } } }
        : {}),
    },
    include: {
      deptMemberships: { include: { department: true } },
      attendanceRecords: {
        where: {
          organizationId: orgId,
          workDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      leaveRecords: {
        where: {
          organizationId: orgId,
          status: "APPROVED",
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          ],
        },
      },
    },
  });

  return users.map((u: any) => {
    const requiredOfficeDays = u.requiredOfficeDaysPerMonth || 8;
    const actualOfficeDays = u.attendanceRecords.filter((r: { workLocation: any; }) => r.workLocation === WorkLocation.OFFICE).length;
    const remoteDays = u.attendanceRecords.filter((r: { workLocation: any; }) => r.workLocation === WorkLocation.REMOTE).length;
    
    // Calculate leave days overlapping the selected month range
    let leaveDays = 0;
    for (const leave of u.leaveRecords) {
      const lStart = new Date(leave.startDate);
      const lEnd = new Date(leave.endDate);
      const overlapStart = lStart < startDate ? startDate : lStart;
      const overlapEnd = lEnd > endDate ? endDate : lEnd;
      if (overlapStart <= overlapEnd) {
        const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        leaveDays += diffDays;
      }
    }

    const absentDays = Math.max(0, 20 - actualOfficeDays - remoteDays - leaveDays);
    const compliancePercent = Math.min(100, Math.round((actualOfficeDays / Math.max(1, requiredOfficeDays)) * 100));

    return {
      userId: u.id,
      employeeName: u.name || u.email,
      employeeId: u.employeeId || `EMP-${u.id.slice(0, 6).toUpperCase()}`,
      department: u.deptMemberships[0]?.department?.name || "Unassigned",
      workArrangement: u.workArrangement || "HYBRID",
      requiredOfficeDays,
      actualOfficeDays,
      remoteDays,
      absentDays,
      leaveDays,
      compliancePercent,
      isCompliant: compliancePercent >= 80,
    };
  });
}

export async function getHRTransportStipendReportAction(filters?: {
  month?: number;
  year?: number;
  departmentId?: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  // Retrieve transport policy
  const policy = await db.transportStipendPolicy.findFirst({
    where: { organizationId: orgId },
  });

  const ratePerDay = policy?.ratePerOfficeDay || 2500;

  const orgPolicy = await db.attendancePolicy.findFirst({
    where: { organizationId: orgId, scope: "ORGANIZATION" },
    select: { mandatoryOfficeDays: true },
  });
  const defaultMandatoryDays = orgPolicy?.mandatoryOfficeDays || [];

  const selectedMonth = filters?.month || new Date().getMonth() + 1;
  const selectedYear = filters?.year || new Date().getFullYear();
  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0);

  const users = await db.user.findMany({
    where: {
      orgMemberships: { some: { organizationId: orgId } },
      isActive: true,
      ...(filters?.departmentId
        ? { deptMemberships: { some: { departmentId: filters.departmentId } } }
        : {}),
    },
    include: {
      deptMemberships: { include: { department: true } },
      attendanceRecords: {
        where: {
          organizationId: orgId,
          workLocation: WorkLocation.OFFICE,
          status: AttendanceStatus.APPROVED,
          workDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  });

  return users.map((u: any) => {
    const requiredOfficeDays = u.requiredOfficeDaysPerMonth || 8;
    
    // Filter records strictly by approved scheduled office days
    const approvedOfficeRecords = u.attendanceRecords.filter((r: any) => {
      // 1. Must be OFFICE
      if (r.workLocation !== WorkLocation.OFFICE) return false;
      // 2. Must be APPROVED by Head
      if (r.status !== AttendanceStatus.APPROVED) return false;

      // 3. Must be scheduled to work in-office
      const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const dayName = weekdays[r.workDate.getDay()];
      
      if (u.workArrangement === "REMOTE") {
        return false;
      }
      if (u.workArrangement === "OFFICE") {
        return true;
      }
      if (u.workArrangement === "HYBRID") {
        const userDays = u.officeDays || [];
        const mandatoryDays = userDays.length > 0 ? userDays : defaultMandatoryDays;
        return mandatoryDays.includes(dayName);
      }
      return false;
    });

    const actualOfficeDays = approvedOfficeRecords.length;
    const eligibleDays = actualOfficeDays;
    const calculatedStipend = eligibleDays * ratePerDay;

    return {
      userId: u.id,
      employeeName: u.name || u.email,
      employeeId: u.employeeId || `EMP-${u.id.slice(0, 6).toUpperCase()}`,
      department: u.deptMemberships[0]?.department?.name || "Unassigned",
      requiredOfficeDays,
      actualOfficeDays,
      eligibleDays,
      ratePerDay,
      calculatedStipend,
    };
  });
}

export async function getHRDepartmentsOverviewAction() {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  const departments = await db.department.findMany({
    where: { organizationId: orgId },
    include: {
      memberships: {
        include: {
          user: {
            include: {
              attendanceRecords: { take: 1, orderBy: { workDate: "desc" } },
            },
          },
        },
      },
    },
  });

  return departments.map((d: any) => {
    const totalMembers = d.memberships.length;
    const headMembership = d.memberships.find((m: { isHead: any; }) => m.isHead);
    const headName = headMembership?.user?.name || headMembership?.user?.email || "None";

    const officeCount = d.memberships.filter(
      (m: { user: { attendanceRecords: { workLocation: any; }[]; }; }) => m.user.attendanceRecords[0]?.workLocation === WorkLocation.OFFICE
    ).length;

    const remoteCount = d.memberships.filter(
      (m: { user: { attendanceRecords: { workLocation: any; }[]; }; }) => m.user.attendanceRecords[0]?.workLocation === WorkLocation.REMOTE
    ).length;

    const complianceRate = totalMembers > 0 ? Math.round(((officeCount + remoteCount) / totalMembers) * 100) : 100;

    return {
      id: d.id,
      name: d.name,
      description: d.description,
      headName,
      totalMembers,
      officeCount,
      remoteCount,
      complianceRate,
    };
  });
}

export async function updateOrganizationPolicyAction(payload: {
  workStartTime: string;
  workEndTime: string;
  gracePeriodMins: number;
  verificationType: VerificationMethod;
  requiredOfficeDaysPerWeek: number;
  requiredOfficeDaysPerMonth: number;
  mandatoryOfficeDays: string[];
  isFlexible: boolean;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  // 1. Update Organization settings
  await db.organization.update({
    where: { id: orgId },
    data: {
      workStartTime: payload.workStartTime,
      workEndTime: payload.workEndTime,
      gracePeriodMins: payload.gracePeriodMins,
      verificationType: payload.verificationType,
    },
  });

  // 2. Find or create default Organization policy
  const defaultPolicy = await db.attendancePolicy.findFirst({
    where: { organizationId: orgId, scope: PolicyScope.ORGANIZATION },
  });

  if (defaultPolicy) {
    await db.attendancePolicy.update({
      where: { id: defaultPolicy.id },
      data: {
        requiredOfficeDaysPerWeek: payload.requiredOfficeDaysPerWeek,
        requiredOfficeDaysPerMonth: payload.requiredOfficeDaysPerMonth,
        mandatoryOfficeDays: payload.mandatoryOfficeDays,
        isFlexible: payload.isFlexible,
      },
    });
  } else {
    await db.attendancePolicy.create({
      data: {
        organizationId: orgId,
        scope: PolicyScope.ORGANIZATION,
        name: "Organization Default Policy",
        requiredOfficeDaysPerWeek: payload.requiredOfficeDaysPerWeek,
        requiredOfficeDaysPerMonth: payload.requiredOfficeDaysPerMonth,
        mandatoryOfficeDays: payload.mandatoryOfficeDays,
        isFlexible: payload.isFlexible,
      },
    });
  }

  // 3. Create Audit Log
  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: hrUser.id,
      action: "UPDATE_POLICY",
      entity: "Organization",
      entityId: orgId,
      newValue: payload as any,
      ipAddress: "System",
    },
  });

  revalidatePath("/admin/policies");
  revalidatePath("/hr/compliance");

  return { success: true };
}

export async function updateDepartmentWorkArrangementAction(payload: {
  departmentId: string;
  workArrangement: WorkArrangement;
  requiredOfficeDaysPerWeek: number;
  workingHours: string;
}) {
  const hrUser = await requireHR();
  const orgId = hrUser.organizationId;

  // 1. Verify the department belongs to the organization
  const dept = await db.department.findFirst({
    where: { id: payload.departmentId, organizationId: orgId },
  });
  if (!dept) {
    return { success: false, error: "Department not found in your organization." };
  }

  // Calculate requiredOfficeDaysPerWeek and requiredOfficeDaysPerMonth (weekly * 4)
  let requiredOfficeDaysPerWeek = payload.requiredOfficeDaysPerWeek;
  if (payload.workArrangement === "REMOTE") {
    requiredOfficeDaysPerWeek = 0;
  } else if (payload.workArrangement === "OFFICE") {
    requiredOfficeDaysPerWeek = 5;
  }
  const requiredOfficeDaysPerMonth = requiredOfficeDaysPerWeek * 4;

  // 2. Find all user IDs in this department membership
  const memberships = await db.departmentMembership.findMany({
    where: { departmentId: payload.departmentId },
    select: { userId: true },
  });
  const userIds = memberships.map((m) => m.userId);

  if (userIds.length > 0) {
    // 3. Update all users in batch
    await db.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        workArrangement: payload.workArrangement,
        requiredOfficeDaysPerWeek,
        requiredOfficeDaysPerMonth,
        workingHours: payload.workingHours,
      },
    });
  }

  // 4. Create Audit Log
  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: hrUser.id,
      action: "UPDATE_DEPT_WORK_ARRANGEMENT",
      entity: "Department",
      entityId: payload.departmentId,
      newValue: {
        workArrangement: payload.workArrangement,
        requiredOfficeDaysPerWeek: payload.requiredOfficeDaysPerWeek,
        workingHours: payload.workingHours,
        impactedUsers: userIds.length,
      } as any,
      ipAddress: "System",
    },
  });

  revalidatePath("/hr/work-arrangements");
  revalidatePath("/hr/compliance");

  return { success: true, count: userIds.length };
}

// ─── Department CRUD (HR / Org-scoped) ───────────────────────────────────────

export async function getHRDepartmentsAction() {
  const hrUser = await requireHR();
  const departments = await db.department.findMany({
    where: { organizationId: hrUser.organizationId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { memberships: true } },
      memberships: {
        where: { isHead: true },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  return departments;
}

export async function createHRDepartmentAction(data: { name: string; description?: string }) {
  const hrUser = await requireHR();
  try {
    const dept = await db.department.create({
      data: { organizationId: hrUser.organizationId, name: data.name, description: data.description },
    });
    await db.auditLog.create({
      data: {
        organizationId: hrUser.organizationId,
        userId: hrUser.id,
        action: "DEPARTMENT_CREATED",
        entity: "Department",
        entityId: dept.id,
        newValue: { name: data.name, description: data.description },
      },
    });
    revalidatePath("/hr/departments");
    return { success: true, department: dept };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create department." };
  }
}

export async function updateHRDepartmentAction(
  id: string,
  data: { name: string; description?: string; headUserId?: string | null }
) {
  const hrUser = await requireHR();
  const dept = await db.department.findFirst({
    where: { id, organizationId: hrUser.organizationId },
    include: {
      memberships: {
        where: { isHead: true },
      },
    },
  });
  if (!dept) return { success: false, error: "Department not found." };

  try {
    const updated = await db.department.update({
      where: { id },
      data: { name: data.name, description: data.description },
    });

    const previousHeadUserId = dept.memberships[0]?.userId || null;
    const newHeadUserId = data.headUserId || null;

    if (newHeadUserId !== previousHeadUserId) {
      await db.$transaction(async (tx) => {
        // 1. Remove head status from all existing members of this department
        await tx.departmentMembership.updateMany({
          where: { departmentId: id },
          data: { isHead: false },
        });

        // 2. If there is a new head user
        if (newHeadUserId) {
          // Upsert department membership as head
          await tx.departmentMembership.upsert({
            where: {
              departmentId_userId: {
                departmentId: id,
                userId: newHeadUserId,
              },
            },
            update: { isHead: true },
            create: {
              departmentId: id,
              userId: newHeadUserId,
              isHead: true,
            },
          });

          // Check and update organization membership to DEPARTMENT_HEAD if they are currently an EMPLOYEE
          const orgMembership = await tx.organizationMembership.findUnique({
            where: {
              organizationId_userId: {
                organizationId: hrUser.organizationId,
                userId: newHeadUserId,
              },
            },
          });
          if (orgMembership && orgMembership.role === Role.EMPLOYEE) {
            await tx.organizationMembership.update({
              where: { id: orgMembership.id },
              data: { role: Role.DEPARTMENT_HEAD },
            });
          }
        }

        // 3. Revert old head's role to EMPLOYEE if they are no longer head of any other department
        if (previousHeadUserId) {
          const otherHeadships = await tx.departmentMembership.count({
            where: {
              userId: previousHeadUserId,
              isHead: true,
              departmentId: { not: id },
            },
          });

          if (otherHeadships === 0) {
            const oldOrgMembership = await tx.organizationMembership.findUnique({
              where: {
                organizationId_userId: {
                  organizationId: hrUser.organizationId,
                  userId: previousHeadUserId,
                },
              },
            });
            if (oldOrgMembership && oldOrgMembership.role === Role.DEPARTMENT_HEAD) {
              await tx.organizationMembership.update({
                where: { id: oldOrgMembership.id },
                data: { role: Role.EMPLOYEE },
              });
            }
          }
        }
      });
    }

    await db.auditLog.create({
      data: {
        organizationId: hrUser.organizationId,
        userId: hrUser.id,
        action: "DEPARTMENT_UPDATED",
        entity: "Department",
        entityId: id,
        previousValue: { name: dept.name, description: dept.description, headUserId: previousHeadUserId },
        newValue: { name: data.name, description: data.description, headUserId: newHeadUserId },
      },
    });

    revalidatePath("/hr/departments");
    return { success: true, department: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update department." };
  }
}

export async function getHRAvailableHeadsAction() {
  const hrUser = await requireHR();
  const members = await db.organizationMembership.findMany({
    where: {
      organizationId: hrUser.organizationId,
      user: { isActive: true },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: {
      user: { name: "asc" },
    },
  });
  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name || m.user.email,
    email: m.user.email,
  }));
}

export async function deleteHRDepartmentAction(id: string) {
  const hrUser = await requireHR();
  const dept = await db.department.findFirst({ where: { id, organizationId: hrUser.organizationId } });
  if (!dept) return { success: false, error: "Department not found." };
  try {
    await db.department.delete({ where: { id } });
    await db.auditLog.create({
      data: {
        organizationId: hrUser.organizationId,
        userId: hrUser.id,
        action: "DEPARTMENT_DELETED",
        entity: "Department",
        entityId: id,
        previousValue: { name: dept.name },
      },
    });
    revalidatePath("/hr/departments");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete department." };
  }
}
