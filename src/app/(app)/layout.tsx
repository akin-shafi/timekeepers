import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { IdleTimeout } from "@/components/providers/IdleTimeout";
import { getCurrentUser } from "@/lib/auth/guard";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user && user.role !== "SUPER_ADMIN") {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        deptMemberships: true,
      },
    });

    if (
      !dbUser ||
      !dbUser.name ||
      !dbUser.jobTitle ||
      !dbUser.workArrangement ||
      !dbUser.deptMemberships ||
      dbUser.deptMemberships.length === 0
    ) {
      redirect("/auth/signup");
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <IdleTimeout />
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
