"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { sendMailHelper } from "@/lib/mail";

/**
 * Generate a random 6-digit numeric string
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a new AI Summary Token for an employee (or global if userId is null) (HR Only)
 */
export async function createAiTokenAction(userId: string | null, daysValid: number = 7, maxUsage: number = 2) {
  try {
    const hr = await requireAuth();
    if (hr.role !== "HR" && hr.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);

    const token = await db.aiSummaryToken.create({
      data: {
        organization: { connect: { id: hr.organizationId } },
        ...(userId && userId !== "GLOBAL" ? { user: { connect: { id: userId } } } : {}),
        createdBy: { connect: { id: hr.id } },
        code: generateCode(),
        usesLeft: maxUsage,
        expiresAt,
        status: "ACTIVE",
      },
    });

    revalidatePath("/hr/ai-tokens");
    return { success: true, token };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create token" };
  }
}

/**
 * Cancel an existing AI token (HR Only)
 */
export async function cancelAiTokenAction(tokenId: string) {
  try {
    const hr = await requireAuth();
    if (hr.role !== "HR" && hr.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized");
    }

    const token = await db.aiSummaryToken.update({
      where: {
        id: tokenId,
        organizationId: hr.organizationId,
      },
      data: {
        status: "CANCELLED",
      },
    });

    revalidatePath("/hr/ai-tokens");
    return { success: true, token };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to cancel token" };
  }
}

/**
 * Notify all staff about a Global Token
 */
export async function notifyStaffAiTokenAction(tokenId: string) {
  try {
    const hr = await requireAuth();
    if (hr.role !== "HR" && hr.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized");
    }

    const token = await db.aiSummaryToken.findUnique({
      where: {
        id: tokenId,
        organizationId: hr.organizationId,
      },
      include: {
        organization: true,
      }
    });

    if (!token) throw new Error("Token not found");
    if (token.userId) throw new Error("Can only notify staff for global tokens");

    const employees = await db.user.findMany({
      where: {
        orgMemberships: {
          some: { organizationId: hr.organizationId },
        },
        isActive: true,
      },
    });

    const subject = `AI Milestone Summary OTP: ${token.code}`;
    const text = `It's KPI month you can use this OTP (${token.code}) to generate a summary of your Milestone if you have been documenting them weekly on the attendance system.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f3e8ff; padding: 20px; text-align: center;">
          <h2 style="color: #6b21a8; margin: 0;">KPI Month: AI Milestone Summaries</h2>
        </div>
        <div style="padding: 30px; text-align: center;">
          <p style="color: #333; font-size: 16px; line-height: 1.5; text-align: left;">
            It's KPI month! You can use the following OTP to generate a professional summary of your Milestones, provided you have been documenting them weekly on the attendance system.
          </p>
          <div style="margin: 30px 0;">
            <span style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 15px 30px; font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 4px; color: #334155;">
              ${token.code}
            </span>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: left;">
            Enter this code on your dashboard to automatically compile your AI summary.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #eee;">
          Sent on behalf of HR at ${token.organization.name}
        </div>
      </div>
    `;

    // Send emails in parallel but limit concurrency if needed, here we just Promise.all
    // Since it's a small app, Promise.all is fine for now.
    await Promise.all(
      employees
        .filter(emp => emp.email)
        .map(emp => sendMailHelper(emp.email, subject, text, html))
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to notify staff" };
  }
}

