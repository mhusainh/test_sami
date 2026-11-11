import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rekrutmen SAMI",
  description: "Sistem pendaftaran lowongan kerja dan back office HRD",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
