import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendCheckOutReminderEmail } from "@/lib/mail";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  
  // Enforce CRON_SECRET authorization check
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Fetch active users with a check-in record today that has not checked out yet
    const activeUsers = await db.user.findMany({
      where: {
        isActive: true,
        orgMemberships: {
          some: {},
        },
      },
      include: {
        orgMemberships: {
          include: {
            organization: true,
          },
        },
        attendanceRecords: {
          where: {
            workDate: today,
            checkOutTime: null,
            status: {
              in: ["CHECKED_IN", "WORKING", "LATE", "APPROVED", "REMOTE", "OFFICE", "PENDING_APPROVAL"],
            },
          },
        },
      },
    });

    // Users with active incomplete check-in records today
    const usersToRemind = activeUsers.filter(
      (user) => user.attendanceRecords.length > 0
    );

    let sentCount = 0;
    for (const user of usersToRemind) {
      const primaryOrg = user.orgMemberships[0]?.organization;
      if (!primaryOrg) continue;

      await sendCheckOutReminderEmail(user.email, user.name || user.email, primaryOrg.name);
      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed check-out reminders. Sent ${sentCount} emails.`,
      sentCount,
    });
  } catch (error: any) {
    console.error("❌ Error in check-out reminder cron:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process cron" },
      { status: 500 }
    );
  }
}
