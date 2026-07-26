import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guard";
import { getHREmployeeProfileAction } from "@/lib/actions/hr.actions";
import {
  User,
  Building,
  Briefcase,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle,
  MapPin,
  FileCheck,
  Banknote,
} from "lucide-react";
import { Avatar } from "@/components/layout/Avatar";
import { HREmployeeEditForm } from "@/components/layout/HREmployeeEditForm";

export default async function HREmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const { id } = await params;
  const profile = await getHREmployeeProfileAction(id);

  // Cumulative stipend total
  const totalStipend = profile.stipendCalculations.reduce(
    (sum: number, s: { calculatedStipend: number }) => sum + (s.calculatedStipend || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Navigation Top Bar */}
      <div>
        <Link
          href="/hr/employees"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Employee Directory
        </Link>
      </div>

      {/* Main Profile Header */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar src={profile.user.avatarUrl} name={profile.user.name} email={profile.user.email} className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 object-cover" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{profile.user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {profile.user.employmentStatus}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {profile.user.jobTitle} • {profile.user.department} Department
            </p>
            <p className="text-[11px] font-mono text-cyan-300 mt-0.5">ID: {profile.user.employeeId}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gray-100 dark:bg-slate-900/80 px-4 py-2 rounded-2xl border border-gray-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Compliance</p>
            <p className="text-lg font-bold text-emerald-400">{profile.attendanceSummary.compliancePercent}%</p>
          </div>

          <div className="bg-gray-100 dark:bg-slate-900/80 px-4 py-2 rounded-2xl border border-gray-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Work Arrangement</p>
            <p className="text-sm font-bold text-purple-300">{profile.workArrangement.arrangement}</p>
          </div>

          <HREmployeeEditForm
            userId={profile.user.id}
            initial={{
              name: profile.user.name,
              email: profile.user.email,
              phone: profile.user.phone,
              jobTitle: profile.user.jobTitle,
              avatarUrl: profile.user.avatarUrl,
              employmentStatus: profile.user.employmentStatus,
              workArrangement: profile.workArrangement.arrangement,
              role: profile.user.role,
            }}
          />
        </div>
      </div>

      {/* Grid: Basic Info & Work Setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
            <User className="h-4 w-4 text-emerald-400" /> Basic & Contact Information
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-400 dark:text-slate-500">Email Address</p>
              <p className="font-medium text-gray-700 dark:text-slate-200 mt-0.5">{profile.user.email}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-slate-500">Phone Number</p>
              <p className="font-medium text-gray-700 dark:text-slate-200 mt-0.5">{profile.user.phone}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-slate-500">System Role</p>
              <p className="font-medium text-gray-700 dark:text-slate-200 mt-0.5">{profile.user.role}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-slate-500">Date Joined</p>
              <p className="font-medium text-gray-700 dark:text-slate-200 mt-0.5">
                {new Date(profile.user.dateJoined).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Work Arrangement Details */}
        <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
            <Briefcase className="h-4 w-4 text-purple-400" /> Work Arrangement & Requirements
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-400 dark:text-slate-500">Required Office Days / Week</p>
              <p className="font-semibold text-purple-300 mt-0.5">
                {profile.workArrangement.requiredOfficeDaysPerWeek} Days
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-slate-500">Required Office Days / Month</p>
              <p className="font-semibold text-purple-300 mt-0.5">
                {profile.workArrangement.requiredOfficeDaysPerMonth} Days
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-slate-500">Mandatory Office Days</p>
              <p className="font-medium text-gray-700 dark:text-slate-200 mt-0.5">
                {profile.workArrangement.officeDays.join(", ") || "Flexible"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-slate-500">Standard Working Hours</p>
              <p className="font-medium text-gray-700 dark:text-slate-200 mt-0.5">{profile.workArrangement.workingHours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
          <Clock className="h-4 w-4 text-cyan-400" /> Attendance Summary (Last 30 Working Days)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-gray-200 dark:border-slate-800">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Office Days</p>
            <p className="text-xl font-bold text-brand-400">{profile.attendanceSummary.officeDays}</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-gray-200 dark:border-slate-800">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Remote Days</p>
            <p className="text-xl font-bold text-cyan-400">{profile.attendanceSummary.remoteDays}</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-gray-200 dark:border-slate-800">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Late Arrivals</p>
            <p className="text-xl font-bold text-amber-400">{profile.attendanceSummary.lateDays}</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-gray-200 dark:border-slate-800">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Absent Days</p>
            <p className="text-xl font-bold text-rose-400">{profile.attendanceSummary.absentDays}</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-gray-200 dark:border-slate-800">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Leave Days</p>
            <p className="text-xl font-bold text-purple-400">{profile.attendanceSummary.leaveDays}</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-gray-200 dark:border-slate-800">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Avg Hours/Day</p>
            <p className="text-xl font-bold text-emerald-400">{profile.attendanceSummary.averageHoursPerDay} hrs</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-gray-200 dark:border-slate-800">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Compliance Rate</p>
            <p className="text-xl font-bold text-emerald-400">{profile.attendanceSummary.compliancePercent}%</p>
          </div>
        </div>
      </div>

      {/* Stipend Summary Card */}
      {profile.stipendCalculations.length > 0 && (
        <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
            <Banknote className="h-4 w-4 text-emerald-400" /> Transport Stipend Summary
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-3 text-center">
              <p className="text-[11px] text-emerald-400/70">Total Stipend Earned</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">
                ₦{totalStipend.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-center">
              <p className="text-[11px] text-gray-500 dark:text-slate-400">Months Calculated</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                {profile.stipendCalculations.length}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-center">
              <p className="text-[11px] text-gray-500 dark:text-slate-400">Last Calculated</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                {new Date(profile.stipendCalculations[0].createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Per-month breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-100 dark:bg-slate-900/80 text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Office Days</th>
                  <th className="px-4 py-3">Stipend Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
                {profile.stipendCalculations.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono">
                      {new Date(s.year, s.month - 1).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">{s.officeDaysCount} days</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      ₦{(s.calculatedStipend || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      <div className="glass-panel rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-400" /> Complete Attendance History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-100 dark:bg-slate-900/80 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Check-In</th>
                <th className="px-6 py-4">Check-Out</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
              {profile.attendanceHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400 dark:text-slate-500">
                    No attendance records found for this employee.
                  </td>
                </tr>
              ) : (
                profile.attendanceHistory.map((rec, index) => {
                  const date = new Date(rec.workDate);
                  const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
                  const dayName = weekdays[date.getDay()];
                  const arrangement = profile.workArrangement.arrangement;
                  const officeDays = profile.workArrangement.officeDays || [];

                  let expected = "REMOTE";
                  if (arrangement === "OFFICE") {
                    expected = "OFFICE";
                  } else if (arrangement === "HYBRID") {
                    expected = officeDays.includes(dayName) ? "OFFICE" : "REMOTE";
                  }

                  const isMismatchedRemote = rec.workLocation === "REMOTE" && expected === "OFFICE";

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 font-mono w-12">{index + 1}</td>
                      <td className="px-6 py-4 font-mono">
                        {date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {isMismatchedRemote ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-500/10 text-rose-455 dark:text-rose-400 border-rose-500/30 w-fit">
                              {rec.workLocation} (Mismatch)
                            </span>
                            <span className="text-[9px] font-semibold text-rose-500 dark:text-rose-400 tracking-wide font-sans">
                              Expected: Office
                            </span>
                          </div>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              rec.workLocation === "OFFICE"
                                ? "bg-brand-500/10 text-brand-600 dark:text-brand-300 border-brand-500/30"
                                : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/30"
                            }`}
                          >
                            {rec.workLocation}
                          </span>
                        )}
                      </td>
                    <td className="px-6 py-4 font-mono text-emerald-400">
                      {new Date(rec.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 font-mono text-amber-400">
                      {rec.checkOutTime
                        ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "--:--"}
                    </td>
                    <td className="px-6 py-4 font-mono">{rec.hoursWorked?.toFixed(1) || "0.0"} hrs</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[10px] font-semibold">
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                          rec.verificationStatus === "VERIFIED" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        <CheckCircle className="h-3 w-3" /> {rec.verificationStatus}
                      </span>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
