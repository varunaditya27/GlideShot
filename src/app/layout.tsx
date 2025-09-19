import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GlideShot – Precision Mini-Golf in Motion",
    template: "%s – GlideShot"
  },
  description: "GlideShot is a refined 3D mini-golf experience with precision physics, intuitive aim assist, minimalist glass UI, and smooth motion.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.ico" },
  applicationName: "GlideShot",
  themeColor: "#0d0f14",
  viewport: { width: "device-width", initialScale: 1, viewportFit: "cover" },
  openGraph: {
    title: "GlideShot – Precision Mini-Golf in Motion",
    description: "Refined 3D mini-golf with beautiful motion, glass UI, and leaderboard progression.",
    type: "website",
    siteName: "GlideShot"
  },
  twitter: {
    card: "summary_large_image",
    title: "GlideShot – Precision Mini-Golf",
    description: "Refined 3D mini-golf with beautiful motion, glass UI, and leaderboard progression."
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="color-scheme" content="dark light" />
        <meta name="application-name" content="GlideShot" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased bg-black text-white selection:bg-white/20 selection:text-white`}
        data-app-root
      >
        {children}
        <div id="portal-root" />
      </body>
    </html>
  );
}
