"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

export async function getUnreadNotificationsAction() {
  try {
    const user = await requireAuth();
    const notifications = await db.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });
    const unreadCount = await db.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });
    return { success: true, notifications, unreadCount };
  } catch (err: any) {
    return { success: false, notifications: [], unreadCount: 0, error: err.message };
  }
}

export async function markNotificationAsReadAction(id: string) {
  try {
    const user = await requireAuth();
    await db.notification.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: {
        isRead: true,
      },
    });
    revalidatePath("/notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const user = await requireAuth();
    await db.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
    revalidatePath("/notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
