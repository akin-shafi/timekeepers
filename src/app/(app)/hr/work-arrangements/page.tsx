import React from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { getHREmployeesAction, updateHREmployeeAction, updateDepartmentWorkArrangementAction } from "@/lib/actions/hr.actions";
import { Briefcase, Building, Laptop, Edit2, Sliders, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";

export default async function HRWorkArrangementsPage() {
  const hrUser = await getCurrentUser();
  if (!hrUser) return null;

  const employees = await getHREmployeesAction();

  const departments = await db.department.findMany({
    where: { organizationId: hrUser.organizationId },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Briefcase className="h-3.5 w-3.5 text-purple-400" /> Hybrid Work Policy Management
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Work Arrangement Management</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Assign and manage hybrid, remote, and office-based work policies for workforce</p>
        </div>
      </div>

      {/* Batch Apply Department Policy */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-purple-400" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Batch Apply Department Policy</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Apply a work arrangement, required office days, and shift hours to everyone in a department at once.
        </p>

        <form
          action={async (formData: FormData) => {
            "use server";
            const departmentId = formData.get("departmentId") as string;
            const workArrangement = formData.get("workArrangement") as string;
            const reqDays = Number(formData.get("requiredOfficeDaysPerWeek") || 2);
            const workingHours = formData.get("workingHours") as string;
            
            if (departmentId) {
              await updateDepartmentWorkArrangementAction({
                departmentId,
                workArrangement,
                requiredOfficeDaysPerWeek: reqDays,
                workingHours,
              });
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-350 mb-1.5">Select Department</label>
            <select
              name="departmentId"
              required
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            >
              <option value="">Choose department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-350 mb-1.5">Work Arrangement</label>
            <select
              name="workArrangement"
              required
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            >
              <option value="HYBRID">Hybrid (2 days/wk)</option>
              <option value="REMOTE">Fully Remote</option>
              <option value="OFFICE">Fully Office-Based</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-350 mb-1.5">Working Hours / Shift</label>
            <select
              name="workingHours"
              required
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            >
              <option value="09:00 - 17:00">09:00 - 17:00 (Std)</option>
              <option value="09:00 - 15:00">09:00 - 15:00 (Eng)</option>
              <option value="08:00 - 16:00">08:00 - 16:00 (Early)</option>
              <option value="08:00 - 17:00">08:00 - 17:00 (Ext)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/25 active:scale-[0.98]"
          >
            Apply to Department
          </button>
        </form>
      </div>

      {/* Work Arrangements Table */}
      <div className="glass-panel rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-100 dark:bg-slate-900/80 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Current Arrangement</th>
                <th className="px-6 py-4">Required Office Days</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Update Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
              {employees.map((emp, index) => (
                <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 font-mono w-12">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{emp.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">{emp.employeeId}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{emp.department}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        emp.workArrangement === "REMOTE"
                          ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                          : emp.workArrangement === "OFFICE"
                          ? "bg-brand-500/10 text-brand-300 border-brand-500/30"
                          : "bg-purple-500/10 text-purple-300 border-purple-500/30"
                      }`}
                    >
                      {emp.workArrangement}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700 dark:text-slate-200">
                    <div>
                      {emp.workArrangement === "REMOTE" ? "0 days/week" : emp.workArrangement === "OFFICE" ? "5 days/week" : "2 days/week (8/mo)"}
                    </div>
                    <div className="text-[10px] font-normal text-gray-400 dark:text-slate-500 mt-0.5 font-mono">
                      Shift: {emp.workingHours || "09:00 - 17:00"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      ACTIVE
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <form
                      action={async (formData: FormData) => {
                        "use server";
                        const workArrangement = formData.get("workArrangement") as string;
                        const reqDays = Number(formData.get("requiredOfficeDaysPerWeek") || 2);
                        const workingHours = formData.get("workingHours") as string;
                        await updateHREmployeeAction({
                          userId: emp.id,
                          workArrangement,
                          requiredOfficeDaysPerWeek: reqDays,
                          workingHours,
                        });
                      }}
                      className="flex items-center justify-end gap-2"
                    >
                      <select
                        name="workArrangement"
                        defaultValue={emp.workArrangement}
                        className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-gray-700 dark:text-slate-200 outline-none"
                      >
                        <option value="HYBRID">Hybrid (2 days/wk)</option>
                        <option value="REMOTE">Fully Remote</option>
                        <option value="OFFICE">Fully Office-Based</option>
                      </select>

                      <select
                        name="workingHours"
                        defaultValue={emp.workingHours || "09:00 - 17:00"}
                        className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-gray-700 dark:text-slate-200 outline-none"
                      >
                        <option value="09:00 - 17:00">09:00 - 17:00 (Std)</option>
                        <option value="09:00 - 15:00">09:00 - 15:00 (Eng)</option>
                        <option value="08:00 - 16:00">08:00 - 16:00 (Early)</option>
                        <option value="08:00 - 17:00">08:00 - 17:00 (Ext)</option>
                      </select>

                      <button
                        type="submit"
                        className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-gray-900 dark:text-white font-semibold text-xs transition-all"
                      >
                        Save
                      </button>
                    </form>
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
