import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Find Grace HR (or any user that is currently logged in, assuming email or name)
    // Or just update all users to have WEDNESDAY and FRIDAY if their requiredOfficeDaysPerWeek is 2
    await db.user.updateMany({
      where: {
        requiredOfficeDaysPerWeek: 2
      },
      data: {
        officeDays: ["WEDNESDAY", "FRIDAY"]
      }
    });

    return NextResponse.json({ success: true, message: "Updated office days for users." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
