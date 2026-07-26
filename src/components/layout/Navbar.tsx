"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Clock, LogOut, Bell, Menu, X, Check } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar } from "./Avatar";
import {
  getUnreadNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/lib/actions/notification.actions";

function NotificationBellDropdown() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await getUnreadNotificationsAction();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    if (session) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (!dropdownOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await markNotificationAsReadAction(id);
      if (res.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await markAllNotificationsAsReadAction();
      if (res.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="View notifications"
        onClick={toggleDropdown}
        className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-900 leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-3 z-50 text-left animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
              <span className="font-bold text-xs text-gray-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] text-brand-500 hover:text-brand-400 dark:text-brand-400 font-semibold"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/40">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">
                  No notifications.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={async () => {
                      if (!n.isRead) {
                        await markNotificationAsReadAction(n.id);
                        fetchNotifications();
                      }
                    }}
                    className={`py-2 flex items-start justify-between gap-2 cursor-pointer transition-colors hover:bg-gray-50/50 dark:hover:bg-slate-800/20 ${
                      n.isRead ? "opacity-60" : "font-semibold"
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <p className="text-xs text-gray-900 dark:text-slate-200 leading-snug">{n.title}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-normal">{n.message}</p>
                      <span className="text-[8px] text-gray-400 dark:text-slate-500 font-mono">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="text-gray-400 hover:text-brand-500 dark:text-slate-500 dark:hover:text-brand-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 shrink-0"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 pt-2 text-center">
              <a
                href="/notifications"
                onClick={() => setDropdownOpen(false)}
                className="text-[10px] font-bold text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
              >
                View all notifications
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    HR: "Human Resources",
    DEPARTMENT_HEAD: "Department Head",
    EMPLOYEE: "Employee",
  };

  const roleBadgeColor: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-500/20 text-purple-600 border-purple-500/30 dark:text-purple-300",
    HR: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30 dark:text-emerald-300",
    DEPARTMENT_HEAD: "bg-amber-500/20 text-amber-600 border-amber-500/30 dark:text-amber-300",
    EMPLOYEE: "bg-sky-500/20 text-sky-600 border-sky-500/30 dark:text-sky-300",
  };

  const currentRole = user?.role || "EMPLOYEE";
  const displayRoleLabel = roleLabel[currentRole] || "Employee";
  const displayRoleBadge = roleBadgeColor[currentRole] || roleBadgeColor.EMPLOYEE;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-gray-200 dark:border-slate-800">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Left: App Brand & Org Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-lg shadow-brand-500/30">
            <Clock className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">Time Keeper</span>
            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              Organization: <span className="text-gray-700 dark:text-slate-200 font-medium">{user?.organizationName || ""}</span>
            </p>
          </div>
          {/* Mobile-only brand (shorter) */}
          <span className="sm:hidden font-bold text-base text-gray-900 dark:text-white tracking-tight">Time Keeper</span>
        </div>

        {/* Right: Desktop controls */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />

          <NotificationBellDropdown />

          <div className="h-6 w-px bg-gray-200 dark:bg-slate-800" />

          <div className="flex items-center gap-3">
            <Avatar src={user?.image} name={user?.name} email={user?.email} className="h-9 w-9 ring-2 ring-brand-500/40" />

            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user?.name || user?.email}</p>
              <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${displayRoleBadge}`}>
                {displayRoleLabel}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Mobile: Notification + Hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />

          <NotificationBellDropdown />

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 py-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar src={user?.image} name={user?.name} email={user?.email} className="h-10 w-10 ring-2 ring-brand-500/40" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || user?.email}</p>
              <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${displayRoleBadge}`}>
                {displayRoleLabel}
              </span>
            </div>
          </div>

          {/* Organization */}
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Organization: <span className="text-gray-700 dark:text-slate-200 font-medium">{user?.organizationName || ""}</span>
          </p>

          <div className="h-px w-full bg-gray-200 dark:bg-slate-800" />

          {/* Sign out button */}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex w-full items-center justify-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2.5 rounded-lg transition-colors border border-red-200 dark:border-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
