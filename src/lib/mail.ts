import nodemailer from "nodemailer";
import {
  getInvitationEmailHtml,
  getShareReportEmailHtml,
  getLeaveStatusEmailHtml,
  getCorrectionEmailHtml,
  getWelcomeEmailHtml,
  getCheckInReminderEmailHtml,
  getCheckOutReminderEmailHtml,
} from "./mail-templates";

// Configure SMTP Transport
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpFrom = (process.env.SMTP_FROM || '"Time Keeper" <noreply@getrova.com>').replace(/\\"/g, '"');

// Create the nodemailer transporter if configuration is present
const createTransporter = () => {
  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn(
      "⚠️ SMTP Mail settings are not fully configured in your .env file. " +
      "Emails will not be sent, but operations will complete successfully."
    );
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // Use SSL for port 465, TLS/STARTTLS for port 587
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
};

/**
 * Core send helper wrapper.
 */
async function sendMailHelper(
  to: string,
  subject: string,
  textFallback: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[MOCK MAIL] Sending to: ${to} | Subject: ${subject}`);
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      text: textFallback,
      html: htmlContent,
    });
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to} (Subject: ${subject}):`, error);
    return { success: false, error: error.message || "Failed to send email." };
  }
}

/**
 * Sends a visually styled HTML invitation email.
 */
export async function sendInvitationEmail(
  to: string,
  orgName: string,
  inviteLink: string,
  role: string
) {
  const formattedRole = role.toLowerCase().replace(/_/g, " ");
  const text = `You have been invited to join ${orgName} as a ${formattedRole} on Time Keeper. Link: ${inviteLink}`;
  const html = getInvitationEmailHtml(orgName, inviteLink, role);

  return sendMailHelper(to, `Invitation to join ${orgName} on Time Keeper`, text, html);
}

/**
 * Sends shared report email.
 */
export async function sendShareReportEmail(
  to: string,
  senderName: string,
  reportName: string,
  reportPeriod: string,
  downloadLink: string
) {
  const text = `${senderName} shared the report "${reportName}" (${reportPeriod}) with you. Download: ${downloadLink}`;
  const html = getShareReportEmailHtml(senderName, reportName, reportPeriod, downloadLink);

  return sendMailHelper(to, `Report Shared: ${reportName}`, text, html);
}

/**
 * Sends Leave status update email.
 */
export async function sendLeaveStatusEmail(
  to: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  status: "APPROVED" | "REJECTED",
  notes?: string
) {
  const text = `Your ${leaveType} leave request for ${startDate} to ${endDate} has been ${status.toLowerCase()}.`;
  const html = getLeaveStatusEmailHtml(leaveType, startDate, endDate, status, notes);

  return sendMailHelper(to, `Leave Request ${status}`, text, html);
}

/**
 * Sends Correction status update/alert email.
 */
export async function sendCorrectionEmail(
  to: string,
  employeeName: string,
  workDate: string,
  status: "APPROVED" | "REJECTED" | "PENDING",
  type: "EMPLOYEE_REQUEST" | "REVIEW_UPDATE",
  notes?: string
) {
  const title = type === "EMPLOYEE_REQUEST" 
    ? "New Attendance Correction Request" 
    : "Attendance Correction Reviewed";
  const text = type === "EMPLOYEE_REQUEST"
    ? `${employeeName} requested a correction for ${workDate}.`
    : `Your correction request for ${workDate} has been ${status.toLowerCase()}.`;
  const html = getCorrectionEmailHtml(employeeName, workDate, status, type, notes);

  return sendMailHelper(to, title, text, html);
}

/**
 * Sends a welcome email to self-onboarded user.
 */
export async function sendWelcomeEmail(to: string, name: string, orgName: string) {
  const text = `Welcome to ${orgName}, ${name}! Remember to login daily to mark your attendance register.`;
  const html = getWelcomeEmailHtml(name, orgName);
  return sendMailHelper(to, `Welcome to ${orgName}!`, text, html);
}

/**
 * Sends a daily check-in reminder email.
 */
export async function sendCheckInReminderEmail(to: string, name: string, orgName: string) {
  const text = `Good Morning ${name}! This is a reminder to check in today on the Time Keeper dashboard.`;
  const html = getCheckInReminderEmailHtml(name, orgName);
  return sendMailHelper(to, "Reminder: Daily Check-In", text, html);
}

/**
 * Sends a daily check-out reminder email.
 */
export async function sendCheckOutReminderEmail(to: string, name: string, orgName: string) {
  const text = `Time to wrap up! Don't forget to check out today on the Time Keeper dashboard.`;
  const html = getCheckOutReminderEmailHtml(name, orgName);
  return sendMailHelper(to, "Reminder: Daily Check-Out", text, html);
}

