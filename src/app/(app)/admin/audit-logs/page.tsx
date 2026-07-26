import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { History, Shield, Clock } from "lucide-react";

export default async function AdminAuditLogsPage() {
  const admin = await getCurrentUser();
  if (!admin) return null;

  const logs = await db.auditLog.findMany({
    where: { organizationId: admin.organizationId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <History className="h-6 w-6 text-purple-400" /> System Audit Trail
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Immutable security log of administrative actions and attendance events</p>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-100 dark:bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">New Value Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60 font-mono text-xs">
              {logs.map((log, index) => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 font-mono w-12">{index + 1}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white font-sans">
                    {log.user?.name || log.user?.email || "System"}
                  </td>
                  <td className="px-6 py-4 font-bold text-purple-300">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300 max-w-xs truncate">
                    {log.newValue ? JSON.stringify(log.newValue) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
