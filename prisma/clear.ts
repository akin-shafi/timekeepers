import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing mock/temporary database records...");

  try {
    // Wrap deletions in a transaction or execute sequentially in order of dependencies
    await prisma.$transaction([
      // Delete logs and alerts
      prisma.auditLog.deleteMany({}),
      prisma.notification.deleteMany({}),

      // Delete corrections and attendance
      prisma.attendanceCorrection.deleteMany({}),
      prisma.attendanceRecord.deleteMany({}),
      prisma.attendanceException.deleteMany({}),

      // Delete leave and stipends
      prisma.leaveRecord.deleteMany({}),
      prisma.transportStipendCalculation.deleteMany({}),

      // Delete group structures
      prisma.groupMembership.deleteMany({}),
      prisma.group.deleteMany({}),

      // Delete memberships and invitations
      prisma.departmentMembership.deleteMany({}),
      prisma.organizationMembership.deleteMany({}),
      prisma.invitation.deleteMany({}),
      
      // Delete policies referencing users
      prisma.attendancePolicy.deleteMany({}),

      // Finally, delete all users
      prisma.user.deleteMany({}),
    ]);

    console.log("✅ Database reset complete! Preserved organizations, departments, and office locations.");
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
