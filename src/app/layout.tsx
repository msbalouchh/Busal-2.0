import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { AppProviders } from "@/providers/app-providers";
import { defaultMetadata } from "@/config/site";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${ibmPlexMono.variable} bg-background text-text min-h-screen antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
