import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding essential admin/HR users...");

  // Fetch existing org and departments (already exist, do not recreate)
  const org = await prisma.organization.findFirst({
    where: { slug: "getrova" },
  });

  if (!org) {
    throw new Error("❌ Organization not found. Run the full seed first.");
  }

  const engineeringDept = await prisma.department.findFirst({
    where: { organizationId: org.id, name: "Engineering" },
  });

  const hrDept = await prisma.department.findFirst({
    where: { organizationId: org.id, name: "Human Resources" },
  });

  if (!engineeringDept || !hrDept) {
    throw new Error("❌ Departments not found. Run the full seed first.");
  }

  // Create Admin user (upsert — safe to re-run)
  const adminUser = await prisma.user.upsert({
    where: { email: "alex.admin@getrova.com" },
    update: {},
    create: {
      email: "alex.admin@getrova.com",
      name: "Alex Admin",
      employeeId: "EMP-ADM-001",
      jobTitle: "Chief Technology Officer",
      phone: "+234 801 234 5678",
      workArrangement: "OFFICE",
      orgMemberships: {
        create: {
          organizationId: org.id,
          role: Role.SUPER_ADMIN,
        },
      },
      deptMemberships: {
        create: {
          departmentId: engineeringDept.id,
          isHead: true,
        },
      },
    },
  });

  console.log(`✅ Admin user ready: ${adminUser.email}`);

  // Create HR user (upsert — safe to re-run)
  const hrUser = await prisma.user.upsert({
    where: { email: "grace.hr@getrova.com" },
    update: {},
    create: {
      email: "grace.hr@getrova.com",
      name: "Grace HR",
      employeeId: "EMP-HR-001",
      jobTitle: "Head of People Operations",
      phone: "+234 802 345 6789",
      workArrangement: "HYBRID",
      orgMemberships: {
        create: {
          organizationId: org.id,
          role: Role.HR,
        },
      },
      deptMemberships: {
        create: {
          departmentId: hrDept.id,
          isHead: true,
        },
      },
    },
  });

  console.log(`✅ HR user ready: ${hrUser.email}`);
  console.log("🎉 Essential users seeded. App is ready for real invitations.");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
