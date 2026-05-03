import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anı Defteri — Stellar NFT",
  description: "Blockchain tabanlı dijital anı defteri",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
