import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { FileCheck, Sparkles, Building, Clock, MapPin, Check, X, HelpCircle, ShieldAlert, Laptop, User } from "lucide-react";
import { Avatar } from "@/components/layout/Avatar";
import { reviewCorrectionRequestAction } from "@/lib/actions/correction.actions";

export default async function DepartmentCorrectionsPage() {
  const reviewer = await getCurrentUser();
  if (!reviewer) return null;

  // Find department of this user (either as head or as member)
  const userDept = await db.departmentMembership.findFirst({
    where: { userId: reviewer.id },
    select: { departmentId: true, isHead: true },
  });

  const isDeptHead = userDept?.isHead || false;

  // If the user is a Group Manager (not Dept Head, Admin, or HR), scope to their groups
  let allowedUserIds: string[] | undefined = undefined;
  if (reviewer.role !== "SUPER_ADMIN" && reviewer.role !== "HR" && !isDeptHead) {
    const managedGroups = await db.group.findMany({
      where: { managerId: reviewer.id },
      include: {
        memberships: { select: { userId: true } },
      },
    });
    allowedUserIds = managedGroups.flatMap((g: { memberships: any[]; }) => g.memberships.map((m: { userId: any; }) => m.userId));
  }

  // Fetch pending correction requests
  const pendingCorrections = await db.attendanceCorrection.findMany({
    where: {
      status: "PENDING",
      ...(allowedUserIds ? { userId: { in: allowedUserIds } } : {}),
    },
    include: {
      user: true,
      attendanceRecord: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileCheck className="h-6 w-6 text-amber-400" /> Pending Correction Requests Review
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Review and approve or reject employee attendance correction requests</p>
      </div>

      <div className="space-y-4">
        {pendingCorrections.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl text-center text-gray-400 dark:text-slate-500">
            No pending attendance correction requests to review.
          </div>
        ) : (
          pendingCorrections.map((c) => (
            <div key={c.id} className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <Avatar src={c.user.avatarUrl} name={c.user.name} email={c.user.email} className="h-10 w-10 ring-1 ring-gray-250 dark:ring-slate-800" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{c.user.name || c.user.email}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                      Work Date: {new Date(c.workDate).toISOString().split("T")[0]}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PENDING REVIEW
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-gray-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
                <div>
                  <p className="text-gray-500 dark:text-slate-400 font-semibold">Requested Location</p>
                  <p className="text-gray-900 dark:text-white font-bold mt-0.5 flex items-center gap-1">
                    {c.requestedLocation === "OFFICE" ? <Building className="h-3.5 w-3.5 text-brand-400" /> : <Laptop className="h-3.5 w-3.5 text-cyan-400" />}
                    {c.requestedLocation}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 dark:text-slate-400 font-semibold">Requested Check-In</p>
                  <p className="text-gray-900 dark:text-white font-mono mt-0.5">
                    {new Date(c.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 dark:text-slate-400 font-semibold">Requested Check-Out</p>
                  <p className="text-gray-900 dark:text-white font-mono mt-0.5">
                    {c.requestedCheckOut ? new Date(c.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "None"}
                  </p>
                </div>
              </div>

              <div className="text-xs">
                <p className="font-semibold text-gray-600 dark:text-slate-300">Reason Provided:</p>
                <p className="text-gray-500 dark:text-slate-400 mt-1 italic">"{c.reason}"</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <form
                  action={async () => {
                    "use server";
                    await reviewCorrectionRequestAction({
                      correctionId: c.id,
                      status: "REJECTED",
                      reviewerNotes: "Rejected by Department Head.",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                  >
                    <X className="h-4 w-4" /> Reject Request
                  </button>
                </form>

                <form
                  action={async () => {
                    "use server";
                    await reviewCorrectionRequestAction({
                      correctionId: c.id,
                      status: "APPROVED",
                      reviewerNotes: "Approved by Department Head.",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-gray-900 dark:text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/30"
                  >
                    <Check className="h-4 w-4" /> Approve & Update Record
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
