"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchRecipe, deleteRecipe, type RecipeDetail } from "../../../lib/api";
import { GENRE_LABEL } from "../../data/recipes";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRecipe(Number(id))
      .then(setRecipe)
      .catch(() => setError("レシピが見つかりませんでした。"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("このレシピを削除しますか？")) return;
    setDeleting(true);
    try {
      await deleteRecipe(Number(id));
      router.push("/");
    } catch {
      alert("削除に失敗しました。");
      setDeleting(false);
    }
  }

  if (loading) {
    return <PageShell><p className="text-center py-20 text-gray-400">読み込み中...</p></PageShell>;
  }

  if (error || !recipe) {
    return (
      <PageShell>
        <p className="text-center py-20 text-red-400">{error ?? "レシピが見つかりませんでした。"}</p>
        <div className="text-center">
          <Link href="/" className="text-orange-500 hover:underline text-sm">← 一覧に戻る</Link>
        </div>
      </PageShell>
    );
  }

  const genreLabel = GENRE_LABEL[recipe.genre];

  return (
    <PageShell>
      {/* ナビ */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          一覧に戻る
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="px-4 py-1.5 rounded-full text-sm font-medium text-orange-500 border border-orange-300 hover:bg-orange-50 transition-colors"
          >
            編集
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-1.5 rounded-full text-sm font-medium text-red-400 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deleting ? "削除中..." : "削除"}
          </button>
        </div>
      </div>

      {/* メイン画像 */}
      {recipe.image_url && (
        <div className="relative h-72 w-full rounded-2xl overflow-hidden mb-6">
          <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" sizes="100vw" />
        </div>
      )}

      {/* タイトル・基本情報 */}
      <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs px-3 py-1 rounded-full bg-orange-50 text-orange-500 font-medium">
            {genreLabel}
          </span>
          {recipe.tags.map((tag) => (
            <span key={tag.id} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500">
              {tag.name}
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">{recipe.title}</h1>
        <div className="flex flex-wrap gap-5 text-sm text-gray-500">
          {recipe.cook_time != null && (
            <span className="flex items-center gap-1">
              <ClockIcon />
              {recipe.cook_time}分
            </span>
          )}
          <span className="flex items-center gap-1">
            <PersonIcon />
            {recipe.servings}人前
          </span>
        </div>
        {recipe.description && (
          <p className="mt-4 text-gray-600 text-sm leading-relaxed">{recipe.description}</p>
        )}
      </div>

      {/* 材料 */}
      {recipe.ingredients.length > 0 && (
        <section className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">材料（{recipe.servings}人前）</h2>
          <ul className="divide-y divide-gray-50">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex justify-between py-2 text-sm">
                <span className="text-gray-700">{ing.name}</span>
                {(ing.amount != null || ing.unit) && (
                  <span className="text-gray-500">
                    {ing.amount != null ? ing.amount : ""}
                    {ing.unit ? ` ${ing.unit}` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 作り方 */}
      {recipe.instructions.length > 0 && (
        <section className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">作り方</h2>
          <ol className="space-y-5">
            {recipe.instructions.map((step) => (
              <li key={step.id} className="flex gap-4">
                <span className="w-7 h-7 flex-shrink-0 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-bold">
                  {step.step_number}
                </span>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm text-gray-700 leading-relaxed">{step.body}</p>
                  {step.image_url && (
                    <div className="relative h-40 mt-3 rounded-xl overflow-hidden">
                      <Image src={step.image_url} alt={`手順${step.step_number}`} fill className="object-cover" sizes="60vw" />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 栄養情報 */}
      {recipe.nutrition && (
        <section className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">栄養情報（1人前）</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "エネルギー", value: recipe.nutrition.calories, unit: "kcal" },
              { label: "たんぱく質", value: recipe.nutrition.protein, unit: "g" },
              { label: "脂質", value: recipe.nutrition.fat, unit: "g" },
              { label: "炭水化物", value: recipe.nutrition.carbs, unit: "g" },
              { label: "食物繊維", value: recipe.nutrition.fiber, unit: "g" },
              { label: "食塩相当量", value: recipe.nutrition.salt, unit: "g" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-base font-semibold text-gray-800">
                  {value != null ? `${value}${unit}` : "—"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #ede8e0 100%)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" strokeWidth="2" />
    </svg>
  );
}
