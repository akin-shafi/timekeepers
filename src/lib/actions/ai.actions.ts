"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";
import { GoogleGenAI } from "@google/genai";

export async function checkAiFeatureEnabledAction() {
  try {
    const user = await requireAuth();
    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
      select: { aiMilestoneSummaryEnabled: true },
    });
    return { success: true, enabled: org?.aiMilestoneSummaryEnabled ?? false };
  } catch (error) {
    return { success: false, enabled: false };
  }
}

export async function generateMilestoneSummaryAction(otpCode: string) {
  try {
    const user = await requireAuth();

    // 1. Verify organization has feature enabled
    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
    });
    
    if (!org?.aiMilestoneSummaryEnabled) {
      return { success: false, error: "AI Milestone features are disabled for this organization." };
    }

    // 2. Verify OTP
    const token = await db.aiSummaryToken.findUnique({
      where: {
        organizationId_code: {
          organizationId: user.organizationId,
          code: otpCode.trim(),
        },
      },
    });

    if (!token) {
      return { success: false, error: "Invalid OTP code." };
    }
    if (token.userId && token.userId !== user.id) {
      return { success: false, error: "This OTP code is not assigned to you." };
    }
    if (token.status !== "ACTIVE") {
      return { success: false, error: `Token is ${token.status}.` };
    }
    if (new Date() > new Date(token.expiresAt)) {
      await db.aiSummaryToken.update({ where: { id: token.id }, data: { status: "EXPIRED" } });
      return { success: false, error: "This OTP code has expired." };
    }

    // Handle global token vs individual token usage tracking
    if (!token.userId) {
      // Global Token
      const usage = await db.aiSummaryTokenUsage.upsert({
        where: {
          tokenId_userId: { tokenId: token.id, userId: user.id },
        },
        update: {},
        create: {
          tokenId: token.id,
          userId: user.id,
          usesCount: 0,
        },
      });

      if (usage.usesCount >= token.usesLeft) {
        return { success: false, error: `You have reached the maximum allowed uses (${token.usesLeft}) for this global OTP code.` };
      }

      await db.aiSummaryTokenUsage.update({
        where: { id: usage.id },
        data: { usesCount: usage.usesCount + 1 },
      });
    } else {
      // Individual Token
      if (token.usesLeft <= 0) {
        await db.aiSummaryToken.update({ where: { id: token.id }, data: { status: "EXHAUSTED" } });
        return { success: false, error: "This OTP code has run out of uses." };
      }

      const updatedUsesLeft = token.usesLeft - 1;
      await db.aiSummaryToken.update({
        where: { id: token.id },
        data: {
          usesLeft: updatedUsesLeft,
          status: updatedUsesLeft === 0 ? "EXHAUSTED" : "ACTIVE",
        },
      });
    }

    // 4. Fetch User's Milestones (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const milestones = await db.attendanceRecord.findMany({
      where: {
        userId: user.id,
        dailyMilestone: { not: null },
        workDate: { gte: thirtyDaysAgo },
      },
      select: { workDate: true, dailyMilestone: true },
      orderBy: { workDate: 'asc' }
    });

    if (milestones.length === 0) {
      return { success: false, error: "You don't have any milestones logged in the last 30 days to summarize." };
    }

    const milestoneText = milestones
      .map((m) => `- ${new Date(m.workDate).toLocaleDateString()}: ${m.dailyMilestone}`)
      .join("\n");

    // 5. Generate with Gemini
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: "Gemini API key is not configured on the server." };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are a professional HR assistant. Based on the following daily work milestones submitted by an employee over the last month, generate a professional, KPI-worthy result summary that can be used for performance reviews. Keep it concise, highlight key achievements, use bullet points, and maintain a professional and encouraging tone.\n\nMilestones:\n${milestoneText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });

    return { success: true, summary: response.text };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return { success: false, error: error.message || "Failed to generate AI summary." };
  }
}
