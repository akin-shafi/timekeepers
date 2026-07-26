"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Calendar, User, CheckSquare, RefreshCw, X, AlertCircle } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
}

interface DeptAttendanceFilterBarProps {
  currentQuickDate: string;
  currentStartDate: string;
  currentEndDate: string;
  currentWorkLocation: string;
  currentStatus: string;
  currentUserId: string;
  members: Member[];
  activeTab: string;
}

export function DeptAttendanceFilterBar({
  currentQuickDate,
  currentStartDate,
  currentEndDate,
  currentWorkLocation,
  currentStatus,
  currentUserId,
  members,
  activeTab,
}: DeptAttendanceFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for the advanced modal
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);
  const [userId, setUserId] = useState(currentUserId);
  const [workLocation, setWorkLocation] = useState(currentWorkLocation);
  const [status, setStatus] = useState(currentStatus);

  // Helper to build the query URL
  const applyFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always preserve tab
    params.set("tab", activeTab);

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    router.push(`/dept/attendance?${params.toString()}`);
  };

  const handleQuickDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom") {
      setIsModalOpen(true);
      return;
    }

    applyFilters({
      quickDate: val,
      startDate: null,
      endDate: null,
    });
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);

    applyFilters({
      quickDate: "custom",
      startDate: startDate || null,
      endDate: endDate || null,
      userId: userId || null,
      workLocation: workLocation || null,
      status: status || null,
    });
  };

  const clearFilter = (key: string) => {
    if (key === "customDate") {
      applyFilters({
        quickDate: "today",
        startDate: null,
        endDate: null,
      });
      // reset local form state
      setStartDate("");
      setEndDate("");
    } else {
      applyFilters({ [key]: null });
      if (key === "userId") setUserId("");
      if (key === "workLocation") setWorkLocation("");
      if (key === "status") setStatus("");
    }
  };

  const resetAllFilters = () => {
    setIsModalOpen(false);
    setStartDate("");
    setEndDate("");
    setUserId("");
    setWorkLocation("");
    setStatus("");

    router.push(`/dept/attendance?tab=${activeTab}`);
  };

  // Determine if any filters are active to display the clear/badge list
  const hasCustomDate = currentQuickDate === "custom" && (currentStartDate || currentEndDate);
  const hasUserId = !!currentUserId;
  const hasLocation = !!currentWorkLocation;
  const hasStatus = !!currentStatus;
  const hasAnyFilter = hasCustomDate || hasUserId || hasLocation || hasStatus;

  const selectedMemberName = members.find((m) => m.id === currentUserId)?.name;

  return (
    <div className="space-y-4">
      {/* Main Filter Control Row */}
      <div className="glass-card p-4 rounded-2xl border border-gray-250 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-slate-450 uppercase">Date Option:</span>
          </div>

          <select
            value={currentQuickDate}
            onChange={handleQuickDateChange}
            className="bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-amber-500/50"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="1week">1 week ago</option>
            {currentQuickDate === "custom" && <option value="custom">📅 Custom Date Range</option>}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 flex items-center gap-2"
        >
          <Filter className="h-3.5 w-3.5" /> Advanced Filter
        </button>
      </div>

      {/* Active Filter Badges */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Active Filters:</span>
          
          {hasCustomDate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-550/20 text-xs font-medium">
              Custom Date: {currentStartDate || "Min"} to {currentEndDate || "Max"}
              <button onClick={() => clearFilter("customDate")} className="hover:text-amber-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {hasUserId && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-550/20 text-xs font-medium">
              Staff: {selectedMemberName || currentUserId}
              <button onClick={() => clearFilter("userId")} className="hover:text-blue-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {hasLocation && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-555/20 text-xs font-medium">
              Location: {currentWorkLocation}
              <button onClick={() => clearFilter("workLocation")} className="hover:text-cyan-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {hasStatus && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-555/20 text-xs font-medium">
              Status: {currentStatus}
              <button onClick={() => clearFilter("status")} className="hover:text-emerald-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={resetAllFilters}
            className="text-[11px] font-bold text-gray-500 hover:text-red-500 dark:text-slate-450 dark:hover:text-red-400 transition-colors ml-auto flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Reset All
          </button>
        </div>
      )}

      {/* Advanced Filter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-gray-250 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-155 dark:border-slate-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="h-4 w-4 text-amber-500" /> Advanced Filters
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-350"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Custom Date Range */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350">
                  Custom Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">From</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-55 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-gray-905 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">To</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-55 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-gray-905 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Specific Staff Member */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-355 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-gray-400" /> Specific Staff Member
                </label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-gray-55 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-gray-905 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">All Staff Members</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-355">
                  Work Location
                </label>
                <select
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="w-full bg-gray-55 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-gray-905 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">All Locations</option>
                  <option value="OFFICE">Office</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-355 flex items-center gap-1">
                  <CheckSquare className="h-3.5 w-3.5 text-gray-400" /> Attendance Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-55 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-gray-905 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">All Statuses</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="WORKING">Working (Checked In)</option>
                  <option value="CHECKED_OUT">Checked Out</option>
                  <option value="LATE">Checked In Late</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-155 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 font-bold transition-all text-xs active:scale-[0.98]"
                >
                  Clear All
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md shadow-amber-600/30 text-xs active:scale-[0.98]"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
