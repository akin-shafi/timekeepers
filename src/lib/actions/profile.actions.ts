"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getMyProfileAction() {
  const authUser = await requireAuth();

  try {
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        orgMemberships: { where: { organizationId: authUser.organizationId } },
        deptMemberships: { include: { department: true } },
      },
    });

    if (!user) {
      return { success: false, error: "Profile not found." };
    }

    return {
      success: true,
      data: {
        // Editable
        name: user.name || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
        // Read-only
        email: user.email,
        employeeId: user.employeeId || `EMP-${user.id.slice(0, 6).toUpperCase()}`,
        jobTitle: user.jobTitle || "Staff",
        role: user.orgMemberships[0]?.role || Role.EMPLOYEE,
        department: user.deptMemberships[0]?.department?.name || "Unassigned",
        employmentStatus: user.employmentStatus || "ACTIVE",
        workArrangement: user.workArrangement || "HYBRID",
        requiredOfficeDaysPerWeek: user.requiredOfficeDaysPerWeek ?? 2,
        requiredOfficeDaysPerMonth: user.requiredOfficeDaysPerMonth ?? 8,
        workingHours: user.workingHours || "09:00 - 17:00",
        dateJoined: user.dateJoined || user.createdAt,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load profile." };
  }
}

export async function updateMyProfileAction({
  name,
  phone,
  avatarUrl,
  jobTitle,
  employmentStatus,
}: {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  jobTitle?: string;
  employmentStatus?: string;
}) {
  const authUser = await requireAuth();

  try {
    const trimmedName = name?.trim();
    if (trimmedName !== undefined && trimmedName.length === 0) {
      return { success: false, error: "Display name cannot be empty." };
    }

    const existing = await db.user.findUnique({
      where: { id: authUser.id },
      select: { name: true, phone: true, avatarUrl: true, jobTitle: true, employmentStatus: true },
    });

    if (!existing) {
      return { success: false, error: "Profile not found." };
    }

    const dataToUpdate: {
      name?: string;
      phone?: string | null;
      avatarUrl?: string | null;
      jobTitle?: string | null;
      employmentStatus?: string;
    } = {
      ...(trimmedName !== undefined ? { name: trimmedName } : {}),
      ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl.trim() || null } : {}),
      ...(jobTitle !== undefined ? { jobTitle: jobTitle.trim() || null } : {}),
      ...(employmentStatus !== undefined ? { employmentStatus } : {}),
    };

    await db.user.update({
      where: { id: authUser.id },
      data: dataToUpdate,
    });

    await db.auditLog.create({
      data: {
        organizationId: authUser.organizationId,
        userId: authUser.id,
        action: "PROFILE_SELF_UPDATED",
        entity: "User",
        entityId: authUser.id,
        previousValue: {
          name: existing.name,
          phone: existing.phone,
          avatarUrl: existing.avatarUrl,
        },
        newValue: dataToUpdate,
      },
    });

    revalidatePath("/employee/profile");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile." };
  }
}
