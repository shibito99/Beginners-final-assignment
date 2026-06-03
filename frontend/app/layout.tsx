import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "レシピ管理アプリ",
  description: "お気に入りのレシピを見つけましょう",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
