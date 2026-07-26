"use client";

import React, { useState } from "react";
import { Sliders, ShieldCheck, Clock, Check, X, RefreshCw } from "lucide-react";
import { updateOrganizationPolicyAction } from "@/lib/actions/hr.actions";
import { VerificationMethod } from "@prisma/client";

interface PolicyEditFormProps {
  initialOrg: {
    workStartTime: string;
    workEndTime: string;
    gracePeriodMins: number;
    verificationType: VerificationMethod;
  };
  initialPolicy?: {
    requiredOfficeDaysPerWeek: number;
    requiredOfficeDaysPerMonth: number;
    mandatoryOfficeDays: string[];
    isFlexible: boolean;
  } | null;
}

const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export function PolicyEditForm({ initialOrg, initialPolicy }: PolicyEditFormProps) {
  const [workStartTime, setWorkStartTime] = useState(initialOrg.workStartTime);
  const [workEndTime, setWorkEndTime] = useState(initialOrg.workEndTime);
  const [gracePeriodMins, setGracePeriodMins] = useState(initialOrg.gracePeriodMins);
  const [verificationType, setVerificationType] = useState<VerificationMethod>(initialOrg.verificationType);

  const [requiredOfficeDaysPerWeek, setRequiredOfficeDaysPerWeek] = useState(initialPolicy?.requiredOfficeDaysPerWeek ?? 2);
  const [requiredOfficeDaysPerMonth, setRequiredOfficeDaysPerMonth] = useState(initialPolicy?.requiredOfficeDaysPerMonth ?? 8);
  const [isFlexible, setIsFlexible] = useState(initialPolicy?.isFlexible ?? true);
  const [mandatoryOfficeDays, setMandatoryOfficeDays] = useState<string[]>(initialPolicy?.mandatoryOfficeDays ?? ["TUESDAY", "THURSDAY"]);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleDayToggle = (day: string) => {
    setMandatoryOfficeDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      if (!isFlexible) {
        setRequiredOfficeDaysPerWeek(next.length);
        setRequiredOfficeDaysPerMonth(next.length * 4);
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await updateOrganizationPolicyAction({
        workStartTime,
        workEndTime,
        gracePeriodMins: Number(gracePeriodMins),
        verificationType,
        requiredOfficeDaysPerWeek: Number(requiredOfficeDaysPerWeek),
        requiredOfficeDaysPerMonth: Number(requiredOfficeDaysPerMonth),
        mandatoryOfficeDays: isFlexible ? [] : mandatoryOfficeDays,
        isFlexible,
      });

      if (res.success) {
        setSuccessMsg("Organization work policy settings updated successfully!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErrorMsg("Failed to update policy settings.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 text-xs flex items-center gap-2">
          <Check className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs flex items-center gap-2">
          <X className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-150 dark:border-slate-800 pb-3">
              <Clock className="h-5 w-5 text-brand-400" /> Work Hours & Verification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 uppercase mb-2">
                  Work Start Time (Late Threshold)
                </label>
                <input
                  type="time"
                  required
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 uppercase mb-2">
                  Work End Time
                </label>
                <input
                  type="time"
                  required
                  value={workEndTime}
                  onChange={(e) => setWorkEndTime(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 uppercase mb-2">
                  Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={gracePeriodMins}
                  onChange={(e) => setGracePeriodMins(Number(e.target.value))}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 uppercase mb-2">
                  Verification Type
                </label>
                <select
                  value={verificationType}
                  onChange={(e) => setVerificationType(e.target.value as VerificationMethod)}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="SELF_DECLARATION">Self Declaration</option>
                  <option value="GPS_GEOFENCE">GPS Geofencing Check-in</option>
                  <option value="WIFI_IP">WiFi / IP Address Lockdown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hybrid compliance policy */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-150 dark:border-slate-800 pb-3">
              <Sliders className="h-5 w-5 text-brand-400" /> Hybrid Attendance Policy
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 uppercase mb-2">
                  Schedule Flexibility
                </label>
                <select
                  value={isFlexible ? "true" : "false"}
                  onChange={(e) => {
                    const flexible = e.target.value === "true";
                    setIsFlexible(flexible);
                    if (!flexible) {
                      setRequiredOfficeDaysPerWeek(mandatoryOfficeDays.length);
                      setRequiredOfficeDaysPerMonth(mandatoryOfficeDays.length * 4);
                    }
                  }}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="true">Flexible Days (Staff can choose which days to check-in at the office)</option>
                  <option value="false">Fixed Schedule (Staff must attend on mandatory office days)</option>
                </select>
              </div>

              {!isFlexible && (
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 uppercase">
                    Mandatory Office Days
                  </label>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">
                    Select the days of the week that staff members are required to check-in from an office location.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {WEEKDAYS.map((day) => {
                      const isSelected = mandatoryOfficeDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            isSelected
                              ? "bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-600/25 font-bold"
                              : "bg-gray-100 dark:bg-slate-900 border-gray-300 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 uppercase mb-2">
                  Required Office Days Per Week
                </label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  required
                  disabled={!isFlexible}
                  value={requiredOfficeDaysPerWeek}
                  onChange={(e) => setRequiredOfficeDaysPerWeek(Number(e.target.value))}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {!isFlexible && (
                  <span className="text-[10px] text-brand-400 mt-1.5 block">
                    Set automatically based on mandatory days.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 uppercase mb-2">
                  Required Office Days Per Month
                </label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  required
                  disabled={!isFlexible}
                  value={requiredOfficeDaysPerMonth}
                  onChange={(e) => setRequiredOfficeDaysPerMonth(Number(e.target.value))}
                  className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {!isFlexible && (
                  <span className="text-[10px] text-brand-400 mt-1.5 block">
                    Calculated as 4 weeks of mandatory days.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" /> Apply Settings
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Updating organization-wide policy settings immediately adjusts the late-check calculation, active geofence requirements, and compliance rules for all employees.
            </p>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/30 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Policy Settings"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
