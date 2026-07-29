import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendCheckInReminderEmail } from "@/lib/mail";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  
  // Enforce CRON_SECRET authorization check
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Fetch active users and check if they have check-in records for today
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
          },
        },
      },
    });

    // Filter users who do not have an attendance record today
    const usersToRemind = activeUsers.filter(
      (user) => user.attendanceRecords.length === 0
    );

    let sentCount = 0;
    for (const user of usersToRemind) {
      const primaryOrg = user.orgMemberships[0]?.organization;
      if (!primaryOrg) continue;

      await sendCheckInReminderEmail(user.email, user.name || user.email, primaryOrg.name);
      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed reminders. Sent ${sentCount} check-in emails.`,
      sentCount,
    });
  } catch (error: any) {
    console.error("❌ Error in check-in reminder cron:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process cron" },
      { status: 500 }
    );
  }
}
