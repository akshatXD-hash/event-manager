import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Post a requirement | GoPratle",
  description:
    "Tell us about your event and the planners, performers, or crew you need.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
