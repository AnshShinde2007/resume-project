import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeAI — Instant Profile from Your Resume",
  description:
    "Upload your resume and instantly generate a stunning profile with extracted skills, projects, and personal info.",
  keywords: ["resume parser", "profile generator", "skills extractor", "resume AI"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
