"use client";

import Link from "next/link";
import RecipeForm from "../../components/RecipeForm";

export default function NewRecipePage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #ede8e0 100%)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-6">レシピを登録</h1>
          <RecipeForm />
        </div>
      </div>
    </div>
  );
}
