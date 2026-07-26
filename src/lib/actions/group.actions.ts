"use server";

import { db } from "@/lib/db";
import { requireDepartmentHead, requireAuth } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

// Helper to get caller's department
async function getCallerDepartment(userId: string) {
  const membership = await db.departmentMembership.findFirst({
    where: { userId, isHead: true },
    include: { department: true },
  });
  if (!membership || !membership.department) {
    throw new Error("Unauthorized: You are not assigned as Head of any department.");
  }
  return membership.department;
}

export async function getGroupsAction() {
  const user = await requireDepartmentHead();
  const dept = await getCallerDepartment(user.id);

  const groups = await db.group.findMany({
    where: { departmentId: dept.id },
    include: {
      manager: {
        select: { id: true, name: true, email: true },
      },
      memberships: {
        include: {
          user: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return groups;
}

export async function createGroupAction(data: {
  name: string;
  description?: string;
  managerId?: string | null;
}) {
  const user = await requireDepartmentHead();
  const dept = await getCallerDepartment(user.id);

  try {
    const group = await db.group.create({
      data: {
        departmentId: dept.id,
        name: data.name.trim(),
        description: data.description?.trim(),
        managerId: data.managerId || null,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "GROUP_CREATED",
        entity: "Group",
        entityId: group.id,
        newValue: { name: data.name, managerId: data.managerId },
      },
    });

    revalidatePath("/dept/teams");
    return { success: true, group };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create team." };
  }
}

export async function updateGroupAction(
  id: string,
  data: {
    name: string;
    description?: string;
    managerId?: string | null;
  }
) {
  const user = await requireDepartmentHead();
  const dept = await getCallerDepartment(user.id);

  const group = await db.group.findFirst({
    where: { id, departmentId: dept.id },
  });
  if (!group) return { success: false, error: "Team not found." };

  try {
    const updated = await db.group.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        managerId: data.managerId || null,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "GROUP_UPDATED",
        entity: "Group",
        entityId: id,
        previousValue: { name: group.name, managerId: group.managerId },
        newValue: { name: data.name, managerId: data.managerId },
      },
    });

    revalidatePath("/dept/teams");
    return { success: true, group: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update team." };
  }
}

export async function deleteGroupAction(id: string) {
  const user = await requireDepartmentHead();
  const dept = await getCallerDepartment(user.id);

  const group = await db.group.findFirst({
    where: { id, departmentId: dept.id },
  });
  if (!group) return { success: false, error: "Team not found." };

  try {
    await db.group.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "GROUP_DELETED",
        entity: "Group",
        entityId: id,
        previousValue: { name: group.name },
      },
    });

    revalidatePath("/dept/teams");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete team." };
  }
}

export async function manageGroupMembersAction(groupId: string, userIds: string[]) {
  const user = await requireDepartmentHead();
  const dept = await getCallerDepartment(user.id);

  const group = await db.group.findFirst({
    where: { id: groupId, departmentId: dept.id },
  });
  if (!group) return { success: false, error: "Team not found." };

  try {
    await db.$transaction(async (tx) => {
      // Clear existing members
      await tx.groupMembership.deleteMany({
        where: { groupId },
      });

      // Add new members
      if (userIds.length > 0) {
        await tx.groupMembership.createMany({
          data: userIds.map((userId) => ({
            groupId,
            userId,
          })),
        });
      }
    });

    revalidatePath("/dept/teams");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update team members." };
  }
}
