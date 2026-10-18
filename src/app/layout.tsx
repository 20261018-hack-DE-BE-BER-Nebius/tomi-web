import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/features/shell/AppProvider";
import "@/styles/globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tomi — Knowledge, across time",
  description:
    "An evidence lens connecting historical Britannica and modern Wikipedia.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tomi",
  },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#76b900",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
