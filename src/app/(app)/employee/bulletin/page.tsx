import React from "react";
import { getUpcomingAndCurrentLeavesAction } from "@/lib/actions/leave.actions";
import { Megaphone } from "lucide-react";

export default async function BulletinBoardPage() {
  const now = new Date();
  const bulletinRes = await getUpcomingAndCurrentLeavesAction();
  const bulletinLeaves = bulletinRes.success && bulletinRes.leaves ? bulletinRes.leaves : [];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-brand-400" /> Organization Leave Announcements
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Colleagues currently on leave or scheduled to take leave in the next 14 days.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800">
        {bulletinLeaves.length === 0 ? (
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-6 text-center border border-dashed border-gray-300 dark:border-slate-700">
            <p className="text-gray-500 dark:text-slate-400 text-sm">No upcoming leaves scheduled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bulletinLeaves.map((l: any) => {
              const start = new Date(l.startDate);
              const end = new Date(l.endDate);
              const isCurrent = start <= now && end >= now;
              
              return (
                <div key={l.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">{l.user.name}</h3>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{l.user.deptMemberships?.[0]?.department?.name || "N/A"}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold \${isCurrent ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'}`}>
                      {isCurrent ? "ON LEAVE NOW" : "UPCOMING"}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 text-xs text-gray-600 dark:text-slate-300">
                    <p><span className="font-semibold text-gray-700 dark:text-slate-200">Type:</span> {l.leaveType}</p>
                    <p><span className="font-semibold text-gray-700 dark:text-slate-200">Dates:</span> {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
