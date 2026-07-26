import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrganizationPreview } from "@/components/layout/OrganizationPreview";
import { WorkLocation } from "@prisma/client";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["SUPER_ADMIN", "HR"]);
  const { id } = await params;

  if (user.role === "HR" && user.organizationId !== id) {
    notFound();
  }

  const org = await db.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          memberships: true,
          departments: true,
          officeLocations: true,
          attendanceRecords: true,
        },
      },
      departments: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { memberships: true } },
          memberships: {
            where: { isHead: true },
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              deptMemberships: {
                include: { department: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      officeLocations: { orderBy: { name: "asc" } },
      policies: { orderBy: { createdAt: "desc" } },
      stipendPolicies: {
        include: { department: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true, email: true } } },
      },
      invitations: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: { department: { select: { name: true } } },
      },
    },
  });

  if (!org) notFound();

  // Recent attendance snapshot (latest 30 records)
  const recentAttendance = await db.attendanceRecord.findMany({
    where: { organizationId: id },
    orderBy: { workDate: "desc" },
    take: 30,
    include: {
      user: { select: { name: true, email: true } },
      department: { select: { name: true } },
    },
  });

  const officeCount = recentAttendance.filter((r) => r.workLocation === WorkLocation.OFFICE).length;
  const remoteCount = recentAttendance.filter((r) => r.workLocation === WorkLocation.REMOTE).length;

  const data = {
    org: JSON.parse(JSON.stringify(org)),
    recentAttendance: JSON.parse(JSON.stringify(recentAttendance)),
    attendanceSummary: { officeCount, remoteCount, total: recentAttendance.length },
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/organizations"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Organizations
      </Link>

      <OrganizationPreview data={data} />
    </div>
  );
}
