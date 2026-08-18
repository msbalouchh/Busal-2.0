import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { AppProviders } from "@/providers/app-providers";
import { defaultMetadata } from "@/config/site";

import "./globals.css";

// The marketing homepage establishes Manrope as Busal's interface typeface.
// Loading it at the root keeps authenticated and public experiences visually
// coherent while the marketing layout retains Fraunces for editorial display text.
const manrope = Manrope({
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
        className={`${manrope.variable} ${ibmPlexMono.variable} bg-background text-text min-h-screen antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
