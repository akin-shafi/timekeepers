"use client";

import React, { useEffect, useState } from "react";
import { getMyMilestonesAction } from "@/lib/actions/attendance.actions";
import { CheckCircle2, Calendar, Clock, NotebookText } from "lucide-react";

export default function MyMilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getMyMilestonesAction();
        if (res.success && res.records) {
          setMilestones(res.records);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand-500 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <NotebookText className="h-3.5 w-3.5" /> Performance & KPIs
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">My Milestones</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            A record of your weekly achievements and completed tasks.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      ) : milestones.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-4">
          <div className="mx-auto h-16 w-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-400">
            <NotebookText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Milestones Yet</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
            When you check out and add your daily achievements, they will appear here for your future reference and KPI reviews.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {milestones.map((m) => (
            <div key={m.id} className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400 font-semibold">
                  <Calendar className="h-5 w-5" />
                  {new Date(m.workDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  {m.hoursWorked} hrs worked
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="mt-1 h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {m.dailyMilestone}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
