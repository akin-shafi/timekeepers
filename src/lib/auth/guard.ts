import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  organizationId: string;
  organizationName: string;
  departmentIds: string[];
  managesGroups?: boolean;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id || !session.user.organizationId) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name,
    role: session.user.role,
    organizationId: session.user.organizationId,
    organizationName: session.user.organizationName,
    departmentIds: session.user.departmentIds || [],
    managesGroups: session.user.managesGroups,
  };
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Access restricted to roles [${allowedRoles.join(", ")}].`);
  }
  return user;
}

export async function requireSuperAdmin(): Promise<AuthenticatedUser> {
  return requireRole([Role.SUPER_ADMIN]);
}

export async function requireHR(): Promise<AuthenticatedUser> {
  return requireRole([Role.SUPER_ADMIN, Role.HR]);
}

export async function requireHROrAdmin(): Promise<AuthenticatedUser> {
  return requireRole([Role.SUPER_ADMIN, Role.HR]);
}

export async function requireDepartmentHead(): Promise<AuthenticatedUser> {
  return requireRole([Role.SUPER_ADMIN, Role.HR, Role.DEPARTMENT_HEAD]);
}

export async function requireDepartmentHeadOrGroupManager(): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (
    user.role === Role.SUPER_ADMIN ||
    user.role === Role.HR ||
    user.role === Role.DEPARTMENT_HEAD ||
    user.managesGroups
  ) {
    return user;
  }
  throw new Error("Forbidden: Access restricted to managers or administrators.");
}

export function verifyTenantAccess(entityOrganizationId: string, userOrganizationId: string) {
  if (entityOrganizationId !== userOrganizationId) {
    throw new Error("Security Violation: Tenant cross-contamination attempt blocked.");
  }
}
