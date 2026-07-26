"use client";

import React, { useEffect, useState } from "react";
import { Banknote, Download, Play, CheckCircle2, AlertCircle, FileSpreadsheet, Info, AlertTriangle } from "lucide-react";
import { calculateStipendAction } from "@/lib/actions/stipend.actions";
import { StipendSettingsForm } from "@/components/layout/StipendSettingsForm";

export default function HRTransportStipendPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [ratePerDay, setRatePerDay] = useState(2500);
  const [minRequiredDays, setMinRequiredDays] = useState(4);
  const [maxMonthlyCap, setMaxMonthlyCap] = useState(50000);
  const [pendingCount, setPendingCount] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCalculate = async (isInitial = false) => {
    setIsCalculating(true);
    setErrorMsg("");
    if (!isInitial) {
      setSuccessMsg("");
    }

    try {
      const res = await calculateStipendAction({ year, month });
      if (res.success) {
        setResults(res.data || []);
        setRatePerDay(res.ratePerOfficeDay || 2500);
        setMinRequiredDays(res.minRequiredDays || 4);
        setMaxMonthlyCap(res.maxMonthlyCap || 50000);
        setPendingCount(res.pendingApprovalCount || 0);
        if (!isInitial) {
          setSuccessMsg(`Calculated transport stipends for ${res.count} employees.`);
        }
      } else {
        if (!isInitial) {
          setErrorMsg("Failed to run stipend calculations.");
        }
      }
    } catch (err: any) {
      if (!isInitial) {
        setErrorMsg(err.message || "An error occurred.");
      }
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    handleCalculate(true);
  }, []);

  const totalCalculated = results.reduce((acc, s) => acc + s.calculatedStipend, 0);
  const monthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Banknote className="h-3.5 w-3.5 text-emerald-400" /> Payroll & Allowance Reports
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Transport Stipend HR View</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Calculated monthly transport allowances based on verified office attendance</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-slate-900/80 px-4 py-2 rounded-2xl border border-gray-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Total Liability</p>
            <p className="text-xl font-extrabold text-emerald-300">₦{totalCalculated.toLocaleString()}</p>
          </div>

          <a
            href={`/api/hr/export/transport?month=${month}&year=${year}`}
            download="transport_stipends.csv"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-950 dark:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30 active:scale-[0.98]"
          >
            <Download className="h-4 w-4" /> Export Report
          </a>
        </div>
      </div>

      {/* How Stipend Is Calculated - Explanation */}
      <div className="glass-card rounded-3xl border border-blue-200/40 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-5 space-y-3">
        <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Info className="h-4 w-4" /> How Transport Stipend Is Calculated
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
          <div className="space-y-1.5">
            <p>• Only <strong className="text-gray-800 dark:text-slate-200">weekday</strong> attendance is counted (Mon–Fri). Saturday and Sunday records are excluded.</p>
            <p>• Counted statuses: <strong className="text-gray-800 dark:text-slate-200">Approved, Checked Out, Working, Checked In, Late</strong>.</p>
            <p>• Records with status <strong className="text-gray-800 dark:text-slate-200">Rejected, Absent, On Leave, or Not Checked In</strong> do not count toward office days.</p>
          </div>
          <div className="space-y-1.5">
            <p>• An employee must have at least <strong className="text-emerald-500">{minRequiredDays} office day{minRequiredDays !== 1 ? "s" : ""}</strong> in the month to qualify for any stipend.</p>
            <p>• Current rate: <strong className="text-emerald-500">₦{ratePerDay.toLocaleString()}</strong> per eligible office day.</p>
            <p>• Monthly cap: <strong className="text-emerald-500">₦{maxMonthlyCap.toLocaleString()}</strong>. Stipend will not exceed this amount.</p>
          </div>
        </div>
      </div>

      {/* Pending Approval Warning */}
      {pendingCount > 0 && (
        <div className="rounded-2xl border border-amber-300/40 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {pendingCount} attendance record{pendingCount !== 1 ? "s" : ""} still awaiting approval for {monthName} {year}
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1">
              These records are included in the calculation, but their status has not been confirmed by Department Heads yet. For the most accurate results, ensure all attendance records are reviewed and approved before running the final stipend calculation.
            </p>
          </div>
        </div>
      )}

      {/* Stipend Configuration Settings */}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Select Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              onClick={() => handleCalculate(false)}
              disabled={isCalculating}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              {isCalculating ? "Calculating..." : "Execute Calculation"}
            </button>
          </div>
        </div>
      </div>

      {/* Calculation Results Table */}
      {results.length > 0 && (
        <div className="glass-panel rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/60">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" /> Calculation Breakdown for {month}/{year}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-100 dark:bg-slate-900/80 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4 w-12">#</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Required Office Days</th>
                  <th className="px-6 py-4">Actual Office Days</th>
                  <th className="px-6 py-4">Eligible Days</th>
                  <th className="px-6 py-4">Rate / Day</th>
                  <th className="px-6 py-4 text-right">Calculated Stipend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
                {results.map((s, index) => {
                  const employeeName = s.user?.name || s.user?.email || `User-${s.userId.slice(0, 6)}`;
                  const employeeId = s.user?.employeeId || `EMP-${s.userId.slice(0, 6).toUpperCase()}`;
                  const department = s.user?.deptMemberships?.[0]?.department?.name || "Unassigned";

                  return (
                    <tr key={s.userId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 font-mono w-12">{index + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{employeeName}</p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">{employeeId}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{department}</td>
                      <td className="px-6 py-4 font-bold text-gray-600 dark:text-slate-300">{s.requiredOfficeDays} Days</td>
                      <td className="px-6 py-4 font-bold text-brand-400">{s.actualOfficeDays} Days</td>
                      <td className="px-6 py-4 font-bold text-cyan-400">{s.eligibleOfficeDays} Days</td>
                      <td className="px-6 py-4 font-mono text-gray-600 dark:text-slate-300">
                        ₦{ratePerDay.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-sm text-emerald-300">
                        ₦{s.calculatedStipend.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
