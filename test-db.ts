import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ name: u.name, officeDays: u.officeDays, reqM: u.requiredOfficeDaysPerMonth, reqW: u.requiredOfficeDaysPerWeek })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
