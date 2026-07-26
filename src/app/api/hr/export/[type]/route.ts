import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import {
  getHRAttendanceRecordsAction,
  getHREmployeesAction,
  getHRComplianceMetricsAction,
  getHRTransportStipendReportAction,
  getHRLeaveRequestsAction,
  getHRAttendanceExceptionsAction,
} from "@/lib/actions/hr.actions";
import { getDeptAttendanceRecordsAction } from "@/lib/actions/dept.actions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "HR" && user.role !== "SUPER_ADMIN" && user.role !== "DEPARTMENT_HEAD")) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { type } = await params;
  if (user.role === "DEPARTMENT_HEAD" && type !== "attendance") {
    return NextResponse.json({ error: "Unauthorized access to this resource" }, { status: 403 });
  }

  let csvContent = "";
  let filename = user.role === "DEPARTMENT_HEAD" ? "department_attendance_report.csv" : `hr_${type}_report.csv`;

  // Parse URL search parameters for filters
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const role = searchParams.get("role") || undefined;
  const employmentStatus = searchParams.get("employmentStatus") || undefined;
  const workArrangement = searchParams.get("workArrangement") || undefined;
  const isActive = searchParams.get("isActive") ? searchParams.get("isActive") === "true" : undefined;
  
  // Date range filters for attendance
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const employeeId = searchParams.get("employeeId") || undefined;
  const workLocation = searchParams.get("workLocation") || undefined;

  // Month / Year filters for compliance and stipend
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;

  // Exception filters
  const exceptionType = searchParams.get("exceptionType") || undefined;

  // Leave filters
  const leaveType = searchParams.get("leaveType") || undefined;

  if (type === "attendance" || type === "lateness" || type === "absenteeism") {
    const computedStatus = status || (type === "lateness" ? "LATE" : type === "absenteeism" ? "ABSENT" : undefined);
    let records;
    if (user.role === "DEPARTMENT_HEAD") {
      records = await getDeptAttendanceRecordsAction({
        startDate,
        endDate,
        workLocation,
        status: computedStatus,
      });
    } else {
      records = await getHRAttendanceRecordsAction({
        startDate,
        endDate,
        departmentId,
        employeeId,
        workLocation,
        status: computedStatus,
      });
    }
    csvContent = "Employee,Employee ID,Department,Total Days Worked,Office Days,Remote Days,Late Days,Non-Working Days Worked,Total Hours Worked,Avg Hours Per Day\n";
    records.forEach((r) => {
      csvContent += `"${r.employeeName}","${r.employeeId}","${r.department}","${r.totalDaysWorked}","${r.officeDays}","${r.remoteDays}","${r.lateDays}","${(r as any).specialDaysWorked || 0}","${r.totalHours.toFixed(1)}","${r.avgHoursPerDay}"\n`;
    });
  } else if (type === "compliance") {
    const metrics = await getHRComplianceMetricsAction({
      departmentId,
      month,
      year,
    });
    csvContent = "Employee,Employee ID,Department,Work Arrangement,Required Office Days,Actual Office Days,Compliance Percent,Status\n";
    metrics.forEach((m) => {
      csvContent += `"${m.employeeName}","${m.employeeId}","${m.department}","${m.workArrangement}","${m.requiredOfficeDays}","${m.actualOfficeDays}","${m.compliancePercent}%","${m.isCompliant ? "COMPLIANT" : "NON-COMPLIANT"}"\n`;
    });
  } else if (type === "stipend" || type === "transport") {
    const stipends = await getHRTransportStipendReportAction({
      month,
      year,
      departmentId,
    });
    csvContent = "Employee,Employee ID,Department,Required Office Days,Actual Office Days,Eligible Days,Daily Rate,Calculated Stipend Amount\n";
    stipends.forEach((s) => {
      csvContent += `"${s.employeeName}","${s.employeeId}","${s.department}","${s.requiredOfficeDays}","${s.actualOfficeDays}","${s.eligibleDays}","${s.ratePerDay}","${s.calculatedStipend}"\n`;
    });
  } else if (type === "leave") {
    const leaves = await getHRLeaveRequestsAction({
      status,
      departmentId,
      leaveType,
    });
    csvContent = "Employee,Employee ID,Department,Leave Type,Start Date,End Date,Days Count,Status,Reason\n";
    leaves.forEach((l) => {
      csvContent += `"${l.employeeName}","${l.employeeId}","${l.department}","${l.leaveType}","${new Date(l.startDate).toISOString().split("T")[0]}","${new Date(l.endDate).toISOString().split("T")[0]}","${l.daysCount}","${l.status}","${l.reason || ""}"\n`;
    });
  } else if (type === "exceptions") {
    const exceptions = await getHRAttendanceExceptionsAction({
      status,
      exceptionType,
      departmentId,
    });
    csvContent = "Employee,Employee ID,Department,Date,Exception Type,Description,Status,HR Comments\n";
    exceptions.forEach((e) => {
      csvContent += `"${e.employeeName}","${e.employeeId}","${e.department}","${new Date(e.workDate).toISOString().split("T")[0]}","${e.exceptionType}","${e.description}","${e.status}","${e.hrComments || ""}"\n`;
    });
  } else {
    const employees = await getHREmployeesAction({
      search,
      departmentId,
      role,
      employmentStatus,
      workArrangement,
      isActive,
    });
    csvContent = "Employee,Employee ID,Email,Department,Job Title,Role,Work Arrangement,Status\n";
    employees.forEach((e) => {
      csvContent += `"${e.name}","${e.employeeId}","${e.email}","${e.department}","${e.jobTitle}","${e.role}","${e.workArrangement}","${e.isActive ? "ACTIVE" : "INACTIVE"}"\n`;
    });
  }

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
