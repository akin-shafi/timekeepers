import React from "react";
import { db } from "@/lib/db";
import { ALLOWED_DOMAIN } from "@/lib/auth";
import { SignUpForm } from "@/components/layout/SignUpForm";

export default async function SignUpPage() {
  // Find default organization and fetch its departments
  const org = await db.organization.findUnique({
    where: { slug: "getrova" },
  });

  const departments = org
    ? await db.department.findMany({
        where: { organizationId: org.id },
        orderBy: { name: "asc" },
      })
    : [];

  const mappedDepts = departments.map((d) => ({
    id: d.id,
    name: d.name,
  }));

  return (
    <SignUpForm allowedDomain={ALLOWED_DOMAIN} departments={mappedDepts} />
  );
}
