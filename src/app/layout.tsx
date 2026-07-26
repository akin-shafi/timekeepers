import type { Metadata } from "next";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";

export const metadata: Metadata = {
  title: "Time Keeper | Attendance Management",
  description: "Hybrid time & attendance tracking system with geofencing, compliance reporting, and transport stipend calculations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen flex flex-col antialiased transition-colors duration-300">
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
