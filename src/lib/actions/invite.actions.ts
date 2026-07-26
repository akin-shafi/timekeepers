"use server";

import { db } from "@/lib/db";
import { requireSuperAdmin, requireDepartmentHead } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendInvitationEmail } from "@/lib/mail";

export async function verifyInvitationTokenAction(token: string) {
  try {
    const invite = await db.invitation.findUnique({
      where: { token },
      include: {
        organization: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    if (!invite) {
      return { success: false, error: "Invitation not found." };
    }

    if (invite.status !== "PENDING") {
      return { success: false, error: `This invitation has already been ${invite.status.toLowerCase()}.` };
    }

    if (new Date() > invite.expiresAt) {
      return { success: false, error: "This invitation has expired." };
    }

    return {
      success: true,
      invitation: {
        email: invite.email,
        role: invite.role,
        organizationName: invite.organization.name,
        departmentName: invite.department?.name || null,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to verify invitation." };
  }
}

export async function acceptInvitationAction(
  token: string,
  data: {
    name: string;
    jobTitle: string;
    phone: string;
  }
) {
  try {
    const invite = await db.invitation.findUnique({
      where: { token },
    });

    if (!invite) {
      return { success: false, error: "Invitation not found." };
    }

    if (invite.status !== "PENDING") {
      return { success: false, error: `This invitation has already been ${invite.status.toLowerCase()}.` };
    }

    if (new Date() > invite.expiresAt) {
      return { success: false, error: "This invitation has expired." };
    }

    // Wrap in transactional execution to guarantee all memberships are created
    await db.$transaction(async (tx) => {
      // 1. Create or Find User
      const user = await tx.user.upsert({
        where: { email: invite.email },
        update: {
          name: data.name,
          jobTitle: data.jobTitle,
          phone: data.phone,
          isActive: true,
          dateJoined: new Date(),
        },
        create: {
          email: invite.email,
          name: data.name,
          jobTitle: data.jobTitle,
          phone: data.phone,
          isActive: true,
          dateJoined: new Date(),
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${invite.email}`,
        },
      });

      // 2. Create Organization Membership
      await tx.organizationMembership.upsert({
        where: {
          organizationId_userId: {
            organizationId: invite.organizationId,
            userId: user.id,
          },
        },
        update: { role: invite.role },
        create: {
          organizationId: invite.organizationId,
          userId: user.id,
          role: invite.role,
        },
      });

      // 3. Create Department Membership (if applicable)
      if (invite.departmentId) {
        await tx.departmentMembership.upsert({
          where: {
            departmentId_userId: {
              departmentId: invite.departmentId,
              userId: user.id,
            },
          },
          update: {},
          create: {
            departmentId: invite.departmentId,
            userId: user.id,
            isHead: invite.role === Role.DEPARTMENT_HEAD,
          },
        });
      }

      // 4. Update Invitation status
      await tx.invitation.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
      });

      // 5. Log audit trail
      await tx.auditLog.create({
        data: {
          organizationId: invite.organizationId,
          userId: user.id,
          action: "INVITATION_ACCEPTED",
          entity: "User",
          entityId: user.id,
          newValue: { email: invite.email, role: invite.role, departmentId: invite.departmentId },
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to accept invitation." };
  }
}

export async function revokeInvitationAction(invitationId: string) {
  try {
    const admin = await requireSuperAdmin();

    const invite = await db.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId: admin.organizationId,
      },
    });

    if (!invite) {
      return { success: false, error: "Invitation not found or unauthorized." };
    }

    await db.invitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED" },
    });

    await db.auditLog.create({
      data: {
        organizationId: admin.organizationId,
        userId: admin.id,
        action: "INVITATION_REVOKED",
        entity: "Invitation",
        entityId: invitationId,
        newValue: { status: "REVOKED" },
      },
    });

    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to revoke invitation." };
  }
}

export async function inviteUsersBulkAction({
  emails,
  departmentId,
  role = Role.EMPLOYEE,
  organizationId,
}: {
  emails: string[];
  departmentId?: string;
  role?: Role;
  organizationId?: string;
}) {
  try {
    const inviter = await requireDepartmentHead();

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

    const org = await db.organization.findUnique({
      where: { id: targetOrgId },
    });

    if (!org) {
      return { success: false, error: "Organization not found." };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    let invitedCount = 0;
    const failedEmails: { email: string; error: string }[] = [];

    // Filter unique clean emails from user input
    const uniqueEmails = Array.from(
      new Set(
        emails
          .map((e) => e.toLowerCase().trim())
          .filter((e) => !!e && e.includes("@"))
      )
    );

    for (const email of uniqueEmails) {
      const domain = email.split("@")[1];

      // Domain check
      if (org.allowedDomains.length > 0 && !org.allowedDomains.includes(domain)) {
        failedEmails.push({
          email,
          error: `Email domain (@${domain}) is not authorized for ${org.name}. Only [${org.allowedDomains.join(", ")}] allowed.`,
        });
        continue;
      }

      try {
        // Create invitation
        const invitation = await db.invitation.create({
          data: {
            organizationId: targetOrgId,
            departmentId: departmentId || null,
            email,
            role,
            invitedById: inviter.id,
            expiresAt,
          },
        });

        // Create audit log
        await db.auditLog.create({
          data: {
            organizationId: targetOrgId,
            userId: inviter.id,
            action: "USER_INVITED",
            entity: "Invitation",
            entityId: invitation.id,
            newValue: { email, role, departmentId },
          },
        });

        // Send invitation email
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const inviteLink = `${baseUrl}/auth/onboard?token=${invitation.token}`;
        await sendInvitationEmail(email, org.name, inviteLink, role);

        invitedCount++;
      } catch (err: any) {
        failedEmails.push({
          email,
          error: err.message || "Database insert failed.",
        });
      }
    }

    revalidatePath("/admin/employees");
    revalidatePath("/dept/members");

    return {
      success: true,
      invitedCount,
      failedEmails,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to process bulk invitations." };
  }
}

