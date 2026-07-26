"use client";

import React, { useState } from "react";
import { Mail, Plus, Shield, UserPlus, Clipboard, Check, X, RefreshCw, Layers } from "lucide-react";
import { useSession } from "next-auth/react";
import { inviteUserAction } from "@/lib/actions/admin.actions";
import { inviteUsersBulkAction, revokeInvitationAction } from "@/lib/actions/invite.actions";

interface InviteSectionProps {
  departments: { id: string; name: string }[];
  pendingInvitations: {
    id: string;
    email: string;
    role: string;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    department: { name: string } | null;
  }[];
  defaultDepartmentId?: string;
  hideRoleSelect?: boolean;
  organizationId?: string;
}

export function InviteSection({
  departments,
  pendingInvitations,
  defaultDepartmentId = "",
  hideRoleSelect = false,
  organizationId,
}: InviteSectionProps) {
  const { data: session } = useSession();
  const currentRole = session?.user?.role;
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Single Invite States
  const [singleEmail, setSingleEmail] = useState("");
  const [singleDeptId, setSingleDeptId] = useState(defaultDepartmentId);
  const [singleRole, setSingleRole] = useState("EMPLOYEE");
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [singleError, setSingleError] = useState("");
  const [singleSuccess, setSingleSuccess] = useState("");

  // Bulk Invite States
  const [bulkEmailsText, setBulkEmailsText] = useState("");
  const [bulkDeptId, setBulkDeptId] = useState(defaultDepartmentId);
  const [bulkRole, setBulkRole] = useState("EMPLOYEE");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccessSummary, setBulkSuccessSummary] = useState("");
  const [bulkFailures, setBulkFailures] = useState<{ email: string; error: string }[]>([]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleSubmitting(true);
    setSingleError("");
    setSingleSuccess("");

    try {
      const res = await inviteUserAction({
        email: singleEmail,
        departmentId: singleDeptId || undefined,
        role: singleRole as any,
        organizationId,
      });

      if (res.success) {
        setSingleSuccess(`Successfully invited ${singleEmail}!`);
        setSingleEmail("");
        setSingleDeptId(defaultDepartmentId);
        setSingleRole("EMPLOYEE");
      } else {
        setSingleError(res.error || "Failed to send invitation.");
      }
    } catch (err: any) {
      setSingleError(err.message || "An unexpected error occurred.");
    } finally {
      setSingleSubmitting(false);
    }
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSubmitting(true);
    setBulkError("");
    setBulkSuccessSummary("");
    setBulkFailures([]);

    const parsedEmails = bulkEmailsText
      .split(/[,\n;]+/)
      .map((e) => e.trim())
      .filter((e) => !!e && e.includes("@"));

    if (parsedEmails.length === 0) {
      setBulkError("Please enter at least one valid email address.");
      setBulkSubmitting(false);
      return;
    }

    try {
      const res = await inviteUsersBulkAction({
        emails: parsedEmails,
        departmentId: bulkDeptId || undefined,
        role: bulkRole as any,
        organizationId,
      });

      if (res.success) {
        setBulkSuccessSummary(`Successfully created ${res.invitedCount} invitations!`);
        if (res.failedEmails && res.failedEmails.length > 0) {
          setBulkFailures(res.failedEmails);
        } else {
          setBulkEmailsText("");
          setBulkDeptId(defaultDepartmentId);
          setBulkRole("EMPLOYEE");
        }
      } else {
        setBulkError(res.error || "Failed to process bulk invitations.");
      }
    } catch (err: any) {
      setBulkError(err.message || "An unexpected error occurred during bulk processing.");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleCopyLink = (token: string, id: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const inviteUrl = `${baseUrl}/auth/onboard?token=${token}`;
    
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    try {
      const res = await revokeInvitationAction(id);
      if (!res.success) {
        alert(res.error || "Failed to revoke invitation.");
      }
    } catch (err: any) {
      alert(err.message || "Error revoking invitation.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Invite Form Card */}
      <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-500" /> Send Staff Invite
            </h3>
          </div>

          {/* Tab buttons */}
          <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl mb-4 border border-gray-200/50 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "single"
                  ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Mail className="h-3.5 w-3.5" /> Single
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bulk")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "bulk"
                  ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Bulk Invite
            </button>
          </div>

          {activeTab === "single" ? (
            /* Single Invite Form */
            <form onSubmit={handleSingleInvite} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="e.g. employee@getrova.com"
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={hideRoleSelect ? "col-span-2" : ""}>
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                    Department
                  </label>
                  <select
                    disabled={!!defaultDepartmentId}
                    value={singleDeptId}
                    onChange={(e) => setSingleDeptId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Dept</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!hideRoleSelect && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                      Role
                    </label>
                    <select
                      value={singleRole}
                      onChange={(e) => setSingleRole(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="DEPARTMENT_HEAD">Dept Head</option>
                      {currentRole === "SUPER_ADMIN" && (
                        <>
                          <option value="HR">HR Officer</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {singleError && (
                <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                  {singleError}
                </div>
              )}

              {singleSuccess && (
                <div className="p-3 text-xs rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {singleSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={singleSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 transition-all shadow-md shadow-emerald-600/30"
              >
                {singleSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Create Invitation
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Bulk Invite Form */
            <form onSubmit={handleBulkInvite} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                  Invite List Emails
                </label>
                <textarea
                  required
                  rows={4}
                  value={bulkEmailsText}
                  onChange={(e) => setBulkEmailsText(e.target.value)}
                  placeholder="e.g. employee1@getrova.com&#10;employee2@getrova.com&#10;employee3@getrova.com"
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-450 outline-none focus:ring-1 focus:ring-emerald-500 resize-none transition-all font-mono"
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                  Supports newlines, commas, or semicolons as delimiters.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={hideRoleSelect ? "col-span-2" : ""}>
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                    Department
                  </label>
                  <select
                    disabled={!!defaultDepartmentId}
                    value={bulkDeptId}
                    onChange={(e) => setBulkDeptId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Dept</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!hideRoleSelect && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                      Role
                    </label>
                    <select
                      value={bulkRole}
                      onChange={(e) => setBulkRole(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="DEPARTMENT_HEAD">Dept Head</option>
                      {currentRole === "SUPER_ADMIN" && (
                        <>
                          <option value="HR">HR Officer</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {bulkError && (
                <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                  {bulkError}
                </div>
              )}

              {bulkSuccessSummary && (
                <div className="p-3 text-xs rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {bulkSuccessSummary}
                </div>
              )}

              {bulkFailures.length > 0 && (
                <div className="p-3 text-[11px] rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 space-y-1.5 max-h-[120px] overflow-y-auto">
                  <p className="font-semibold">Some emails failed domain checks:</p>
                  <ul className="list-disc list-inside space-y-0.5 font-mono text-[10px]">
                    {bulkFailures.map((f, i) => (
                      <li key={i} title={f.error}>
                        {f.email}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={bulkSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 transition-all shadow-md shadow-emerald-600/30"
              >
                {bulkSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Send Bulk Invites
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Invitations List Card */}
      <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-500" /> Pending Invitations ({pendingInvitations.length})
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Actively generated onboarding links waiting to be accepted. Copy and share with the user.
        </p>

        <div className="overflow-y-auto max-h-[380px] space-y-3 pr-1">
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400 dark:text-slate-500 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
              No pending invitations. Create one using the form.
            </div>
          ) : (
            pendingInvitations.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-gray-50/50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800/80 gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-gray-900 dark:text-white">{invite.email}</span>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 dark:bg-slate-850 text-gray-600 dark:text-slate-450 border border-gray-300 dark:border-slate-800">
                      {invite.role}
                    </span>
                    {invite.department && (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        {invite.department.name}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Expires: {new Date(invite.expiresAt).toLocaleDateString()} at {new Date(invite.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(invite.token, invite.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 transition-colors"
                  >
                    {copiedId === invite.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-3.5 w-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRevoke(invite.id)}
                    className="flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Revoke Invitation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
