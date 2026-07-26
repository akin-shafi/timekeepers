"use client";

import React, { useEffect, useState } from "react";
import { Sliders, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { StipendType } from "@prisma/client";
import { getTransportStipendPolicyAction, updateTransportStipendPolicyAction } from "@/lib/actions/stipend.actions";

export function StipendSettingsForm() {
  const [stipendType, setStipendType] = useState<StipendType>(StipendType.PER_OFFICE_DAY);
  const [ratePerOfficeDay, setRatePerOfficeDay] = useState<number>(2500);
  const [fixedMonthlyStipend, setFixedMonthlyStipend] = useState<number>(20000);
  const [maxMonthlyStipend, setMaxMonthlyStipend] = useState<number>(50000);
  const [minRequiredAttendanceDays, setMinRequiredAttendanceDays] = useState<number>(4);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadPolicy() {
      try {
        const res = await getTransportStipendPolicyAction();
        if (res.success && res.data) {
          setStipendType(res.data.stipendType);
          setRatePerOfficeDay(res.data.ratePerOfficeDay);
          setFixedMonthlyStipend(res.data.fixedMonthlyStipend);
          setMaxMonthlyStipend(res.data.maxMonthlyStipend ?? 0);
          setMinRequiredAttendanceDays(res.data.minRequiredAttendanceDays);
        }
      } catch (err: any) {
        console.error("Failed to load stipend settings", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPolicy();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await updateTransportStipendPolicyAction({
        stipendType,
        ratePerOfficeDay,
        fixedMonthlyStipend,
        maxMonthlyStipend: maxMonthlyStipend > 0 ? maxMonthlyStipend : null,
        minRequiredAttendanceDays,
      });

      if (res.success) {
        setSuccessMsg("Stipend settings updated successfully.");
      } else {
        setErrorMsg("Failed to save settings.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-3xl animate-pulse flex flex-col space-y-4">
        <div className="h-6 bg-slate-800/40 w-1/3 rounded-xl"></div>
        <div className="h-10 bg-slate-800/40 w-full rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sliders className="h-5 w-5 text-emerald-400" /> Stipend Policy Settings
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          Configure default allowance rates, stipend formulas, and monthly limits organization-wide
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
              Calculation Type
            </label>
            <select
              value={stipendType}
              onChange={(e) => setStipendType(e.target.value as StipendType)}
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={StipendType.PER_OFFICE_DAY}>Per-Office-Day Rate (Variable)</option>
              <option value={StipendType.FIXED_MONTHLY}>Fixed Monthly Allowance (Prorated)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
              Minimum Attendance Required (Days)
            </label>
            <input
              type="number"
              min={0}
              max={31}
              value={minRequiredAttendanceDays}
              onChange={(e) => setMinRequiredAttendanceDays(Number(e.target.value))}
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stipendType === StipendType.PER_OFFICE_DAY ? (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
                Rate per Office Day (₦)
              </label>
              <input
                type="number"
                min={0}
                value={ratePerOfficeDay}
                onChange={(e) => setRatePerOfficeDay(Number(e.target.value))}
                className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
                Fixed Monthly Amount (₦)
              </label>
              <input
                type="number"
                min={0}
                value={fixedMonthlyStipend}
                onChange={(e) => setFixedMonthlyStipend(Number(e.target.value))}
                className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
              Maximum Monthly Cap (₦)
            </label>
            <input
              type="number"
              min={0}
              value={maxMonthlyStipend}
              onChange={(e) => setMaxMonthlyStipend(Number(e.target.value))}
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="No limit"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Stipend Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
