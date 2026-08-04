"use server";

import { db } from "@/lib/db";
import { requireSuperAdmin, requireDepartmentHead, requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendInvitationEmail } from "@/lib/mail";

export async function inviteUserAction({
  email,
  departmentId,
  role = Role.EMPLOYEE,
  organizationId,
}: {
  email: string;
  departmentId?: string;
  role?: Role;
  organizationId?: string;
}) {
  const inviter = await requireDepartmentHead();
  const cleanEmail = email.toLowerCase().trim();

  // Validate which organization to invite to.
  // Super Admin can invite to any organization if organizationId is passed.
  // Otherwise, fallback/enforce the inviter's organizationId.
  let targetOrgId = inviter.organizationId;
  if (organizationId) {
    if (inviter.role === Role.SUPER_ADMIN) {
      targetOrgId = organizationId;
    } else if (organizationId !== inviter.organizationId) {
      return { success: false, error: "Forbidden: You cannot invite users to another organization." };
    }
  }

  // Role hierarchy validation:
  // - SUPER_ADMIN can invite to any role
  // - HR can invite only DEPARTMENT_HEAD, EMPLOYEE
  // - DEPARTMENT_HEAD can invite only EMPLOYEE
  if (inviter.role === Role.HR) {
    if (role === Role.SUPER_ADMIN || role === Role.HR) {
      return { success: false, error: "Forbidden: HR Officers cannot invite Super Admins or other HR Officers." };
    }
  } else if (inviter.role === Role.DEPARTMENT_HEAD) {
    if (role !== Role.EMPLOYEE) {
      return { success: false, error: "Forbidden: Department Heads can only invite Employees." };
    }
  } else if (inviter.role !== Role.SUPER_ADMIN) {
    return { success: false, error: "Forbidden: You are not authorized to invite users." };
  }

  // Validate domain restriction
  const domain = cleanEmail.split("@")[1];
  const org = await db.organization.findUnique({
    where: { id: targetOrgId },
  });

  if (!org) {
    return { success: false, error: "Organization not found." };
  }

  if (org.allowedDomains.length > 0 && !org.allowedDomains.includes(domain)) {
    return {
      success: false,
      error: `Email domain (@${domain}) is not authorized for organization ${org.name}. Only [${org.allowedDomains.join(", ")}] allowed.`,
    };
  }

  // Create or update invitation
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  const invitation = await db.invitation.create({
    data: {
      organizationId: targetOrgId,
      departmentId,
      email: cleanEmail,
      role,
      invitedById: inviter.id,
      expiresAt,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: targetOrgId,
      userId: inviter.id,
      action: "USER_INVITED",
      entity: "Invitation",
      entityId: invitation.id,
      newValue: { email: cleanEmail, role, departmentId },
    },
  });

  // Send invitation email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteLink = `${baseUrl}/auth/onboard?token=${invitation.token}`;
  await sendInvitationEmail(cleanEmail, org.name, inviteLink, role);

  revalidatePath("/admin/employees");
  revalidatePath("/dept/members");

  return { success: true, invitation };
}

export async function updateUserRoleAction({
  userId,
  newRole,
  organizationId,
}: {
  userId: string;
  newRole: Role;
  organizationId?: string;
}) {
  const user = await requireRole(["SUPER_ADMIN", "HR"]);

  if (userId === user.id) {
    return { success: false, error: "You cannot modify your own administrative role." };
  }

  // Enforce/default organizationId
  let targetOrgId = user.organizationId;
  if (organizationId) {
    if (user.role === "SUPER_ADMIN") {
      targetOrgId = organizationId;
    } else if (organizationId !== user.organizationId) {
      return { success: false, error: "Forbidden: You cannot modify roles in another organization." };
    }
  }

  const membership = await db.organizationMembership.findFirst({
    where: { organizationId: targetOrgId, userId },
  });

  if (!membership) {
    return { success: false, error: "User membership not found in this organization." };
  }

  // HR hierarchy/escalation checks
  if (user.role === "HR") {
    if (newRole === "SUPER_ADMIN" || newRole === "HR") {
      return { success: false, error: "Forbidden: HR cannot assign Super Admin or HR roles." };
    }
    if (membership.role === "SUPER_ADMIN" || membership.role === "HR") {
      return { success: false, error: "Forbidden: HR cannot modify Super Admin or HR memberships." };
    }
  }

  await db.organizationMembership.update({
    where: { id: membership.id },
    data: { role: newRole },
  });

  await db.auditLog.create({
    data: {
      organizationId: targetOrgId,
      userId: user.id,
      action: "USER_ROLE_UPDATED",
      entity: "User",
      entityId: userId,
      previousValue: { role: membership.role },
      newValue: { role: newRole },
    },
  });

  revalidatePath("/admin/employees");
  revalidatePath("/hr/employees");

  return { success: true };
}

export async function createDepartmentAction({
  name,
  description,
}: {
  name: string;
  description?: string;
}): Promise<{ success: boolean; department?: any; error?: string }> {
  try {
    const admin = await requireSuperAdmin();

    const dept = await db.department.create({
      data: {
        organizationId: admin.organizationId,
        name,
        description,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: admin.organizationId,
        userId: admin.id,
        action: "DEPARTMENT_CREATED",
        entity: "Department",
        entityId: dept.id,
        newValue: { name, description },
      },
    });

    revalidatePath("/admin/departments");

    return { success: true, department: dept };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create department." };
  }
}

export async function configureOfficeLocationAction({
  name,
  address,
  latitude,
  longitude,
  radiusMeters = 100,
  allowedIPs = [],
}: {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  allowedIPs?: string[];
}): Promise<{ success: boolean; location?: any; error?: string }> {
  try {
    const admin = await requireSuperAdmin();

    const location = await db.officeLocation.create({
      data: {
        organizationId: admin.organizationId,
        name,
        address,
        latitude,
        longitude,
        radiusMeters,
        allowedIPs,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: admin.organizationId,
        userId: admin.id,
        action: "OFFICE_LOCATION_CONFIGURED",
        entity: "OfficeLocation",
        entityId: location.id,
        newValue: { name, latitude, longitude, radiusMeters },
      },
    });

    revalidatePath("/admin/locations");

    return { success: true, location };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to configure office location." };
  }
}
