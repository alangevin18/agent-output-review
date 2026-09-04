import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import { AppShell } from "@/components/shell/app-shell";
import { listSubmissions } from "@/lib/data/submissions";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans-geist",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-serif-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Output Review",
  description: "Review agent output",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const submissions = await listSubmissions();

  return (
    <html
      lang="en"
      className={`${geist.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className={`${geist.className} h-full overflow-hidden`}>
        <AppShell submissions={submissions}>{children}</AppShell>
      </body>
    </html>
  );
}
