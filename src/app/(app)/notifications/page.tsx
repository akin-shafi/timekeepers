import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { NotificationsList } from "@/components/layout/NotificationsList";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  const notifications = await db.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return <NotificationsList initialNotifications={notifications} />;
}
