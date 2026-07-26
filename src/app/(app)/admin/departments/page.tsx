"use client";

import React, { useState } from "react";
import { Building, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { createDepartmentAction } from "@/lib/actions/admin.actions";

export default function AdminDepartmentsPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await createDepartmentAction({ name, description });
      if (res.success) {
        setSuccessMsg(`Department "${name}" created successfully!`);
        setName("");
        setDescription("");
      } else {
        setErrorMsg(res.error || "Failed to create department.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Building className="h-6 w-6 text-purple-400" /> Department Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Add and manage departments for tenant data isolation</p>
      </div>

      <div className="max-w-xl glass-card p-6 sm:p-8 rounded-3xl space-y-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Plus className="h-5 w-5 text-purple-400" /> Create New Department
        </h2>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Department Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Platform Engineering"
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of department scope..."
              rows={3}
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-gray-900 dark:text-white bg-purple-600 hover:bg-purple-500 active:scale-[0.99] transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Department"}
          </button>
        </form>
      </div>
    </div>
  );
}
