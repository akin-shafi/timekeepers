"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";
import { sendNewLeaveRequestEmail } from "@/lib/mail";

export interface SubmitLeavePayload {
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
}

export async function submitLeaveRequestAction(payload: SubmitLeavePayload): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    
    if (end < start) {
      return { success: false, error: "End date cannot be before start date." };
    }

    const daysCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const leave = await db.leaveRecord.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        startDate: start,
        endDate: end,
        daysCount,
        leaveType: payload.leaveType,
        reason: payload.reason,
        status: "PENDING",
      },
    });

    try {
      // Find HR users
      const hrUsers = await db.user.findMany({
        where: { 
          orgMemberships: { 
            some: { 
              organizationId: user.organizationId,
              role: { in: ["HR", "SUPER_ADMIN"] }
            }
          }
        }
      });

      // Find Dept Heads
      const deptMemberships = await db.departmentMembership.findMany({
        where: { userId: user.id }
      });
      const deptIds = deptMemberships.map((d) => d.departmentId);
      
      const deptHeads = await db.user.findMany({
        where: {
          deptMemberships: { some: { departmentId: { in: deptIds }, isHead: true } }
        }
      });

      // Unique reviewers
      const reviewers = [...hrUsers, ...deptHeads].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

      for (const reviewer of reviewers) {
        await db.notification.create({
          data: {
            organizationId: user.organizationId,
            userId: reviewer.id,
            title: "New Leave Request",
            message: `${user.name || user.email} requested ${payload.leaveType} leave from ${payload.startDate} to ${payload.endDate}.`,
            type: "LEAVE",
          }
        });

        const isHR = hrUsers.some(hr => hr.id === reviewer.id);
        const reviewLink = isHR
          ? `${process.env.NEXT_PUBLIC_APP_URL}/hr/leave`
          : `${process.env.NEXT_PUBLIC_APP_URL}/dept/leave`;

        await sendNewLeaveRequestEmail(
          reviewer.email,
          user.name || user.email,
          payload.leaveType,
          payload.startDate,
          payload.endDate,
          payload.reason || "None",
          reviewLink
        );
      }
    } catch (err) {
      console.error("Failed to notify reviewers:", err);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit leave request." };
  }
}

export async function getUpcomingAndCurrentLeavesAction() {
  try {
    const user = await requireAuth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);

    const leaves = await db.leaveRecord.findMany({
      where: {
        organizationId: user.organizationId,
        status: "APPROVED",
        endDate: { gte: today },
        startDate: { lte: twoWeeksFromNow }
      },
      include: {
        user: { select: { name: true, employeeId: true, deptMemberships: { include: { department: true } } } }
      },
      orderBy: { startDate: "asc" }
    });

    return { success: true, leaves };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch leaves bulletin." };
  }
}
