import { PrismaClient, Role, WorkLocation, AttendanceStatus, VerificationStatus, CorrectionStatus, VerificationMethod } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Attendance Management System database...");

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: "getrova" },
    update: {},
    create: {
      name: "Getrova Inc.",
      slug: "getrova",
      allowedDomains: ["getrova.com"],
      timezone: "Africa/Lagos",
      workStartTime: "09:00",
      workEndTime: "17:00",
      gracePeriodMins: 15,
      verificationType: VerificationMethod.GPS_GEOFENCE,
      hrApprovalRequiredForCorrection: true,
    },
  });

  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // 2. Create Office Location
  const office = await prisma.officeLocation.create({
    data: {
      organizationId: org.id,
      name: "Getrova HQ — Victoria Island",
      address: "11b Adeola Odeku St, Victoria Island, Lagos 106104, Lagos, Nigeria",
      latitude: 6.430642499999999,
      longitude: 3.4120922,
      radiusMeters: 100.0,
      allowedIPs: ["192.168.1.1/24", "102.89.23.45"],
      allowedSSIDs: ["Getrova_Corporate_5G", "Getrova_Guest"],
    },
  });

  console.log(`✅ Office location configured: ${office.name}`);

  // 3. Create Departments
  const engineering = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: "Engineering",
      description: "Software engineering, DevOps, and Platform teams",
    },
  });

  const product = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: "Product & Design",
      description: "Product management and UI/UX design",
    },
  });

  const hr = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: "Human Resources",
      description: "People Operations and Talent Acquisition",
    },
  });

  console.log("✅ Departments created: Engineering, Product & Design, Human Resources");

  // 4. Create Users & Memberships
  const adminUser = await prisma.user.upsert({
    where: { email: "alex.admin@getrova.com" },
    update: {},
    create: {
      email: "alex.admin@getrova.com",
      name: "Henry David",
      employeeId: "EMP-ADM-001",
      jobTitle: "Chief Technology Officer",
      phone: "+234 801 234 5678",
      workArrangement: "OFFICE",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      orgMemberships: {
        create: {
          organizationId: org.id,
          role: Role.SUPER_ADMIN,
        },
      },
      deptMemberships: {
        create: {
          departmentId: engineering.id,
          isHead: true,
        },
      },
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: "victor.owu@getrova.com" },
    update: {},
    create: {
      email: "victor.owu@getrova.com",
      name: "Victor Owu",
      employeeId: "EMP-HR-001",
      jobTitle: "Head of People Operations",
      phone: "+234 802 345 6789",
      workArrangement: "HYBRID",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      orgMemberships: {
        create: {
          organizationId: org.id,
          role: Role.HR,
        },
      },
      deptMemberships: {
        create: {
          departmentId: hr.id,
          isHead: true,
        },
      },
    },
  });

  const deptHeadUser = await prisma.user.upsert({
    where: { email: "ahmed@getrova.com" },
    update: {},
    create: {
      email: "ahmed@getrova.com",
      name: "Ahmed Oladele",
      employeeId: "EMP-ENG-001",
      jobTitle: "Engineering Manager",
      phone: "+234 803 456 7890",
      workArrangement: "HYBRID",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      orgMemberships: {
        create: {
          organizationId: org.id,
          role: Role.DEPARTMENT_HEAD,
        },
      },
      deptMemberships: {
        create: {
          departmentId: engineering.id,
          isHead: true,
        },
      },
    },
  });

  const devUser = await prisma.user.upsert({
    where: { email: "shafi@getrova.com" },
    update: {},
    create: {
      email: "shafi@getrova.com",
      name: "Shafi Akinropo",
      employeeId: "EMP-ENG-002",
      jobTitle: "Senior Frontend Engineer",
      phone: "+234 804 567 8901",
      workArrangement: "HYBRID",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      orgMemberships: {
        create: {
          organizationId: org.id,
          role: Role.EMPLOYEE,
        },
      },
      deptMemberships: {
        create: {
          departmentId: engineering.id,
          isHead: false,
        },
      },
    },
  });

  const remoteUser = await prisma.user.upsert({
    where: { email: "chibueze@getrova.com" },
    update: {},
    create: {
      email: "chibueze@getrova.com",
      name: "Chibueze Paul",
      employeeId: "EMP-ENG-003",
      jobTitle: "Backend Software Engineer",
      phone: "+234 805 678 9012",
      workArrangement: "REMOTE",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
      orgMemberships: {
        create: {
          organizationId: org.id,
          role: Role.EMPLOYEE,
        },
      },
      deptMemberships: {
        create: {
          departmentId: engineering.id,
          isHead: false,
        },
      },
    },
  });

  const hybridUser = await prisma.user.upsert({
    where: { email: "oluremilekun@getrova.com" },
    update: {},
    create: {
      email: "oluremilekun@getrova.com",
      name: "Emmanuel Oluremilekun",
      employeeId: "EMP-PRD-001",
      jobTitle: "Scrum Master",
      phone: "+234 806 789 0123",
      workArrangement: "HYBRID",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      orgMemberships: {
        create: {
          organizationId: org.id,
          role: Role.EMPLOYEE,
        },
      },
      deptMemberships: {
        create: {
          departmentId: engineering.id,
          isHead: false,
        },
      },
    },
  });

  console.log("✅ Seed Users created: Alex Admin, Grace HR, Sarah Jenkins, John Doe, Mary Smith, David Miller");

  // 5. Create Attendance Policies & Transport Stipend Policies
  await prisma.attendancePolicy.create({
    data: {
      organizationId: org.id,
      name: "Getrova Standard Hybrid Work Policy",
      requiredOfficeDaysPerWeek: 2,
      requiredOfficeDaysPerMonth: 8,
      mandatoryOfficeDays: ["TUESDAY", "THURSDAY"],
      isFlexible: true,
    },
  });

  await prisma.transportStipendPolicy.create({
    data: {
      organizationId: org.id,
      name: "Getrova Monthly Transport Allowance",
      stipendType: "PER_OFFICE_DAY",
      ratePerOfficeDay: 2500,
      maxMonthlyStipend: 50000,
      minRequiredAttendanceDays: 4,
    },
  });

  console.log("✅ Policies created: Hybrid Work Policy (2 days/wk) & Transport Stipend Policy (₦2,500/day)");

  // 6. Create Historical Attendance Records
  const now = new Date();
  const pastDays = [0, 1, 2, 3, 4, 7, 8];

  for (const daysAgo of pastDays) {
    const workDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo));

    // John Doe (Office worker)
    const johnCheckIn = new Date(workDate);
    johnCheckIn.setHours(8, 52, 0);
    const johnCheckOut = new Date(workDate);
    johnCheckOut.setHours(17, 15, 0);

    await prisma.attendanceRecord.create({
      data: {
        organizationId: org.id,
        departmentId: engineering.id,
        userId: devUser.id,
        workDate,
        checkInTime: johnCheckIn,
        checkOutTime: daysAgo === 0 ? null : johnCheckOut,
        workLocation: WorkLocation.OFFICE,
        officeLocationId: office.id,
        verificationStatus: VerificationStatus.VERIFIED,
        verificationNotes: "GPS Geofence verified (35m from HQ).",
        status: daysAgo === 0 ? AttendanceStatus.WORKING : AttendanceStatus.CHECKED_OUT,
        hoursWorked: daysAgo === 0 ? 0 : 8.38,
        isLate: false,
      },
    });

    // Mary Smith (Remote worker)
    const maryCheckIn = new Date(workDate);
    maryCheckIn.setHours(9, 5, 0);
    const maryCheckOut = new Date(workDate);
    maryCheckOut.setHours(17, 0, 0);

    await prisma.attendanceRecord.create({
      data: {
        organizationId: org.id,
        departmentId: engineering.id,
        userId: remoteUser.id,
        workDate,
        checkInTime: maryCheckIn,
        checkOutTime: daysAgo === 0 ? null : maryCheckOut,
        workLocation: WorkLocation.REMOTE,
        verificationStatus: VerificationStatus.VERIFIED,
        verificationNotes: "Verified Remote Work",
        status: daysAgo === 0 ? AttendanceStatus.REMOTE : AttendanceStatus.CHECKED_OUT,
        hoursWorked: daysAgo === 0 ? 0 : 7.91,
        isLate: true,
      },
    });
  }

  console.log("✅ Historical attendance records created.");

  // 7. Create Sample Leave Records
  const leaveStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 3));
  const leaveEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 7));

  await prisma.leaveRecord.create({
    data: {
      organizationId: org.id,
      userId: hybridUser.id,
      startDate: leaveStart,
      endDate: leaveEnd,
      daysCount: 5,
      leaveType: "Annual",
      reason: "Annual family vacation",
      status: "APPROVED",
      reviewerId: hrUser.id,
      reviewerNotes: "Approved by Grace HR",
    },
  });

  console.log("✅ Sample Leave Record created for David Miller.");

  // 8. Create Sample Attendance Exceptions
  await prisma.attendanceException.create({
    data: {
      organizationId: org.id,
      userId: devUser.id,
      workDate: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 1)),
      exceptionType: "LATE_CHECK_IN",
      description: "Checked in past standard grace period at 09:22 AM.",
      status: "OPEN",
    },
  });

  console.log("✅ Sample Attendance Exception created.");
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
