import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pause",
  description:
    "A break-glass tool for the moment before you send something you can't take back. Everything stays on this device.",
  applicationName: "Pause",
  // No crawling, no previews, no sharing surface. This is a private utility.
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Pause" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Zoom stays available — an emergency screen must not fight accessibility
  // settings — but the layout is built so it is never needed.
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
