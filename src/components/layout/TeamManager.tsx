"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Users, X, Check, ShieldCheck, UserCheck } from "lucide-react";
import { createGroupAction, updateGroupAction, deleteGroupAction, manageGroupMembersAction } from "@/lib/actions/group.actions";

interface Member {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
}

interface GroupWithRelations {
  id: string;
  name: string;
  description: string | null;
  managerId: string | null;
  manager: { id: string; name: string | null; email: string } | null;
  memberships: {
    user: { id: string; name: string | null; email: string; jobTitle: string | null };
  }[];
}

interface TeamManagerProps {
  groups: GroupWithRelations[];
  departmentMembers: Member[];
}

type ModalMode = "create" | "edit" | "members" | null;

export function TeamManager({ groups, departmentMembers }: TeamManagerProps) {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingGroup, setEditingGroup] = useState<GroupWithRelations | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const openCreate = () => {
    setName("");
    setDescription("");
    setManagerId("");
    setError("");
    setSuccess("");
    setModalMode("create");
  };

  const openEdit = (g: GroupWithRelations) => {
    setName(g.name);
    setDescription(g.description || "");
    setManagerId(g.managerId || "");
    setEditingGroup(g);
    setError("");
    setSuccess("");
    setModalMode("edit");
  };

  const openManageMembers = (g: GroupWithRelations) => {
    const currentMemberIds = g.memberships.map((m) => m.user.id);
    setSelectedUserIds(currentMemberIds);
    setEditingGroup(g);
    setError("");
    setSuccess("");
    setModalMode("members");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingGroup(null);
    setError("");
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (modalMode === "create") {
        const res = await createGroupAction({
          name,
          description,
          managerId: managerId || null,
        });
        if (res.success) {
          setSuccess(`Team "${name}" created successfully.`);
          closeModal();
        } else {
          setError(res.error || "Failed to create team.");
        }
      } else if (modalMode === "edit" && editingGroup) {
        const res = await updateGroupAction(editingGroup.id, {
          name,
          description,
          managerId: managerId || null,
        });
        if (res.success) {
          setSuccess(`Team "${name}" updated successfully.`);
          closeModal();
        } else {
          setError(res.error || "Failed to update team.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMembersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await manageGroupMembersAction(editingGroup.id, selectedUserIds);
      if (res.success) {
        setSuccess(`Updated team members for "${editingGroup.name}".`);
        closeModal();
      } else {
        setError(res.error || "Failed to update team members.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (g: GroupWithRelations) => {
    if (!confirm(`Are you sure you want to delete the team "${g.name}"?`)) return;
    setError("");
    setSuccess("");

    try {
      const res = await deleteGroupAction(g.id);
      if (res.success) {
        setSuccess(`Team "${g.name}" deleted successfully.`);
      } else {
        setError(res.error || "Failed to delete team.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {groups.length} active team{groups.length !== 1 ? "s" : ""} under your department
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" /> Create Team
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-2xl px-4 py-3">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-2xl px-4 py-3 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          {success}
        </div>
      )}

      {/* Grid of Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((g) => {
          const managerName = g.manager?.name || g.manager?.email || "No manager assigned";
          return (
            <div key={g.id} className="glass-card rounded-3xl border border-gray-205 dark:border-slate-800 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">{g.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {g.description || "No description provided."}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(g)}
                      className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                      title="Edit Settings"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(g)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Team"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="py-2.5 border-t border-b border-gray-155 dark:border-slate-800/80 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-550 dark:text-slate-450 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Approver (Manager):
                    </span>
                    <span className="font-bold text-gray-905 dark:text-white">{managerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-550 dark:text-slate-450 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-amber-500" /> Staff Count:
                    </span>
                    <span className="font-extrabold text-gray-905 dark:text-white">{g.memberships.length} members</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => openManageMembers(g)}
                  className="w-full text-center py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-bold text-gray-700 dark:text-slate-300 transition-colors"
                >
                  Manage Team Members
                </button>
              </div>
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400 dark:text-slate-500 glass-card rounded-3xl border border-gray-200 dark:border-slate-800">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30 text-amber-500" />
            <p className="text-sm font-semibold">No teams configured yet.</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Create teams to delegate approval responsibilities to other staff members.</p>
          </div>
        )}
      </div>

      {/* Edit/Create Team Modal */}
      {(modalMode === "create" || modalMode === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-155 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {modalMode === "create" ? "Create New Team" : `Edit Team: ${editingGroup?.name}`}
              </h2>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-350">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 mb-1.5">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BaaS Engineer"
                  className="w-full px-3.5 py-2.5 bg-gray-55 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of the team's scope..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-gray-55 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 mb-1.5">
                  Delegated Approver (Team Manager)
                </label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-55 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">No Delegated Approver (Only Head Approves)</option>
                  {departmentMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                  The selected team manager will be allowed to approve or reject daily logs of staff members in this group.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-155 dark:border-slate-800">
                <button type="button" onClick={closeModal} disabled={submitting} className="px-4 py-2.5 border border-gray-200 dark:border-slate-850 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md shadow-amber-600/25 transition-all font-bold flex items-center gap-1.5">
                  {submitting ? "Saving..." : modalMode === "create" ? "Create Team" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {modalMode === "members" && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-up text-xs flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-2 border-b border-gray-155 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Add/Remove Staff: {editingGroup.name}
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Select members to assign to this team.</p>
              </div>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-355">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleMembersSubmit} className="space-y-4 overflow-hidden flex flex-col flex-1">
              <div className="overflow-y-auto pr-1 flex-1 space-y-1.5 max-h-[45vh]">
                {departmentMembers.map((m) => {
                  const isChecked = selectedUserIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleUserSelection(m.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                          : "bg-gray-55 dark:bg-slate-950 border-gray-200 dark:border-slate-850 text-gray-600 dark:text-slate-450 hover:bg-gray-100"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs">{m.name}</p>
                        <p className="text-[10px] opacity-80 mt-0.5">{m.jobTitle || "Staff Member"} • {m.email}</p>
                      </div>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                        isChecked ? "bg-amber-500 border-transparent text-white" : "border-gray-300 dark:border-slate-700"
                      }`}>
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-155 dark:border-slate-800 shrink-0">
                <button type="button" onClick={closeModal} disabled={submitting} className="px-4 py-2.5 border border-gray-200 dark:border-slate-855 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md shadow-amber-600/25 transition-all font-bold">
                  {submitting ? "Saving..." : "Save Assignments"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
