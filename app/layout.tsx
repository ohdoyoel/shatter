import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shatter",
  description: "Break any webpage into pieces with physics simulation",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
