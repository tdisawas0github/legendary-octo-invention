import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gateway — Local AI Aggregator",
  description: "OpenAI-compatible gateway for routing to local LLM backends",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
