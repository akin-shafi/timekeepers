"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle, RefreshCw, Check, X, ShieldAlert, Undo2 } from "lucide-react";
import { updateAttendanceRecordsStatusAction, reverseCheckOutAction } from "@/lib/actions/attendance.actions";
import { Avatar } from "@/components/layout/Avatar";
import { DataTable } from "@/components/ui/DataTable";

interface AttendanceRecord {
  id: string;
  userId: string;
  workDate: Date;
  workLocation: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  hoursWorked: number;
  status: string;
  isLate: boolean;
  checkInLocation?: string | null;
  checkOutLocation?: string | null;
  expectedWorkMode?: string | null;
  user: {
    name: string | null;
    email: string;
    employeeId: string | null;
    avatarUrl: string | null;
  };
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
}

export function AttendanceTable({ records }: AttendanceTableProps) {
  const { data: session } = useSession();
  const role = session?.user?.role || "EMPLOYEE";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Warning Modal state
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [modalPendingIds, setModalPendingIds] = useState<string[]>([]);
  const [justification, setJustification] = useState("");
  const [isBulk, setIsBulk] = useState(false);

  const handleBulkStatusChange = async (status: "APPROVED" | "REJECTED") => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} the ${selectedIds.length} selected record(s)?`)) return;

    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await updateAttendanceRecordsStatusAction({
        recordIds: selectedIds,
        status,
      });

      if (res.success) {
        setSuccessMsg(`Successfully ${status.toLowerCase()} ${res.count} attendance records!`);
        setSelectedIds([]);
      } else {
        setErrorMsg(res.error || "Failed to update records.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleStatusChange = async (recordId: string, status: "APPROVED" | "REJECTED") => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await updateAttendanceRecordsStatusAction({
        recordIds: [recordId],
        status,
      });

      if (res.success) {
        setSuccessMsg(`Successfully ${status.toLowerCase()} the record.`);
      } else {
        setErrorMsg(res.error || "Failed to update record.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReverseCheckOut = async (recordId: string) => {
    if (!confirm("Are you sure you want to reverse this check-out? This will clear check-out coordinates, hours, and resolved address, and restore Checked-In status.")) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await reverseCheckOutAction({ recordId });
      if (res.success) {
        setSuccessMsg("Successfully reversed check-out.");
      } else {
        setErrorMsg(res.error || "Failed to reverse check-out.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveClick = (record: AttendanceRecord) => {
    if (record.expectedWorkMode === "OFFICE" && record.workLocation === "REMOTE") {
      setModalPendingIds([record.id]);
      setJustification("");
      setIsBulk(false);
      setShowWarningModal(true);
    } else {
      handleSingleStatusChange(record.id, "APPROVED");
    }
  };

  const handleBulkApproveClick = () => {
    if (selectedIds.length === 0) return;
    const selectedRecords = records.filter(r => selectedIds.includes(r.id));
    const deviatingRecords = selectedRecords.filter(r => r.expectedWorkMode === "OFFICE" && r.workLocation === "REMOTE");

    if (deviatingRecords.length > 0) {
      setModalPendingIds(selectedIds);
      setJustification("");
      setIsBulk(true);
      setShowWarningModal(true);
    } else {
      handleBulkStatusChange("APPROVED");
    }
  };

  const handleWarningModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setShowWarningModal(false);

    try {
      const res = await updateAttendanceRecordsStatusAction({
        recordIds: modalPendingIds,
        status: "APPROVED",
        justification: justification.trim(),
      });

      if (res.success) {
        setSuccessMsg(isBulk ? `Successfully approved ${res.count} records with justification!` : "Successfully approved remote check-in with justification.");
        setSelectedIds([]);
      } else {
        setErrorMsg(res.error || "Failed to approve record.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Define columns for TanStack Table
  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected();
          }}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
        />
      ),
      enableSorting: false,
    },
    {
      id: "employee",
      header: "Employee",
      accessorFn: (row) => row.user.name || row.user.email,
      cell: ({ row }) => {
        const rec = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar src={rec.user.avatarUrl} name={rec.user.name} email={rec.user.email} className="w-7 h-7" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                {rec.user.name || rec.user.email}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono mt-0.5">
                {rec.user.employeeId || `EMP-${rec.userId.slice(0, 6).toUpperCase()}`}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "workDate",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.workDate);
        const day = date.getDay();
        const isWeekend = day === 0 || day === 6;
        return (
          <div className="flex flex-col">
            <span className="font-mono text-black dark:text-slate-200">
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                weekday: "short",
              })}
            </span>
            {isWeekend && (
              <span className="inline-flex items-center text-[9px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-1 rounded mt-0.5 w-fit">
                Weekend
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "workLocation",
      header: "Declared Location",
      cell: ({ row }) => {
        const loc = row.original.workLocation;
        const expected = row.original.expectedWorkMode;
        const isMismatchedRemote = loc === "REMOTE" && expected === "OFFICE";

        if (isMismatchedRemote) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 w-fit">
                {loc} (Mismatch)
              </span>
              <span className="text-[9px] font-semibold text-rose-500 dark:text-rose-400 tracking-wide font-sans">
                Expected: Office
              </span>
            </div>
          );
        }

        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              loc === "OFFICE"
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-300 border-brand-500/30"
                : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/30"
            }`}
          >
            {loc}
          </span>
        );
      },
    },
    {
      id: "expectedWorkMode",
      header: "Expected",
      cell: ({ row }) => {
        const exp = row.original.expectedWorkMode || "REMOTE";
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              exp === "OFFICE"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30"
                : "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30"
            }`}
          >
            {exp}
          </span>
        );
      },
    },
    {
      id: "activityLocations",
      header: "Check-In/Out Location",
      cell: ({ row }) => {
        const inLoc = row.original.checkInLocation;
        const outLoc = row.original.checkOutLocation;
        return (
          <div className="space-y-0.5 max-w-[240px] text-xs">
            {inLoc ? (
              <p className="text-[11px] leading-normal text-gray-700 dark:text-slate-350">
                <span className="font-bold text-[9px] text-emerald-500 uppercase tracking-wider mr-1">In:</span>
                {inLoc}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 italic">No check-in location</p>
            )}
            {outLoc ? (
              <p className="text-[11px] leading-normal text-gray-700 dark:text-slate-350">
                <span className="font-bold text-[9px] text-amber-500 uppercase tracking-wider mr-1">Out:</span>
                {outLoc}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 italic">No check-out location</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "checkInTime",
      header: "Check-In",
      cell: ({ row }) => (
        <span className="font-mono text-emerald-600 dark:text-emerald-400">
          {new Date(row.original.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      accessorKey: "checkOutTime",
      header: "Check-Out",
      cell: ({ row }) => {
        const time = row.original.checkOutTime;
        return (
          <span className="font-mono text-amber-600 dark:text-amber-450">
            {time ? new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const rec = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  rec.status === "APPROVED"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : rec.status === "REJECTED"
                    ? "bg-red-500/10 text-red-500 dark:text-red-400"
                    : "bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-350"
                }`}
              >
                {rec.status}
              </span>
              {rec.isLate && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-bold">
                  LATE
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => {
        const rec = row.original;
        const canReverse = rec.checkOutTime !== null && (role === "SUPER_ADMIN" || role === "HR" || role === "DEPARTMENT_HEAD");

        return (
          <div className="flex flex-col items-end gap-1.5 justify-center">
            {rec.status === "APPROVED" ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4" /> Approved
              </span>
            ) : rec.status === "REJECTED" ? (
              <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-semibold text-xs">
                <XCircle className="h-4 w-4" /> Rejected
              </span>
            ) : (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleApproveClick(rec)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20 text-[11px] disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSingleStatusChange(rec.id, "REJECTED")}
                  className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-md shadow-red-600/20 text-[11px] disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
            
            {canReverse && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleReverseCheckOut(rec.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-[10px] font-semibold transition-all disabled:opacity-50 mt-1"
              >
                <Undo2 className="h-3 w-3" /> Revert Checkout
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Render floating bulk actions toolbar
  const renderBulkActions = () => {
    if (selectedIds.length === 0) return null;
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleBulkApproveClick}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
        >
          {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Approve Selected
        </button>
        <button
          onClick={() => handleBulkStatusChange("REJECTED")}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-red-600/20"
        >
          {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          Reject Selected
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Alert Messaging */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={records}
        searchKey="employee"
        searchPlaceholder="Search employee name or email..."
        onSelectionChange={(rows) => setSelectedIds(rows.map((r) => r.id))}
        bulkActions={renderBulkActions()}
      />

      {/* Warning & Justification Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-gray-250 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Warning: Work Mode Deviation</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  This staff member was scheduled to work from the office on this day but checked in remotely.
                </p>
              </div>
            </div>

            <form onSubmit={handleWarningModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 mb-1.5">
                  Reason / Justification for Approval <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Provide the exception justification (e.g., Client site visit, approved special work arrangement)..."
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl p-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[90px] resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWarningModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 font-bold transition-all text-xs active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!justification.trim()}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md shadow-amber-600/30 text-xs disabled:opacity-50 active:scale-[0.98]"
                >
                  Justify & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
