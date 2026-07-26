"use client";

import React, { useState, useTransition } from "react";
import { Bell, AlertTriangle, FileCheck, CalendarDays } from "lucide-react";
import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from "@/lib/actions/notification.actions";
import { useRouter } from "next/navigation";

export function NotificationsList({ initialNotifications }: { initialNotifications: any[] }) {
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync state with props when page revalidates
  React.useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    startTransition(async () => {
      await markNotificationAsReadAction(id);
      router.refresh();
    });
  };

  const handleMarkAllAsRead = () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(async () => {
      await markAllNotificationsAsReadAction();
      router.refresh();
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CORRECTION":
        return <FileCheck className="h-5 w-5 text-purple-500" />;
      case "LEAVE":
        return <CalendarDays className="h-5 w-5 text-amber-500" />;
      case "EXCEPTION":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-brand-500" />;
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand-500 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Bell className="h-3.5 w-3.5" /> Notifications Center
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">All Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Stay updated with check-in alerts, leave approvals, and exception reports.</p>
        </div>

        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-50"
          >
            Mark All Read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            filter === "ALL"
              ? "border-brand-500 text-brand-500 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            filter === "UNREAD"
              ? "border-brand-500 text-brand-500 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-3xl border border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-500">
            No notifications found.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`glass-panel p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? "border-gray-200 dark:border-slate-800/80 opacity-60 hover:opacity-80"
                  : "border-brand-500/20 bg-brand-500/5 dark:bg-brand-500/5 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 mt-0.5">
                  {getTypeIcon(n.type)}
                </span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {n.title}
                    {!n.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-slate-350 mt-1.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-2">
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
