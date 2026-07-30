"use server";

import { db } from "@/lib/db";
import { requireSuperAdmin, requireRole, requireAuth } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

import { VerificationMethod } from "@prisma/client";

/**
 * Fetch all organizations (Super Admin only).
 */
export async function getOrganizationsAction() {
  const admin = await requireSuperAdmin();

  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          memberships: true,
          departments: true,
          officeLocations: true,
        },
      },
    },
  });

  return { success: true, organizations: orgs };
}

/**
 * Create a new organization (Super Admin only).
 */
export async function createOrganizationAction(data: {
  name: string;
  slug: string;
  allowedDomains: string[];
  timezone?: string;
  workStartTime?: string;
  workEndTime?: string;
  gracePeriodMins?: number;
  verificationType?: VerificationMethod;
  aiMilestoneSummaryEnabled?: boolean;
}) {
  try {
    const admin = await requireSuperAdmin();

    const org = await db.organization.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase().trim().replace(/\s+/g, "-"),
        allowedDomains: data.allowedDomains,
        timezone: data.timezone || "UTC",
        workStartTime: data.workStartTime || "09:00",
        workEndTime: data.workEndTime || "17:00",
        gracePeriodMins: data.gracePeriodMins ?? 15,
        verificationType: data.verificationType || VerificationMethod.SELF_DECLARATION,
        aiMilestoneSummaryEnabled: data.aiMilestoneSummaryEnabled ?? false,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: admin.organizationId,
        userId: admin.id,
        action: "ORGANIZATION_CREATED",
        entity: "Organization",
        entityId: org.id,
        newValue: { name: org.name, slug: org.slug, verificationType: org.verificationType },
      },
    });

    revalidatePath("/admin/organizations");
    return { success: true, organization: org };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { success: false, error: "An organization with that slug already exists." };
    }
    return { success: false, error: err.message || "Failed to create organization." };
  }
}

/**
 * Update an existing organization (Super Admin only).
 */
export async function updateOrganizationAction(
  orgId: string,
  data: {
    name?: string;
    allowedDomains?: string[];
    timezone?: string;
    workStartTime?: string;
    workEndTime?: string;
    gracePeriodMins?: number;
    verificationType?: VerificationMethod;
    aiMilestoneSummaryEnabled?: boolean;
  }
) {
  try {
    const admin = await requireSuperAdmin();

    const existing = await db.organization.findUnique({ where: { id: orgId } });
    if (!existing) {
      return { success: false, error: "Organization not found." };
    }

    const org = await db.organization.update({
      where: { id: orgId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.allowedDomains !== undefined && { allowedDomains: data.allowedDomains }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.workStartTime !== undefined && { workStartTime: data.workStartTime }),
        ...(data.workEndTime !== undefined && { workEndTime: data.workEndTime }),
        ...(data.gracePeriodMins !== undefined && { gracePeriodMins: data.gracePeriodMins }),
        ...(data.verificationType !== undefined && { verificationType: data.verificationType }),
        ...(data.aiMilestoneSummaryEnabled !== undefined && { aiMilestoneSummaryEnabled: data.aiMilestoneSummaryEnabled }),
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: admin.organizationId,
        userId: admin.id,
        action: "ORGANIZATION_UPDATED",
        entity: "Organization",
        entityId: org.id,
        previousValue: {
          name: existing.name,
          timezone: existing.timezone,
          workStartTime: existing.workStartTime,
          workEndTime: existing.workEndTime,
          verificationType: existing.verificationType,
        },
        newValue: {
          name: org.name,
          timezone: org.timezone,
          workStartTime: org.workStartTime,
          workEndTime: org.workEndTime,
          verificationType: org.verificationType,
        },
      },
    });

    revalidatePath("/admin/organizations");
    return { success: true, organization: org };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update organization." };
  }
}

/**
 * Delete an organization (Super Admin only). Cascades to all related data.
 */
export async function deleteOrganizationAction(orgId: string) {
  try {
    const admin = await requireSuperAdmin();

    const existing = await db.organization.findUnique({ where: { id: orgId } });
    if (!existing) {
      return { success: false, error: "Organization not found." };
    }

    // Prevent deleting your own organization
    if (orgId === admin.organizationId) {
      return { success: false, error: "You cannot delete the organization you are currently logged into." };
    }

    await db.organization.delete({ where: { id: orgId } });

    await db.auditLog.create({
      data: {
        organizationId: admin.organizationId,
        userId: admin.id,
        action: "ORGANIZATION_DELETED",
        entity: "Organization",
        entityId: orgId,
        previousValue: { name: existing.name, slug: existing.slug },
      },
    });

    revalidatePath("/admin/organizations");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete organization." };
  }
}

/**
 * Fetch organization settings for the current user (Accessible to all authenticated users).
 */
export async function getOrganizationSettingsAction() {
  try {
    const user = await requireAuth();
    
    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        disabledModules: true,
      },
    });

    if (!org) return { success: false, error: "Organization not found" };

    return { success: true, settings: org };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch settings" };
  }
}

/**
 * Update the disabled modules list for an organization (HR or Super Admin only).
 */
export async function updateOrganizationModulesAction(orgId: string, disabledModules: string[]) {
  try {
    const user = await requireRole(["SUPER_ADMIN", "HR"]);
    
    if (user.role === "HR" && user.organizationId !== orgId) {
      return { success: false, error: "You do not have permission to modify this organization." };
    }

    const org = await db.organization.update({
      where: { id: orgId },
      data: {
        disabledModules,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        action: "ORGANIZATION_MODULES_UPDATED",
        entity: "Organization",
        entityId: org.id,
        newValue: { disabledModules },
      },
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/admin/organizations/" + orgId);
    return { success: true, organization: org };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update organization modules." };
  }
}
