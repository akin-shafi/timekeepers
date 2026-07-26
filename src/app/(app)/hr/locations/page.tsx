import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { LocationManager } from "@/components/layout/LocationManager";

export default async function HRLocationsPage() {
  const hrUser = await requireRole(["HR"]);

  // Fetch locations for the HR user's organization
  const locations = await db.officeLocation.findMany({
    where: {
      organizationId: hrUser.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // For HR, only provide their own organization in the selection list
  const organizations = [
    {
      id: hrUser.organizationId,
      name: hrUser.organizationName,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 text-sm font-semibold mb-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Office Geofencing
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight font-sans">Geofences & Networks</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 font-sans">
          Configure office GPS coordinates, authorized Wi-Fi SSIDs, and IP whitelist constraints
        </p>
      </div>

      <LocationManager
        initialLocations={JSON.parse(JSON.stringify(locations))}
        organizations={JSON.parse(JSON.stringify(organizations))}
        adminOrgId={hrUser.organizationId}
        orgName={hrUser.organizationName}
      />
    </div>
  );
}
