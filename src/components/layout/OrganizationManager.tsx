"use client";

import React, { useState } from "react";
import {
  createOrganizationAction,
  updateOrganizationAction,
  deleteOrganizationAction,
} from "@/lib/actions/organization.actions";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  MapPin,
  Layers,
  X,
  Clock,
  Globe,
  Shield,
  Check,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { VerificationMethod } from "@prisma/client";

interface OrgWithCounts {
  id: string;
  name: string;
  slug: string;
  allowedDomains: string[];
  timezone: string;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMins: number;
  verificationType: string;
  hrApprovalRequiredForCorrection: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    memberships: number;
    departments: number;
    officeLocations: number;
  };
}

interface OrganizationManagerProps {
  organizations: OrgWithCounts[];
}

type ModalMode = "create" | "edit" | null;

export function OrganizationManager({ organizations }: OrganizationManagerProps) {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingOrg, setEditingOrg] = useState<OrgWithCounts | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDomains, setFormDomains] = useState("");
  const [formTimezone, setFormTimezone] = useState("UTC");
  const [formWorkStart, setFormWorkStart] = useState("09:00");
  const [formWorkEnd, setFormWorkEnd] = useState("17:00");
  const [formGrace, setFormGrace] = useState(15);
  const [formVerificationType, setFormVerificationType] = useState<VerificationMethod>("SELF_DECLARATION");

  const openCreateModal = () => {
    setFormName("");
    setFormSlug("");
    setFormDomains("");
    setFormTimezone("UTC");
    setFormWorkStart("09:00");
    setFormWorkEnd("17:00");
    setFormGrace(15);
    setFormVerificationType("SELF_DECLARATION");
    setEditingOrg(null);
    setError("");
    setSuccess("");
    setModalMode("create");
  };

  const openEditModal = (org: OrgWithCounts) => {
    setFormName(org.name);
    setFormSlug(org.slug);
    setFormDomains(org.allowedDomains.join(", "));
    setFormTimezone(org.timezone);
    setFormWorkStart(org.workStartTime);
    setFormWorkEnd(org.workEndTime);
    setFormGrace(org.gracePeriodMins);
    setFormVerificationType(org.verificationType as VerificationMethod);
    setEditingOrg(org);
    setError("");
    setSuccess("");
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingOrg(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const allowedDomains = formDomains
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    try {
      if (modalMode === "create") {
        const res = await createOrganizationAction({
          name: formName,
          slug: formSlug,
          allowedDomains,
          timezone: formTimezone,
          workStartTime: formWorkStart,
          workEndTime: formWorkEnd,
          gracePeriodMins: formGrace,
          verificationType: formVerificationType,
        });
        if (!res.success) {
          setError(res.error || "Failed to create organization.");
        } else {
          setSuccess("Organization created successfully!");
          closeModal();
        }
      } else if (modalMode === "edit" && editingOrg) {
        const res = await updateOrganizationAction(editingOrg.id, {
          name: formName,
          allowedDomains,
          timezone: formTimezone,
          workStartTime: formWorkStart,
          workEndTime: formWorkEnd,
          gracePeriodMins: formGrace,
          verificationType: formVerificationType,
        });
        if (!res.success) {
          setError(res.error || "Failed to update organization.");
        } else {
          setSuccess("Organization updated successfully!");
          closeModal();
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (org: OrgWithCounts) => {
    if (
      !confirm(
        `Are you sure you want to delete "${org.name}"?\n\nThis will permanently remove all departments, members, attendance records, and data associated with this organization. This action cannot be undone.`
      )
    )
      return;

    setError("");
    setSuccess("");

    try {
      const res = await deleteOrganizationAction(org.id);
      if (!res.success) {
        setError(res.error || "Failed to delete organization.");
      } else {
        setSuccess(`"${org.name}" has been deleted.`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {organizations.length} organization{organizations.length !== 1 ? "s" : ""} registered
        </p>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-purple-600/25 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Organization
        </button>
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Organization Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div className="p-5 border-b border-gray-100 dark:border-slate-800/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{org.name}</h3>
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-0.5">{org.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => openEditModal(org)}
                    className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(org)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card Body — Stats */}
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-slate-500 mb-1">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{org._count.memberships}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-medium">Members</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-slate-500 mb-1">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{org._count.departments}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-medium">Depts</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-slate-500 mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{org._count.officeLocations}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-medium">Locations</p>
                </div>
              </div>

              {/* Meta info */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {org.allowedDomains.length > 0 ? org.allowedDomains.map((d) => `@${d}`).join(", ") : "No domain restrictions"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{org.workStartTime} – {org.workEndTime} ({org.timezone})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{org.verificationType.replace(/_/g, " ")} ({org.gracePeriodMins}m grace)</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {organizations.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400 dark:text-slate-500">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No organizations found. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Modal Backdrop + Form */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {modalMode === "create" ? "Create Organization" : `Edit: ${editingOrg?.name}`}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Slug (create only) */}
              {modalMode === "create" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                    Slug (unique identifier) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="e.g. acme-corp"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white font-mono placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              )}

              {/* Allowed Domains */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                  Allowed Email Domains
                </label>
                <input
                  type="text"
                  value={formDomains}
                  onChange={(e) => setFormDomains(e.target.value)}
                  placeholder="e.g. acme.com, acme.co.uk"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Comma-separated list of email domains allowed to register</p>
              </div>

              {/* Work Hours Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                    Work Start Time
                  </label>
                  <input
                    type="time"
                    value={formWorkStart}
                    onChange={(e) => setFormWorkStart(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                    Work End Time
                  </label>
                  <input
                    type="time"
                    value={formWorkEnd}
                    onChange={(e) => setFormWorkEnd(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Timezone & Grace Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={formTimezone}
                    onChange={(e) => setFormTimezone(e.target.value)}
                    placeholder="e.g. Africa/Lagos"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                    Grace Period (mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={formGrace}
                    onChange={(e) => setFormGrace(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Verification Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                  Attendance Verification Method
                </label>
                <select
                  value={formVerificationType}
                  onChange={(e) => setFormVerificationType(e.target.value as VerificationMethod)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="SELF_DECLARATION">Self-Declaration (Honour System)</option>
                  <option value="GPS_GEOFENCE">GPS Geofence (Coordinates & Radius)</option>
                  <option value="WIFI_IP">Wi-Fi IP Whitelist</option>
                </select>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                  Enforces how check-in locations and networks are validated.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-purple-600/25 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    "Saving..."
                  ) : modalMode === "create" ? (
                    <>
                      <Plus className="h-4 w-4" /> Create Organization
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
