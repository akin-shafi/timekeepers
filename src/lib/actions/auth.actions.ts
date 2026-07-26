"use server";

import { db } from "@/lib/db";
import { ALLOWED_DOMAIN } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendWelcomeEmail } from "@/lib/mail";
import { requireAuth } from "@/lib/auth/guard";

export async function registerUserAction({
  email,
  name,
  jobTitle,
  phone,
  departmentId,
  workArrangement,
}: {
  email: string;
  name: string;
  jobTitle: string;
  phone?: string;
  departmentId: string;
  workArrangement?: string;
}) {
  const cleanEmail = email.toLowerCase().trim();
  const cleanName = name.trim();
  const cleanJobTitle = jobTitle.trim();
  const cleanPhone = phone?.trim() || "";
  const resolvedArrangement = workArrangement === "REMOTE" ? "REMOTE" : "HYBRID";

  const isRemote = resolvedArrangement === "REMOTE";
  const requiredOfficeDaysPerWeek = isRemote ? 0 : 2;
  const requiredOfficeDaysPerMonth = isRemote ? 0 : 8;

  // Validate email domain matches Allowed Domain
  const domain = cleanEmail.split("@")[1];
  if (domain !== ALLOWED_DOMAIN) {
    return {
      success: false,
      error: `Unauthorized email domain (@${domain}). Only @${ALLOWED_DOMAIN} is permitted.`,
    };
  }

  try {
    // 1. Get or create the default organization
    const org = await db.organization.upsert({
      where: { slug: "getrova" },
      update: {},
      create: {
        name: "Getrova Inc.",
        slug: "getrova",
        allowedDomains: [ALLOWED_DOMAIN],
        timezone: "UTC",
        workStartTime: "09:00",
        workEndTime: "17:00",
      },
    });

    // 2. Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
      include: {
        orgMemberships: {
          where: { organizationId: org.id },
        },
        deptMemberships: true,
      },
    });

    if (existingUser && existingUser.orgMemberships.length > 0) {
      return {
        success: false,
        error: "An account with this email address already exists. Please sign in instead.",
      };
    }

    // 3. Process registration inside a transaction
    await db.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: cleanEmail },
        update: {
          name: cleanName,
          jobTitle: cleanJobTitle,
          phone: cleanPhone || null,
          workArrangement: resolvedArrangement,
          requiredOfficeDaysPerWeek,
          requiredOfficeDaysPerMonth,
          isActive: true,
        },
        create: {
          email: cleanEmail,
          name: cleanName,
          jobTitle: cleanJobTitle,
          phone: cleanPhone || null,
          workArrangement: resolvedArrangement,
          requiredOfficeDaysPerWeek,
          requiredOfficeDaysPerMonth,
          isActive: true,
          dateJoined: new Date(),
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        },
      });

      // Map to organization
      await tx.organizationMembership.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: user.id,
          },
        },
        update: {
          role: Role.EMPLOYEE,
        },
        create: {
          organizationId: org.id,
          userId: user.id,
          role: Role.EMPLOYEE,
        },
      });

      // Map to department
      if (departmentId) {
        await tx.departmentMembership.upsert({
          where: {
            departmentId_userId: {
              departmentId,
              userId: user.id,
            },
          },
          update: {
            isHead: false,
          },
          create: {
            departmentId,
            userId: user.id,
            isHead: false,
          },
        });
      }

      // Log audit trail
      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          action: "SELF_REGISTRATION",
          entity: "User",
          entityId: user.id,
          newValue: {
            email: cleanEmail,
            role: Role.EMPLOYEE,
            departmentId,
          },
        },
      });
    });

    // Send welcome email advising daily login
    await sendWelcomeEmail(cleanEmail, cleanName, org.name);

    revalidatePath("/hr/reports");
    revalidatePath("/dept/members");

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred during registration.",
    };
  }
}

