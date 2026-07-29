"use client";

import React, { useState } from "react";
import { createAiTokenAction, cancelAiTokenAction, notifyStaffAiTokenAction } from "@/lib/actions/ai-token.actions";
import { format } from "date-fns";
import { Key, XCircle, Plus, Copy, Check, Mail, Globe } from "lucide-react";

type Token = any;
type Employee = any;

interface TokenManagerProps {
  tokens: Token[];
  employees: Employee[];
}

export function TokenManager({ tokens, employees }: TokenManagerProps) {
  const [selectedUser, setSelectedUser] = useState("");
  const [daysValid, setDaysValid] = useState(7);
  const [maxUses, setMaxUses] = useState(2);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    await createAiTokenAction(selectedUser, daysValid, maxUses);
    setSelectedUser("");
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this token?")) return;
    setLoading(true);
    await cancelAiTokenAction(id);
    setLoading(false);
  };

  const handleNotifyStaff = async (id: string) => {
    if (!confirm("Are you sure you want to email this OTP to all staff members?")) return;
    setLoading(true);
    const res = await notifyStaffAiTokenAction(id);
    setLoading(false);
    if (res.success) {
      alert("Staff notified successfully!");
    } else {
      alert("Failed to notify staff: " + res.error);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Create Token Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Issue New OTP</h2>
        <form onSubmit={handleCreate} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Select Employee
            </label>
            <select
              required
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
            >
              <option value="">-- Choose an employee --</option>
              <option value="GLOBAL" className="font-bold text-purple-600">
                🌎 Global Token (Everyone)
              </option>
              <optgroup label="Individual Employees">
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.email}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Valid For (Days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={daysValid}
              onChange={(e) => setDaysValid(Number(e.target.value))}
              className="w-32 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              {selectedUser === "GLOBAL" ? "Max Uses / Emp" : "Uses"}
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !selectedUser}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-md disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Issue Token
          </button>
        </form>
      </div>

      {/* Active Tokens List */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Uses Left</th>
                <th className="px-6 py-4 font-semibold">Expires</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {tokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No tokens issued yet.
                  </td>
                </tr>
              ) : (
                tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {!token.user ? (
                        <span className="text-purple-600 flex items-center gap-1"><Globe className="h-4 w-4" /> Global (Everyone)</span>
                      ) : (
                        token.user.name || token.user.email
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold tracking-wider text-purple-600 dark:text-purple-400">
                          {token.code}
                        </span>
                        <button
                          onClick={() => copyCode(token.code, token.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {copiedId === token.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">{token.usesLeft} {!token.user && "per emp."}</td>
                    <td className="px-6 py-4 text-gray-500">{format(new Date(token.expiresAt), "MMM d, yyyy")}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          token.status === "ACTIVE"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {token.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {token.status === "ACTIVE" && !token.user && (
                          <button
                            onClick={() => handleNotifyStaff(token.id)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                          >
                            <Mail className="h-4 w-4" /> Notify All
                          </button>
                        )}
                        {token.status === "ACTIVE" && (
                          <button
                            onClick={() => handleCancel(token.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                          >
                            <XCircle className="h-4 w-4" /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
