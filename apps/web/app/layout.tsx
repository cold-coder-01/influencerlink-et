import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfluencerLink ET",
  description: "Premium B2B influencer matching for the Ethiopian economy.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "InfluencerLink",
  },
  icons: {
    apple: "/icons/influencerlink-et-blue-logo-192.png",
    icon: [
      { url: "/icons/influencerlink-et-blue-logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/influencerlink-et-blue-logo-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#182CFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
