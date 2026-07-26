import { db } from "@/lib/db";
import { StipendType, WorkLocation, AttendanceStatus } from "@prisma/client";

export interface CalculateStipendOptions {
  organizationId: string;
  year: number;
  month: number; // 1 - 12
}

export async function calculateMonthlyStipendForOrg({ organizationId, year, month }: CalculateStipendOptions) {
  // Get active transport stipend policy
  const policy = await db.transportStipendPolicy.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  const ratePerOfficeDay = policy?.ratePerOfficeDay ?? 2500; // default rate
  const fixedMonthlyStipend = policy?.fixedMonthlyStipend ?? 20000;
  const stipendType = policy?.stipendType ?? StipendType.PER_OFFICE_DAY;
  const maxMonthlyStipend = policy?.maxMonthlyStipend ?? 50000;
  const minRequiredAttendanceDays = policy?.minRequiredAttendanceDays ?? 4;

  // Define month date range
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Fetch default organization policy for fallback
  const orgPolicy = await db.attendancePolicy.findFirst({
    where: { organizationId, scope: "ORGANIZATION" },
    select: { mandatoryOfficeDays: true },
  });
  const defaultMandatoryDays = orgPolicy?.mandatoryOfficeDays || [];

  // Fetch all users in organization
  const orgMemberships = await db.organizationMembership.findMany({
    where: { organizationId },
    include: { user: true },
  });

  const results = [];

  for (const membership of orgMemberships) {
    const userId = membership.userId;

    // Fetch attendance records for the month
    const records = await db.attendanceRecord.findMany({
      where: {
        organizationId,
        userId,
        workDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Statuses that represent actual work performed
    const WORKED_STATUSES: Set<AttendanceStatus> = new Set([
      AttendanceStatus.APPROVED,
      AttendanceStatus.CHECKED_OUT,
      AttendanceStatus.WORKING,
      AttendanceStatus.CHECKED_IN,
      AttendanceStatus.LATE,
    ]);

    const actualOfficeDays = records.filter((r) => {
      // 1. Must be checked in as OFFICE
      if (r.workLocation !== WorkLocation.OFFICE) return false;
      // 2. Must be a valid worked status
      if (!WORKED_STATUSES.has(r.status)) return false;
      // 3. Must not be a weekend (Sat=6, Sun=0)
      const dayOfWeek = r.workDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return false;
      
      // 4. Must be scheduled to work from the office
      const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const dayName = weekdays[dayOfWeek];
      
      if (membership.user.workArrangement === "REMOTE") {
        return false;
      }
      if (membership.user.workArrangement === "OFFICE") {
        return true;
      }
      if (membership.user.workArrangement === "HYBRID") {
        const userDays = membership.user.officeDays || [];
        const mandatoryDays = userDays.length > 0 ? userDays : defaultMandatoryDays;
        return mandatoryDays.includes(dayName);
      }
      return false;
    }).length;

    const remoteDays = records.filter((r) => {
      if (r.workLocation !== WorkLocation.REMOTE) return false;
      if (!WORKED_STATUSES.has(r.status)) return false;
      const dayOfWeek = r.workDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return false;
      return true;
    }).length;

    // Fetch approved leave days
    const leaveRecords = await db.leaveRecord.findMany({
      where: {
        organizationId,
        userId,
        status: "APPROVED",
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    const leaveDays = leaveRecords.reduce((acc, curr) => {
      const start = curr.startDate < startDate ? startDate : curr.startDate;
      const end = curr.endDate > endDate ? endDate : curr.endDate;
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return acc + diffDays;
    }, 0);

    // Retrieve staff required office days per month
    const requiredOfficeDays = membership.user.requiredOfficeDaysPerMonth || 8;
    const absentDays = Math.max(0, requiredOfficeDays - actualOfficeDays - leaveDays);

    let calculatedStipend = 0;
    const eligibleOfficeDays = actualOfficeDays;

    if (stipendType === StipendType.PER_OFFICE_DAY) {
      if (actualOfficeDays >= minRequiredAttendanceDays) {
        calculatedStipend = actualOfficeDays * ratePerOfficeDay;
        if (maxMonthlyStipend && calculatedStipend > maxMonthlyStipend) {
          calculatedStipend = maxMonthlyStipend;
        }
      } else {
        calculatedStipend = 0;
      }
    } else if (stipendType === StipendType.FIXED_MONTHLY) {
      if (actualOfficeDays >= requiredOfficeDays) {
        calculatedStipend = fixedMonthlyStipend;
      } else if (actualOfficeDays >= minRequiredAttendanceDays) {
        calculatedStipend = (actualOfficeDays / requiredOfficeDays) * fixedMonthlyStipend;
      } else {
        calculatedStipend = 0;
      }
    }

    // Upsert into TransportStipendCalculation
    const calcRecord = await db.transportStipendCalculation.upsert({
      where: {
        organizationId_userId_year_month: {
          organizationId,
          userId,
          year,
          month,
        },
      },
      update: {
        requiredOfficeDays,
        actualOfficeDays,
        eligibleOfficeDays,
        remoteDays,
        absentDays,
        leaveDays,
        calculatedStipend: Math.round(calculatedStipend * 100) / 100,
        updatedAt: new Date(),
      },
      create: {
        organizationId,
        userId,
        year,
        month,
        requiredOfficeDays,
        actualOfficeDays,
        eligibleOfficeDays,
        remoteDays,
        absentDays,
        leaveDays,
        calculatedStipend: Math.round(calculatedStipend * 100) / 100,
        status: "FINALIZED",
      },
      include: {
        user: {
          include: {
            deptMemberships: {
              include: { department: true },
            },
          },
        },
      },
    });

    results.push(calcRecord);
  }

  return results;
}
