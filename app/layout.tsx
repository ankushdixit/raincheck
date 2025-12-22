import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { TRPCReactProvider } from "@/lib/api";
import { SessionProvider } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "RainCheck - Weather-aware half-marathon training",
  description:
    "RainCheck helps you plan your half-marathon training around the weather, so you can run in optimal conditions.",
  icons: [{ rel: "icon", url: "/icon.svg", type: "image/svg+xml" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
