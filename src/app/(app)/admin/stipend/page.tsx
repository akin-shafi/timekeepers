"use client";

import React, { useState } from "react";
import { Banknote, Download, Play, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { calculateStipendAction } from "@/lib/actions/stipend.actions";
import { StipendSettingsForm } from "@/components/layout/StipendSettingsForm";

export default function AdminStipendPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCalculate = async () => {
    setIsCalculating(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await calculateStipendAction({ year, month });
      if (res.success) {
        setResults(res.data || []);
        setSuccessMsg(`Calculated transport stipends for ${res.count} employees.`);
      } else {
        setErrorMsg("Failed to run stipend calculations.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const headers = ["Employee Email", "Required Office Days", "Actual Office Days", "Eligible Office Days", "Remote Days", "Calculated Stipend (NGN)"];
    const rows = results.map((r) => [
      r.user?.email || r.userId,
      r.requiredOfficeDays,
      r.actualOfficeDays,
      r.eligibleOfficeDays,
      r.remoteDays,
      r.calculatedStipend,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transport_stipend_payroll_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Banknote className="h-6 w-6 text-emerald-400" /> Transport Stipend Payroll Engine
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Calculate monthly transport allowances based on verified office attendance</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/api/hr/export/transport?month=${month}&year=${year}`}
            download={`transport_stipend_payroll_${year}_${month}.csv`}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 dark:text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-400/20 active:scale-[0.98] ${
              results.length === 0 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <Download className="h-4 w-4" /> Export CSV Payroll Report
          </a>
        </div>
      </div>

      {/* Stipend Configuration settings */}
      <StipendSettingsForm />

      {/* Controller Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Play className="h-5 w-5 text-emerald-400" /> Run Monthly Calculation
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Select Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Select Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1, 1).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-900 dark:text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              {isCalculating ? "Calculating..." : "Execute Calculation"}
            </button>
          </div>
        </div>
      </div>

      {/* Calculation Results Table */}
      {results.length > 0 && (
        <div className="glass-card rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" /> Calculation Breakdown for {month}/{year}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-100 dark:bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 w-12">#</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Required Office</th>
                  <th className="px-6 py-4">Actual Office</th>
                  <th className="px-6 py-4">Remote Days</th>
                  <th className="px-6 py-4">Eligible Days</th>
                  <th className="px-6 py-4">Calculated Stipend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
                {results.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 font-mono w-12">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {r.user?.name || r.user?.email || r.userId}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-slate-300">{r.requiredOfficeDays} days</td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-400">{r.actualOfficeDays} days</td>
                    <td className="px-6 py-4 font-mono text-cyan-400">{r.remoteDays} days</td>
                    <td className="px-6 py-4 font-mono text-emerald-400 font-bold">{r.eligibleOfficeDays} days</td>
                    <td className="px-6 py-4 font-bold text-emerald-300 text-base">
                      ₦{r.calculatedStipend.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
