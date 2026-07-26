"use client";

import React, { useState } from "react";
import {
  createHRDepartmentAction,
  updateHRDepartmentAction,
  deleteHRDepartmentAction,
} from "@/lib/actions/hr.actions";
import { Plus, Pencil, Trash2, Building, Users, X, Check } from "lucide-react";

interface DeptWithCounts {
  id: string;
  name: string;
  description: string | null;
  _count: { memberships: number };
  memberships: { userId: string; user: { name: string | null; email: string } }[];
}

interface AvailableHead {
  id: string;
  name: string;
  email: string;
}

type ModalMode = "create" | "edit" | null;

export function DepartmentManager({ 
  departments,
  availableHeads = []
}: { 
  departments: DeptWithCounts[];
  availableHeads?: AvailableHead[];
}) {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<DeptWithCounts | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [headUserId, setHeadUserId] = useState("");

  const openCreate = () => {
    setName("");
    setDescription("");
    setHeadUserId("");
    setEditing(null);
    setError("");
    setSuccess("");
    setModalMode("create");
  };

  const openEdit = (d: DeptWithCounts) => {
    setName(d.name);
    setDescription(d.description || "");
    setHeadUserId(d.memberships[0]?.userId || "");
    setEditing(d);
    setError("");
    setSuccess("");
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditing(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (modalMode === "create") {
        const res = await createHRDepartmentAction({ name, description });
        if (!res.success) setError(res.error || "Failed to create department.");
        else {
          // If a head was specified, we also call the update action to set it!
          if (headUserId && res.department) {
            await updateHRDepartmentAction(res.department.id, { name, description, headUserId });
          }
          setSuccess(`Department "${name}" created.`);
          closeModal();
        }
      } else if (modalMode === "edit" && editing) {
        const res = await updateHRDepartmentAction(editing.id, { 
          name, 
          description, 
          headUserId: headUserId || null 
        });
        if (!res.success) setError(res.error || "Failed to update department.");
        else {
          setSuccess(`Department "${name}" updated.`);
          closeModal();
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (d: DeptWithCounts) => {
    if (!confirm(`Delete "${d.name}"?\n\nThis removes the department. Members will be unassigned. This cannot be undone.`)) return;
    setError("");
    setSuccess("");
    try {
      const res = await deleteHRDepartmentAction(d.id);
      if (!res.success) setError(res.error || "Failed to delete department.");
      else setSuccess(`"${d.name}" has been deleted.`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {departments.length} department{departments.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-emerald-600/25 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Department
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {departments.map((d) => {
          const head = d.memberships[0]?.user;
          return (
            <div key={d.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-gray-100 dark:border-slate-800/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{d.name}</h3>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 line-clamp-1">{d.description || "No description"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(d)}
                      className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-2 text-xs text-gray-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Members</span>
                  <span className="font-bold text-gray-900 dark:text-white">{d._count.memberships}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Head</span>
                  <span className="font-semibold text-amber-500">{head ? (head.name || head.email) : "None"}</span>
                </div>
              </div>
            </div>
          );
        })}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400 dark:text-slate-500">
            <Building className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No departments yet. Create one to get started.</p>
          </div>
        )}
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {modalMode === "create" ? "Create Department" : `Edit: ${editing?.name}`}
              </h2>
              <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Platform Engineering"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of department scope..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                  Department Head
                </label>
                <select
                  value={headUserId}
                  onChange={(e) => setHeadUserId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">No Department Head (Unassigned)</option>
                  {availableHeads.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} disabled={submitting} className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-emerald-600/25 transition-colors disabled:opacity-50">
                  {submitting ? "Saving..." : modalMode === "create" ? (<><Plus className="h-4 w-4" /> Create</>) : (<><Check className="h-4 w-4" /> Save Changes</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
