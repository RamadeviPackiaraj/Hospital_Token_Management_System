import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthRoleProvider } from "@/components/auth/AuthRoleContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Hospital Token Management System",
  description: "Minimal hospital token management system UI for authentication, queue flow, and daily operations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-[#F8FAFC] text-[#0F172A]`}>
        <AuthRoleProvider>{children}</AuthRoleProvider>
      </body>
    </html>
  );
}
