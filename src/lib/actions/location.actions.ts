"use server";

import { db } from "@/lib/db";
import { requireSuperAdmin, requireRole } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

/**
 * Fetch all office locations for a specified organization (defaults to admin's organization).
 */
export async function getOfficeLocationsAction(orgId?: string) {
  try {
    const user = await requireRole(["SUPER_ADMIN", "HR"]);
    const targetOrgId = user.role === "SUPER_ADMIN" ? (orgId || user.organizationId) : user.organizationId;

    const locations = await db.officeLocation.findMany({
      where: {
        organizationId: targetOrgId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, locations };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch office locations." };
  }
}

/**
 * Create a new office location.
 */
export async function createOfficeLocationAction(data: {
  organizationId?: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  allowedIPs?: string[];
  allowedSSIDs?: string[];
}) {
  try {
    const user = await requireRole(["SUPER_ADMIN", "HR"]);
    const targetOrgId = user.role === "SUPER_ADMIN" ? (data.organizationId || user.organizationId) : user.organizationId;

    const location = await db.officeLocation.create({
      data: {
        organizationId: targetOrgId,
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters ?? 100.0,
        allowedIPs: data.allowedIPs ?? [],
        allowedSSIDs: data.allowedSSIDs ?? [],
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: targetOrgId,
        userId: user.id,
        action: "OFFICE_LOCATION_CONFIGURED",
        entity: "OfficeLocation",
        entityId: location.id,
        newValue: {
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          radiusMeters: location.radiusMeters,
        },
      },
    });

    revalidatePath("/admin/locations");
    revalidatePath("/hr/locations");
    return { success: true, location };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create office location." };
  }
}

/**
 * Update an existing office location.
 */
export async function updateOfficeLocationAction(
  id: string,
  data: {
    organizationId?: string;
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    allowedIPs?: string[];
    allowedSSIDs?: string[];
    isActive?: boolean;
  }
) {
  try {
    const user = await requireRole(["SUPER_ADMIN", "HR"]);

    const existing = await db.officeLocation.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Office location not found." };
    }

    // HR can only modify locations of their own organization
    if (user.role === "HR" && existing.organizationId !== user.organizationId) {
      return { success: false, error: "Unauthorized access to this location." };
    }

    const location = await db.officeLocation.update({
      where: { id },
      data: {
        ...(user.role === "SUPER_ADMIN" && data.organizationId !== undefined && { organizationId: data.organizationId }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.radiusMeters !== undefined && { radiusMeters: data.radiusMeters }),
        ...(data.allowedIPs !== undefined && { allowedIPs: data.allowedIPs }),
        ...(data.allowedSSIDs !== undefined && { allowedSSIDs: data.allowedSSIDs }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    const targetOrgId = user.role === "SUPER_ADMIN" 
      ? (data.organizationId || existing.organizationId)
      : user.organizationId;

    await db.auditLog.create({
      data: {
        organizationId: targetOrgId,
        userId: user.id,
        action: "OFFICE_LOCATION_UPDATED",
        entity: "OfficeLocation",
        entityId: location.id,
        previousValue: {
          organizationId: existing.organizationId,
          name: existing.name,
          address: existing.address,
          latitude: existing.latitude,
          longitude: existing.longitude,
          radiusMeters: existing.radiusMeters,
          isActive: existing.isActive,
        },
        newValue: {
          organizationId: location.organizationId,
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          radiusMeters: location.radiusMeters,
          isActive: location.isActive,
        },
      },
    });

    revalidatePath("/admin/locations");
    revalidatePath("/hr/locations");
    return { success: true, location };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update office location." };
  }
}

/**
 * Delete an office location.
 */
export async function deleteOfficeLocationAction(id: string) {
  try {
    const user = await requireRole(["SUPER_ADMIN", "HR"]);

    const existing = await db.officeLocation.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Office location not found." };
    }

    // HR can only delete locations of their own organization
    if (user.role === "HR" && existing.organizationId !== user.organizationId) {
      return { success: false, error: "Unauthorized access to this location." };
    }

    await db.officeLocation.delete({
      where: { id },
    });

    await db.auditLog.create({
      data: {
        organizationId: existing.organizationId,
        userId: user.id,
        action: "OFFICE_LOCATION_DELETED",
        entity: "OfficeLocation",
        entityId: id,
        previousValue: {
          name: existing.name,
          address: existing.address,
        },
      },
    });

    revalidatePath("/admin/locations");
    revalidatePath("/hr/locations");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete office location." };
  }
}
