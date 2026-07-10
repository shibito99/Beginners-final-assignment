"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="px-6 pt-8 pb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 text-3xl">🍳</span>
          <h1 className="text-3xl font-bold text-orange-500">Let&apos;s Cook!</h1>
        </div>
        <nav className="flex gap-1">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              pathname === "/" || pathname.startsWith("/recipes")
                ? "bg-orange-500 text-white"
                : "text-gray-500 hover:bg-orange-50 hover:text-orange-500"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            レシピ
          </Link>
          <Link
            href="/shopping"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              pathname === "/shopping"
                ? "bg-orange-500 text-white"
                : "text-gray-500 hover:bg-orange-50 hover:text-orange-500"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            買い物リスト
          </Link>
        </nav>
      </div>
      <p className="text-gray-400 text-sm ml-10">お気に入りのレシピを見つけましょう</p>
    </header>
  );
}
