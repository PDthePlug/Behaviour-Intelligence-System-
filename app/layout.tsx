import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIS Outcomes Cloud | Applied Commerce®",
  description: "A private, governed Behaviour Intelligence Series experience for Habit Lab, Decision Lab and the 32-Lab BIS product architecture.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
