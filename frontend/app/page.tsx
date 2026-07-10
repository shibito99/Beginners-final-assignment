"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "./components/Header";
import GenreFilter from "./components/GenreFilter";
import RecipeCard from "./components/RecipeCard";
import { type Genre, GENRES, GENRE_VALUE } from "./data/recipes";
import { fetchRecipes, type Recipe } from "../lib/api";

const COOKING_TIME_OPTIONS = [
  { label: "すべて",    value: "" },
  { label: "15分以内",  value: "15" },
  { label: "30分以内",  value: "30" },
  { label: "60分以内",  value: "60" },
  { label: "60分超",   value: "60+" },
];

export default function Home() {
  const [selectedGenre,       setSelectedGenre]       = useState<Genre>("すべて");
  const [keyword,             setKeyword]             = useState("");
  const [searchInput,         setSearchInput]         = useState("");
  const [selectedCookingTime, setSelectedCookingTime] = useState("");
  const [recipes,  setRecipes]  = useState<Recipe[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {};
    if (selectedGenre !== "すべて") params.genre = GENRE_VALUE[selectedGenre];
    if (keyword)             params.q            = keyword;
    if (selectedCookingTime) params.cooking_time = selectedCookingTime;

    fetchRecipes(params)
      .then(setRecipes)
      .catch(() => setError("レシピの取得に失敗しました。"))
      .finally(() => setLoading(false));
  }, [selectedGenre, keyword, selectedCookingTime]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    setKeyword(searchInput.trim());
  }

  function handleClearSearch() {
    setSearchInput("");
    setKeyword("");
  }

  const hasFilter = keyword !== "" || selectedCookingTime !== "" || selectedGenre !== "すべて";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #ede8e0 100%)" }}>
      <div className="max-w-5xl mx-auto px-4">
        <Header />

        {/* ジャンルフィルター + 新規登録 */}
        <div className="px-2 mb-3 flex items-start justify-between gap-4">
          <GenreFilter genres={["すべて", ...GENRES]} selected={selectedGenre} onChange={setSelectedGenre} />
          <Link
            href="/recipes/new"
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            ＋ 新規登録
          </Link>
        </div>

        {/* 検索バー + 調理時間フィルター */}
        <div className="px-2 mb-6 space-y-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="タイトル・食材・タグで検索..."
                className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300 transition"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-lg leading-none"
                  aria-label="クリア"
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-full text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
            >
              検索
            </button>
          </form>

          {/* 調理時間フィルター */}
          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-gray-400 self-center mr-1">調理時間:</span>
            {COOKING_TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedCookingTime(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCookingTime === opt.value
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-500 hover:bg-orange-50 hover:text-orange-500"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 検索中のフィルター表示 */}
        {hasFilter && !loading && (
          <div className="px-2 mb-3 flex items-center gap-2 text-sm text-gray-500">
            <span>{recipes.length}件</span>
            {keyword && (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs">
                「{keyword}」
              </span>
            )}
            <button
              onClick={() => {
                setSelectedGenre("すべて");
                setSearchInput("");
                setKeyword("");
                setSelectedCookingTime("");
              }}
              className="ml-auto text-xs text-gray-400 hover:text-orange-500 underline transition-colors"
            >
              フィルターをリセット
            </button>
          </div>
        )}

        {loading && <div className="text-center py-20 text-gray-400">読み込み中...</div>}
        {error   && <div className="text-center py-20 text-red-400">{error}</div>}
        {!loading && !error && recipes.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>該当するレシピが見つかりませんでした</p>
            {hasFilter && (
              <button
                onClick={() => {
                  setSelectedGenre("すべて");
                  setSearchInput("");
                  setKeyword("");
                  setSelectedCookingTime("");
                }}
                className="mt-3 text-sm text-orange-500 hover:underline"
              >
                フィルターをリセット
              </button>
            )}
          </div>
        )}
        {!loading && !error && recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
            {recipes.map((recipe) => (
              <Link key={recipe.recipeId} href={`/recipes?id=${recipe.recipeId}`}>
                <RecipeCard recipe={recipe} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
