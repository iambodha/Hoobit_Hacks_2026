import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const mojangles = localFont({
  src: "../public/mojangles.otf",
  variable: "--font-mojangles",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hoobit Hacks 2026",
  description: "Terminal-inspired launch site baseline for Hoobit Hacks 2026.",
  icons: {
    icon: "/hoobit-hacks-logo.png",
    shortcut: "/hoobit-hacks-logo.png",
    apple: "/hoobit-hacks-logo.png",
  },
  openGraph: {
    images: "/hoobit-hacks-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mojangles.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black flex flex-col">{children}</body>
    </html>
  );
}