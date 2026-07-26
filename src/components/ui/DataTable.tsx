"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  initialPageSize?: number;
  onSelectionChange?: (selectedRows: TData[]) => void;
  bulkActions?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  initialPageSize = 10,
  onSelectionChange,
  bulkActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
  });

  // Call onSelectionChange safely only when row selection keys change to prevent infinite render loops
  const prevSelectedKeysRef = useRef<string>("");

  useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const selectedKeys = selectedRows.map((r) => r.id).join(",");
      if (selectedKeys !== prevSelectedKeysRef.current) {
        prevSelectedKeysRef.current = selectedKeys;
        onSelectionChange(selectedRows.map((r) => r.original));
      }
    }
  }, [rowSelection, table, onSelectionChange]);

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {searchKey && (
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-100 dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700/85 rounded-xl text-gray-800 dark:text-white outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        )}
        {bulkActions && <div className="w-full sm:w-auto">{bulkActions}</div>}
      </div>

      {/* Responsive Table Panel */}
      <div className="glass-panel rounded-3xl border border-gray-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-900 dark:text-slate-200">
            <thead className="bg-gray-100 dark:bg-slate-900/80 text-gray-800 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-850 uppercase tracking-wider text-[11px] select-none">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  <th className="px-6 py-4 text-left font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-[11px] w-12">
                    #
                  </th>
                  {headerGroup.headers.map((header) => {
                    const isSortable = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        className={`px-6 py-4 ${
                          header.column.columnDef.meta?.className || ""
                        } ${isSortable ? "cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800/50" : ""}`}
                        onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {isSortable && <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-850/60">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                    No results found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-850/30 dark:hover:bg-slate-800/20 transition-colors ${
                      row.getIsSelected() ? "bg-brand-500/5 dark:bg-brand-500/5" : ""
                    }`}
                  >
                    <td className="px-6 py-4 align-middle font-semibold text-gray-500 dark:text-slate-450 font-mono w-12 select-none">
                      {row.index + 1}
                    </td>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`px-6 py-4 align-middle ${
                          cell.column.columnDef.meta?.className || ""
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-900/30 text-gray-500 dark:text-slate-400 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium">Show:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-lg px-2 py-0.5 text-xs text-gray-700 dark:text-slate-200 outline-none"
              >
                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-gray-250 dark:border-slate-750 hover:bg-gray-150 dark:hover:bg-slate-850 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-gray-250 dark:border-slate-750 hover:bg-gray-150 dark:hover:bg-slate-850 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-gray-250 dark:border-slate-750 hover:bg-gray-150 dark:hover:bg-slate-850 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-gray-250 dark:border-slate-750 hover:bg-gray-150 dark:hover:bg-slate-850 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add typing support to declare custom column header meta classes in ColumnsDef
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    className?: string;
  }
}
