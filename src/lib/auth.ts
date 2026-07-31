import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

export const ALLOWED_DOMAIN = process.env.DEFAULT_ALLOWED_DOMAIN || "getrova.com";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Admin Credentials Provider",
      credentials: {
        email: { label: "Admin Email", type: "email", placeholder: "admin@email.com" },
        password: { label: "Admin Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        const adminEmail = process.env.ADMIN_EMAIL || "admin@email.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

        const isValidAdmin = email === adminEmail.toLowerCase().trim() && password === adminPassword;
        
        let isValidHr = false;
        if (process.env.NODE_ENV === "development") {
          const hrEmail = process.env.DUMMY_HR_EMAIL || "hr.admin@getrova.com";
          const hrPassword = process.env.DUMMY_HR_PASSWORD || "admin123";
          isValidHr = email === hrEmail && password === hrPassword;
        }

        // Only allow the super admin email and hr dummy email through credentials login
        if (!isValidAdmin && !isValidHr) {
          throw new Error("Invalid administrator credentials.");
        }

        // Find or create admin user
        let user = await db.user.findUnique({
          where: { email },
          include: {
            orgMemberships: {
              include: {
                organization: true,
              },
            },
            deptMemberships: {
              include: {
                department: true,
              },
            },
          },
        });

        if (!user) {
          // Provision default organization if not exists
          const defaultOrg = await db.organization.upsert({
            where: { slug: "getrova" },
            update: {},
            create: {
              name: "Getrova Inc.",
              slug: "getrova",
              allowedDomains: [ALLOWED_DOMAIN],
              timezone: "UTC",
              workStartTime: "09:00",
              workEndTime: "17:00",
            },
          });

          const isSuperAdmin = email === adminEmail.toLowerCase().trim();

          user = await db.user.create({
            data: {
              email,
              name: isSuperAdmin ? "System Administrator" : "HR Admin",
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
              lastLoginAt: new Date(),
              workArrangement: "OFFICE",
              jobTitle: isSuperAdmin ? "Super Admin" : "HR Admin",
              orgMemberships: {
                create: {
                  organizationId: defaultOrg.id,
                  role: isSuperAdmin ? "SUPER_ADMIN" : "HR",
                },
              },
            },
            include: {
              orgMemberships: {
                include: {
                  organization: true,
                },
              },
              deptMemberships: {
                include: {
                  department: true,
                },
              },
            },
          });
        } else {
          // Update last login
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        }

        const primaryOrgMembership = user.orgMemberships[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          role: primaryOrgMembership?.role || "SUPER_ADMIN",
          organizationId: primaryOrgMembership?.organizationId || "",
          organizationName: primaryOrgMembership?.organization?.name || "",
          departmentIds: user.deptMemberships.map((d: { departmentId: any; }) => d.departmentId),
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;

        const domain = email.split("@")[1];
        if (domain !== ALLOWED_DOMAIN) {
          console.warn(`[AUTH] Access denied for unauthorized domain: ${domain}`);
          return `/auth/error?error=DomainNotAllowed&domain=${domain}`;
        }

        // Auto-provision Google user
        try {
          let existingUser = await db.user.findUnique({
            where: { email },
            include: { orgMemberships: true },
          });

          if (!existingUser) {
            const org = await db.organization.upsert({
              where: { slug: "getrova" },
              update: {},
              create: {
                name: "Getrova Inc.",
                slug: "getrova",
                allowedDomains: [ALLOWED_DOMAIN],
              },
            });

            existingUser = await db.user.create({
              data: {
                email,
                name: user.name || email.split("@")[0],
                avatarUrl: user.image,
                lastLoginAt: new Date(),
                orgMemberships: {
                  create: {
                    organizationId: org.id,
                    role: "EMPLOYEE",
                  },
                },
              },
              include: { orgMemberships: true },
            });
          } else {
            await db.user.update({
              where: { id: existingUser.id },
              data: { lastLoginAt: new Date() },
            });
          }
        } catch (error) {
          console.error("[AUTH] Error auto-provisioning Google OAuth user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // On initial sign-in, store the userId
      if (user) {
        const fullUser = await db.user.findUnique({
          where: { email: user.email! },
          include: {
            orgMemberships: { include: { organization: true } },
            deptMemberships: true,
          },
        });

        if (fullUser && fullUser.orgMemberships.length > 0) {
          const primaryOrg = fullUser.orgMemberships[0];
          token.userId = fullUser.id;
          token.role = primaryOrg.role;
          token.organizationId = primaryOrg.organizationId;
          token.organizationName = primaryOrg.organization.name;
          token.departmentIds = fullUser.deptMemberships.map((d: { departmentId: any; }) => d.departmentId);
          
          const managesGroupsCount = await db.group.count({
            where: { managerId: fullUser.id },
          });
          token.managesGroups = managesGroupsCount > 0;
        }
      } else if (token.userId) {
        // On subsequent requests, refresh org data from DB so renames/role changes take effect
        const freshUser = await db.user.findUnique({
          where: { id: token.userId as string },
          include: {
            orgMemberships: { include: { organization: true } },
            deptMemberships: true,
          },
        });

        if (freshUser && freshUser.orgMemberships.length > 0) {
          const primaryOrg = freshUser.orgMemberships[0];
          token.name = freshUser.name;
          token.picture = freshUser.avatarUrl;
          token.role = primaryOrg.role;
          token.organizationId = primaryOrg.organizationId;
          token.organizationName = primaryOrg.organization.name;
          token.departmentIds = freshUser.deptMemberships.map((d: { departmentId: any; }) => d.departmentId);
          
          const managesGroupsCount = await db.group.count({
            where: { managerId: freshUser.id },
          });
          token.managesGroups = managesGroupsCount > 0;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as any;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.departmentIds = (token.departmentIds as string[]) || [];
        session.user.managesGroups = !!token.managesGroups;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    // 15-minute idle window. The client-side IdleTimeout watcher enforces
    // logout on real inactivity; this is the server-side ceiling so a token
    // can never outlive the idle window even if the client isn't running.
    maxAge: 15 * 60, // 15 minutes
    updateAge: 5 * 60, // refresh the token at most every 5 min while active
  },
  secret: process.env.NEXTAUTH_SECRET,
};
