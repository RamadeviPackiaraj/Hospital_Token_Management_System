import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthRoleProvider } from "@/components/auth/AuthRoleContext";
import { LogViewer } from "@/components/ui";
import { Toaster } from "react-hot-toast";
import "react-datepicker/dist/react-datepicker.css";
import "react-time-picker/dist/TimePicker.css";
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
        <AuthRoleProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3200,
              style: {
                border: "1px solid #E2E8F0",
                background: "#FFFFFF",
                color: "#0F172A",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "12px",
                padding: "12px 14px",
              },
              success: {
                iconTheme: {
                  primary: "#16A34A",
                  secondary: "#FFFFFF",
                },
                style: {
                  border: "1px solid #BBF7D0",
                  background: "#F0FDF4",
                  color: "#166534",
                },
              },
              error: {
                iconTheme: {
                  primary: "#DC2626",
                  secondary: "#FFFFFF",
                },
                style: {
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  color: "#991B1B",
                },
              },
            }}
          />
          <LogViewer />
        </AuthRoleProvider>
      </body>
    </html>
  );
}
