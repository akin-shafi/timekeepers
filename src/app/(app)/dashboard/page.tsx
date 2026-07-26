import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";

export default async function DashboardRedirectPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  if (user.role === "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  } else if (user.role === "HR") {
    redirect("/hr/dashboard");
  } else if (user.role === "DEPARTMENT_HEAD") {
    redirect("/dept/dashboard");
  } else {
    redirect("/employee/dashboard");
  }
}
