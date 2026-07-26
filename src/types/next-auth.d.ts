import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      organizationId: string;
      organizationName: string;
      departmentIds: string[];
      managesGroups?: boolean;
    };
  }

  interface User {
    id: string;
    role?: Role;
    organizationId?: string;
    organizationName?: string;
    departmentIds?: string[];
    managesGroups?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: Role;
    organizationId: string;
    organizationName: string;
    departmentIds: string[];
    managesGroups?: boolean;
  }
}
