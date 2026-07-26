import { requireHR } from "@/lib/auth/guard";
import { getHRDepartmentsAction, getHRAvailableHeadsAction } from "@/lib/actions/hr.actions";
import { DepartmentManager } from "@/components/hr/DepartmentManager";

export default async function HRDepartmentsPage() {
  await requireHR();
  const departments = await getHRDepartmentsAction();
  const availableHeads = await getHRAvailableHeadsAction();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 text-sm font-semibold mb-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Department Management
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Departments</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Create, edit, and manage departments in your organisation</p>
      </div>

      <DepartmentManager 
        departments={JSON.parse(JSON.stringify(departments))} 
        availableHeads={availableHeads}
      />
    </div>
  );
}
