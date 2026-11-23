import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import { AppShell } from "@/components/layout/AppShell";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "StrideLog", template: "%s · StrideLog" },
  description: "Track your runs and walks, streaks, badges, notes and progress photos.",
  applicationName: "StrideLog",
  appleWebApp: { capable: true, title: "StrideLog", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <Providers>
          {/* usePathname() needs a Suspense boundary on routes with dynamic params (Cache Components). */}
          <Suspense fallback={<PageSkeleton />}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
