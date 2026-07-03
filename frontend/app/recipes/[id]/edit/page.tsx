"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchRecipe, type RecipeDetail } from "../../../../lib/api";
import RecipeForm from "../../../components/RecipeForm";

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipe(Number(id))
      .then(setRecipe)
      .catch(() => setError("レシピが見つかりませんでした。"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #ede8e0 100%)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/recipes/${id}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            詳細に戻る
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-6">レシピを編集</h1>

          {loading && <p className="text-center py-10 text-gray-400">読み込み中...</p>}

          {error && <p className="text-center py-10 text-red-400">{error}</p>}

          {!loading && !error && recipe && <RecipeForm recipe={recipe} />}
        </div>
      </div>
    </div>
  );
}
