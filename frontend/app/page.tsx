"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "./components/Header";
import GenreFilter from "./components/GenreFilter";
import RecipeCard from "./components/RecipeCard";
import { type Genre, GENRES, GENRE_VALUE } from "./data/recipes";
import { fetchRecipes, type RecipeSummary } from "../lib/api";

export default function Home() {
  const [selectedGenre, setSelectedGenre] = useState<Genre>("すべて");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = selectedGenre !== "すべて"
      ? { genre: GENRE_VALUE[selectedGenre] }
      : {};

    fetchRecipes(params)
      .then((res) => setRecipes(res.data))
      .catch(() => setError("レシピの取得に失敗しました。バックエンドサーバーが起動しているか確認してください。"))
      .finally(() => setLoading(false));
  }, [selectedGenre]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #ede8e0 100%)" }}
    >
      <div className="max-w-5xl mx-auto px-4">
        <Header />

        <div className="px-2 mb-6 flex items-start justify-between gap-4">
          <GenreFilter
            genres={["すべて", ...GENRES]}
            selected={selectedGenre}
            onChange={setSelectedGenre}
          />
          <Link
            href="/recipes/new"
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            ＋ 新規登録
          </Link>
        </div>

        {loading && (
          <div className="text-center py-20 text-gray-400">読み込み中...</div>
        )}

        {error && (
          <div className="text-center py-20 text-red-400">{error}</div>
        )}

        {!loading && !error && recipes.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            該当するレシピが見つかりませんでした
          </div>
        )}

        {!loading && !error && recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                <RecipeCard recipe={recipe} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
