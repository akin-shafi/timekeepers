/**
 * Helper to escape HTML characters from user input
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Base HTML wrapper to enforce consistent styling, branding, and responsiveness across all system emails.
 */
function getEmailLayout(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
          <!-- Header/Logo Area -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #10b981;">TIME KEEPER</span>
              <span style="font-size: 14px; font-weight: 600; color: #94a3b8; display: block; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px;">Attendance & Compliance</span>
            </td>
          </tr>
          <!-- Body Area -->
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer Area -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 40px; text-align: center; border-top: 1px solid #334155;">
              <p style="font-size: 11px; line-height: 16px; color: #475569; margin: 0;">
                &copy; 2026 Time Keeper. All rights reserved.<br>
                This is an automated system email. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 1. User Invitation Email Template
 */
export function getInvitationEmailHtml(orgName: string, inviteLink: string, role: string): string {
  const formattedRole = role.toLowerCase().replace(/_/g, " ");
  const body = `
    <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0; text-align: center;">
      You've been invited!
    </h1>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin: 0 0 24px 0; text-align: center;">
      You have been invited to join <strong>${orgName}</strong> as a <strong>${formattedRole}</strong> on the Time Keeper attendance system.
    </p>
    
    <!-- CTA Button Container -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${inviteLink}" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
            Accept Invitation & Set Up Account
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size: 13px; line-height: 20px; color: #94a3b8; margin: 0 0 12px 0; text-align: center;">
      This invitation link will expire in 7 days.
    </p>
    
    <!-- Divider -->
    <hr style="border: 0; border-top: 1px solid #334155; margin: 32px 0;">

    <!-- Trouble clicking button fallback -->
    <p style="font-size: 12px; line-height: 18px; color: #64748b; margin: 0; word-break: break-all; text-align: center;">
      If you're having trouble with the button above, copy and paste the URL below into your web browser:<br>
      <a href="${inviteLink}" target="_blank" style="color: #10b981; text-decoration: underline;">${inviteLink}</a>
    </p>
  `;
  return getEmailLayout(`Invitation to join ${orgName}`, body);
}

/**
 * 2. Shared Report Email Template
 */
export function getShareReportEmailHtml(
  senderName: string,
  reportName: string,
  reportPeriod: string,
  downloadLink: string
): string {
  const body = `
    <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0; text-align: center;">
      Attendance Report Shared
    </h1>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin: 0 0 24px 0; text-align: center;">
      <strong>${senderName}</strong> has shared a report with you from Time Keeper.
    </p>

    <!-- Report details table -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #0f172a; border-radius: 8px; border: 1px solid #334155; margin: 24px 0; padding: 16px;">
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0;"><strong>Report Type:</strong></td>
        <td style="font-size: 14px; color: #f8fafc; padding: 6px 0; text-align: right;">${reportName}</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0;"><strong>Period:</strong></td>
        <td style="font-size: 14px; color: #f8fafc; padding: 6px 0; text-align: right;">${reportPeriod}</td>
      </tr>
    </table>
    
    <!-- CTA Button Container -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${downloadLink}" target="_blank" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
            Download Report File
          </a>
        </td>
      </tr>
    </table>
  `;
  return getEmailLayout(`Report Shared: ${reportName}`, body);
}

/**
 * 3. Leave Status Email Template (Employee Notification)
 */
export function getLeaveStatusEmailHtml(
  leaveType: string,
  startDate: string,
  endDate: string,
  status: "APPROVED" | "REJECTED",
  notes?: string
): string {
  const isApproved = status === "APPROVED";
  const badgeColor = isApproved ? "#10b981" : "#ef4444";
  const body = `
    <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0; text-align: center;">
      Leave Request Update
    </h1>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin: 0 0 24px 0; text-align: center;">
      Your request for <strong>${leaveType} Leave</strong> has been reviewed.
    </p>

    <!-- Request info card -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #0f172a; border-radius: 8px; border: 1px solid #334155; margin: 24px 0; padding: 16px;">
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0;"><strong>Duration:</strong></td>
        <td style="font-size: 14px; color: #f8fafc; padding: 6px 0; text-align: right;">${startDate} to ${endDate}</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0;"><strong>Status:</strong></td>
        <td style="font-size: 14px; color: ${badgeColor}; padding: 6px 0; text-align: right; font-weight: 700; text-transform: uppercase;">
          ${status}
        </td>
      </tr>
      ${
        notes
          ? `
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0; vertical-align: top;"><strong>Reviewer Notes:</strong></td>
        <td style="font-size: 14px; color: #cbd5e1; padding: 6px 0; text-align: right; font-style: italic;">
          "${notes}"
        </td>
      </tr>
      `
          : ""
      }
    </table>
  `;
  return getEmailLayout(`Leave Request ${status}`, body);
}

/**
 * 4. Attendance Correction Alert / Update Template
 */
export function getCorrectionEmailHtml(
  employeeName: string,
  workDate: string,
  status: "APPROVED" | "REJECTED" | "PENDING",
  type: "EMPLOYEE_REQUEST" | "REVIEW_UPDATE",
  notes?: string
): string {
  const isPending = status === "PENDING";
  const badgeColor = status === "APPROVED" ? "#10b981" : status === "REJECTED" ? "#ef4444" : "#f59e0b";
  
  const title = type === "EMPLOYEE_REQUEST" 
    ? "New Attendance Correction Request" 
    : "Attendance Correction Reviewed";

  const message = type === "EMPLOYEE_REQUEST"
    ? `<strong>${employeeName}</strong> has submitted a correction request for attendance on <strong>${workDate}</strong>.`
    : `Your attendance correction request for <strong>${workDate}</strong> has been <strong>${status.toLowerCase()}</strong>.`;

  const body = `
    <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0; text-align: center;">
      ${title}
    </h1>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin: 0 0 24px 0; text-align: center;">
      ${message}
    </p>

    <!-- Details card -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #0f172a; border-radius: 8px; border: 1px solid #334155; margin: 24px 0; padding: 16px;">
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0;"><strong>Date:</strong></td>
        <td style="font-size: 14px; color: #f8fafc; padding: 6px 0; text-align: right;">${workDate}</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0;"><strong>Status:</strong></td>
        <td style="font-size: 14px; color: ${badgeColor}; padding: 6px 0; text-align: right; font-weight: 700; text-transform: uppercase;">
          ${status}
        </td>
      </tr>
      ${
        notes
          ? `
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0; vertical-align: top;"><strong>Notes:</strong></td>
        <td style="font-size: 14px; color: #cbd5e1; padding: 6px 0; text-align: right; font-style: italic;">
          "${notes}"
        </td>
      </tr>
      `
          : ""
      }
    </table>
  `;
  return getEmailLayout(title, body);
}

/**
 * 5. Self-Registration Welcome Email Template
 */
export function getWelcomeEmailHtml(employeeName: string, orgName: string): string {
  const title = `Welcome to ${orgName}!`;
  const body = `
    <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0; text-align: center;">
      Welcome to ${orgName}, ${employeeName}!
    </h1>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin: 0 0 24px 0; text-align: center;">
      Your profile has been successfully configured on the <strong>Time Keeper</strong> system. 
    </p>
    
    <div style="background: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin: 24px 0; text-align: left;">
      <h3 style="font-size: 14px; font-weight: 700; color: #10b981; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">
        💡 Important Reminder
      </h3>
      <p style="font-size: 13px; line-height: 20px; color: #cbd5e1; margin: 0;">
        Please always remember to <strong>login daily</strong> to mark your register and record your check-in and check-out times. Ensuring accurate logs is required for payroll calculations and allowance/stipend review.
      </p>
    </div>

    <!-- CTA Button Container -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
            Sign In to mark your attendance
          </a>
        </td>
      </tr>
    </table>
  `;
  return getEmailLayout(title, body);
}

/**
 * 6. Daily Check-In Reminder Template
 */
export function getCheckInReminderEmailHtml(employeeName: string, orgName: string): string {
  const title = "Reminder: Daily Check-In";
  const body = `
    <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0; text-align: center;">
      Good Morning, ${employeeName}! ☀️
    </h1>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin: 0 0 24px 0; text-align: center;">
      This is a quick reminder to log into the <strong>Time Keeper</strong> dashboard and record your check-in for today.
    </p>

    <!-- Info Callout -->
    <div style="background: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 18px; margin: 24px 0; text-align: left;">
      <p style="font-size: 13px; line-height: 20px; color: #cbd5e1; margin: 0;">
        📌 Keeping your daily records updated is essential for verifying your attendance and calculating allowances/stipends correctly.
      </p>
    </div>

    <!-- CTA Button Container -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
            Check In Now
          </a>
        </td>
      </tr>
    </table>
  `;
  return getEmailLayout(title, body);
}

/**
 * 7. Daily Check-Out Reminder Template
 */
export function getCheckOutReminderEmailHtml(employeeName: string, orgName: string): string {
  const title = "Reminder: Daily Check-Out";
  const body = `
    <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0; text-align: center;">
      Time to wrap up! 👋
    </h1>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin: 0 0 24px 0; text-align: center;">
      Hello ${employeeName}, don't forget to log out! Please record your check-out on the <strong>Time Keeper</strong> dashboard to complete your timesheet for today.
    </p>

    <!-- Info Callout -->
    <div style="background: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 18px; margin: 24px 0; text-align: left;">
      <p style="font-size: 13px; line-height: 20px; color: #cbd5e1; margin: 0;">
        ⚡ Make sure to finalize your working hours. Also, remember to keep a record of your milestones and submit your end-of-the-week report by Friday!
      </p>
    </div>

    <!-- CTA Button Container -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
            Check Out Now
          </a>
        </td>
      </tr>
    </table>
  `;
  return getEmailLayout(title, body);
}

/**
 * 8. New Leave Request Email Template (Manager/HR Notification)
 */
export function getNewLeaveRequestEmailHtml(
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  reason: string,
  reviewLink: string
): string {
  const title = "New Leave Request Requires Approval";
  const body = `
    <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0; text-align: center;">
      New Leave Request
    </h1>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin: 0 0 24px 0; text-align: center;">
      <strong>${employeeName}</strong> has submitted a new leave request that requires your review and approval.
    </p>

    <!-- Details card -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #0f172a; border-radius: 8px; border: 1px solid #334155; margin: 24px 0; padding: 16px;">
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0;"><strong>Employee:</strong></td>
        <td style="font-size: 14px; color: #f8fafc; padding: 6px 0; text-align: right;">${employeeName}</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0;"><strong>Leave Type:</strong></td>
        <td style="font-size: 14px; color: #f8fafc; padding: 6px 0; text-align: right;">${leaveType}</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0;"><strong>Duration:</strong></td>
        <td style="font-size: 14px; color: #f8fafc; padding: 6px 0; text-align: right;">${startDate} to ${endDate}</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #94a3b8; padding: 6px 0; vertical-align: top;"><strong>Reason:</strong></td>
        <td style="font-size: 14px; color: #cbd5e1; padding: 6px 0; text-align: right; font-style: italic;">
          "${escapeHtml(reason)}"
        </td>
      </tr>
    </table>

    <!-- CTA Button Container -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${reviewLink}" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
            Review Request
          </a>
        </td>
      </tr>
    </table>
  `;
  return getEmailLayout(title, body);
}
