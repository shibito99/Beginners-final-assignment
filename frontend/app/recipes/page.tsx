"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchRecipe, deleteRecipe, imageUrl, type RecipeDetail } from "../../lib/api";
import { GENRE_LABEL } from "../data/recipes";
import RecipeForm from "../components/RecipeForm";

export default function RecipePage() {
  return (
    <Suspense fallback={<PageShell><p className="text-center py-20 text-gray-400">読み込み中...</p></PageShell>}>
      <RecipePageInner />
    </Suspense>
  );
}

function RecipePageInner() {
  const params = useSearchParams();
  const id     = params.get("id");
  const isEdit = params.get("edit") === "1";

  if (!id) {
    return (
      <PageShell>
        <p className="text-center py-20 text-red-400">レシピIDが指定されていません。</p>
        <div className="text-center"><Link href="/" className="text-orange-500 hover:underline text-sm">← 一覧に戻る</Link></div>
      </PageShell>
    );
  }

  return isEdit
    ? <EditView id={id} />
    : <DetailView id={id} />;
}

/* ---------- 詳細ビュー ---------- */
function DetailView({ id }: { id: string }) {
  const router = useRouter();
  const [recipe,   setRecipe]   = useState<RecipeDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRecipe(id)
      .then(setRecipe)
      .catch(() => setError("レシピが見つかりませんでした。"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("このレシピを削除しますか？")) return;
    setDeleting(true);
    try {
      await deleteRecipe(id);
      router.push("/");
    } catch {
      alert("削除に失敗しました。");
      setDeleting(false);
    }
  }

  if (loading) return <PageShell><p className="text-center py-20 text-gray-400">読み込み中...</p></PageShell>;
  if (error || !recipe) {
    return (
      <PageShell>
        <p className="text-center py-20 text-red-400">{error ?? "レシピが見つかりませんでした。"}</p>
        <div className="text-center"><Link href="/" className="text-orange-500 hover:underline text-sm">← 一覧に戻る</Link></div>
      </PageShell>
    );
  }

  const img = imageUrl(recipe.imageKey);

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          一覧に戻る
        </Link>
        <div className="flex gap-2">
          <Link href={`/recipes?id=${id}&edit=1`}
            className="px-4 py-1.5 rounded-full text-sm font-medium text-orange-500 border border-orange-300 hover:bg-orange-50 transition-colors">
            編集
          </Link>
          <button onClick={handleDelete} disabled={deleting}
            className="px-4 py-1.5 rounded-full text-sm font-medium text-red-400 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors">
            {deleting ? "削除中..." : "削除"}
          </button>
        </div>
      </div>

      {img && (
        <div className="relative h-72 w-full rounded-2xl overflow-hidden mb-6">
          <Image src={img} alt={recipe.title} fill className="object-cover" sizes="100vw" />
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs px-3 py-1 rounded-full bg-orange-50 text-orange-500 font-medium">
            {GENRE_LABEL[recipe.genre]}
          </span>
          {recipe.tags.map((tag) => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500">{tag}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">{recipe.title}</h1>
        <div className="flex flex-wrap gap-5 text-sm text-gray-500">
          {recipe.cookingTime != null && (
            <span className="flex items-center gap-1"><ClockIcon />{recipe.cookingTime}分</span>
          )}
          <span className="flex items-center gap-1"><PersonIcon />{recipe.servings}人前</span>
        </div>
        {recipe.description && (
          <p className="mt-4 text-gray-600 text-sm leading-relaxed">{recipe.description}</p>
        )}
      </div>

      {recipe.ingredients.length > 0 && (
        <section className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">材料（{recipe.servings}人前）</h2>
          <ul className="divide-y divide-gray-50">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex justify-between py-2 text-sm">
                <span className="text-gray-700">{ing.name}</span>
                {(ing.amount || ing.unit) && (
                  <span className="text-gray-500">{ing.amount ?? ""}{ing.unit ? ` ${ing.unit}` : ""}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.steps.length > 0 && (
        <section className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">作り方</h2>
          <ol className="space-y-5">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="w-7 h-7 flex-shrink-0 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <p className="flex-1 pt-0.5 text-sm text-gray-700 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {recipe.nutrition && (
        <section className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">栄養情報（1人前）</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {([
              { label: "エネルギー", value: recipe.nutrition.calories, unit: "kcal" },
              { label: "たんぱく質", value: recipe.nutrition.protein,  unit: "g" },
              { label: "脂質",       value: recipe.nutrition.fat,      unit: "g" },
              { label: "炭水化物",   value: recipe.nutrition.carbs,    unit: "g" },
              { label: "食物繊維",   value: recipe.nutrition.fiber,    unit: "g" },
              { label: "食塩相当量", value: recipe.nutrition.salt,     unit: "g" },
            ] as const).map(({ label, value, unit }) => (
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

/* ---------- 編集ビュー ---------- */
function EditView({ id }: { id: string }) {
  const [recipe,  setRecipe]  = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetchRecipe(id)
      .then(setRecipe)
      .catch(() => setError("レシピが見つかりませんでした。"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <PageShell>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/recipes?id=${id}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          詳細に戻る
        </Link>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-6">レシピを編集</h1>
        {loading && <p className="text-center py-10 text-gray-400">読み込み中...</p>}
        {error   && <p className="text-center py-10 text-red-400">{error}</p>}
        {!loading && !error && recipe && <RecipeForm recipe={recipe} redirectBase="/recipes" />}
      </div>
    </PageShell>
  );
}

/* ---------- 共通 ---------- */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #ede8e0 100%)" }}>
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
