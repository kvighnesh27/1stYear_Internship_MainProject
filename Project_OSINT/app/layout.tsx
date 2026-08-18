import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/store/auth-context";

export const metadata: Metadata = {
  title: "Aegis OSINT | Threat Intelligence",
  description: "Enterprise AI-powered OSINT threat intelligence platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
