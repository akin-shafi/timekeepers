# Multi-Tenant Time & Attendance Management System

Production-ready **Time & Attendance Web Application** for hybrid work organizations, built with Next.js 14 App Router, TypeScript, Prisma ORM, PostgreSQL, Auth.js (Google OAuth), and Tailwind CSS.

---

## 🚀 Features & Architecture

### 1. Authentication & Google Workspace Domain Restrictions
- Domain-restricted Google OAuth login enforcing **`@getrova.com`** domain access.
- Auto-provisioning of employee accounts on first authorized login.
- Demo Sign-In selector for rapid offline testing across Super Admin, Department Head, and Employee roles.

### 2. Multi-Tenant Architecture & Data Isolation
- Strict database-level and API-level tenant scoping (`organizationId` on all tenant-specific tables).
- Server-side RBAC guards protecting routes and Server Actions.

### 3. Role-Based Access Control (RBAC)
- **Super Admin**: Organization settings, department management, user role updates, hybrid policies, office geofence setup, transport stipend payroll calculations, audit logs.
- **Department Head**: Department member overview, daily team check-in matrix, invitation system, attendance correction request approval workflow.
- **Employee**: Daily check-in/out dashboard, work location toggle (Office vs Remote), GPS geofence verification, personal attendance history, monthly calendar view, correction request submission.

### 4. Hybrid Work Policy Engine
- Configurable required office days per week (default 2 days) / month (default 8 days).
- Flexible office attendance & mandatory office days.

### 5. Office Attendance Verification
- **GPS Geofencing**: Haversine distance calculation between employee device coordinates and office location.
- **Network / Wi-Fi IP Verification**: Validates connection against corporate IP ranges.
- **Self-Declaration**: Flexible policy mode for unmonitored attendance.

### 6. Transport Stipend Payroll Engine
- Configurable per-office-day rate (e.g. ₦2,500/day) or fixed monthly allowance.
- Excludes public holidays and approved leave.
- One-click CSV Payroll Export for accounting/payroll systems.

### 7. Interactive Notification Center
- **System-Wide Alerts**: Correction submissions, review actions, and leave registries create target notifications.
- **Auto-Generated Exceptions**: Late or unverified office check-ins generate database exceptions and alert HR.
- **Dynamic Header Bell**: Live unread count badge, preview dropdown list, and one-click mark-as-read actions directly in the global navigation bar.
- **Central Log**: Unified notifications page (`/notifications`) with category icons and filter settings.

### 8. Location & Arrangement Compliance
- **Address Reverse-Geocoding**: Automatically resolves and displays the employee's localized physical address (e.g. *Adeola Odeku, Victoria Island, Lagos*) on the check-in panel via Google Maps API (with OpenStreetMap fallback).
- **Non-Working Day Validation**: Prompts warning modals on weekend/holiday check-in attempts. Logs and flags weekend work uniquely in UI reports and CSV exports.
- **Arrangement Mismatch Highlighting**: Highlights remote check-ins in red when an office day was expected to assist HR and managers with compliance monitoring.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma ORM
- **Authentication**: Auth.js / NextAuth (Google OAuth Provider + Credentials fallback)
- **Styling**: Tailwind CSS with custom glassmorphism design system & dark mode
- **Validation**: Zod & Server Actions

---

## 📦 Getting Started & Local Development

### 1. Prerequisites
- Node.js v18+
- PostgreSQL database (local or hosted instance e.g., Supabase / Neon / Docker)

### 2. Environment Variables Setup
Copy `.env.example` to `.env` and fill in your connection details:
```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/attendance_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
# Generate a secure random string (e.g. `openssl rand -base64 32`)
NEXTAUTH_SECRET="<YOUR_NEXTAUTH_SECRET>"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
DEFAULT_ALLOWED_DOMAIN="getrova.com"
```

### 3. Database Migration & Seeding
Push the Prisma schema to your database and populate seed data:
```bash
# Generate Prisma Client
npx prisma generate

# Push database migrations
npx prisma db push

# Seed demo data (Organization, Departments, Users, Policies, Records)
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Accounts

You can test all roles immediately using the **Fast Test Demo** selector on the Sign-In page (`/auth/signin`):

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Super Admin** | `alex.admin@getrova.com` | Full organization management & stipend calculations |
| **Department Head** | `sarah.head@getrova.com` | Engineering department daily monitor & correction approvals |
| **Employee (Office)** | `john.dev@getrova.com` | Check-in / check-out, geofencing & calendar |
| **Employee (Remote)** | `mary.remote@getrova.com` | Remote check-in & personal metrics |
| **Unauthorized Test** | `john@gmail.com` | Blocked by `@getrova.com` domain guard |

---

## 🧪 Running Verification Tests
```bash
npm test
```

---

## 🛡️ License
Proprietary — Built for Getrova Inc.
