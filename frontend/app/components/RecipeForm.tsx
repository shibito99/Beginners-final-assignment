"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type RecipeDetail,
  type ApiGenre,
  type Ingredient,
  type Step,
  createRecipe,
  updateRecipe,
} from "../../lib/api";
import { GENRE_VALUE, GENRES } from "../data/recipes";

type Props = { recipe?: RecipeDetail; redirectBase?: string };

export default function RecipeForm({ recipe, redirectBase = "/recipes" }: Props) {
  const router  = useRouter();
  const isEdit  = !!recipe;

  const [title,        setTitle]        = useState(recipe?.title ?? "");
  const [description,  setDescription]  = useState(recipe?.description ?? "");
  const [genre,        setGenre]        = useState<ApiGenre>(recipe?.genre ?? "japanese");
  const [servings,     setServings]     = useState(String(recipe?.servings ?? 2));
  const [cookingTime,  setCookingTime]  = useState(String(recipe?.cookingTime ?? ""));
  const [tagInput,     setTagInput]     = useState((recipe?.tags ?? []).join(", "));
  const [ingredients,  setIngredients]  = useState<Ingredient[]>(
    recipe?.ingredients.length ? recipe.ingredients : [{ name: "", amount: "", unit: "" }]
  );
  const [steps,        setSteps]        = useState<Step[]>(
    recipe?.steps.length ? recipe.steps : [{ body: "" }]
  );
  const [submitting,   setSubmitting]   = useState(false);
  const [baseError,    setBaseError]    = useState<string | null>(null);

  function updateIngredient(i: number, field: keyof Ingredient, value: string) {
    setIngredients((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }
  function addIngredient()        { setIngredients((r) => [...r, { name: "", amount: "", unit: "" }]); }
  function removeIngredient(i: number) { setIngredients((r) => r.filter((_, idx) => idx !== i)); }

  function updateStep(i: number, value: string) {
    setSteps((rows) => rows.map((r, idx) => idx === i ? { body: value } : r));
  }
  function addStep()        { setSteps((r) => [...r, { body: "" }]); }
  function removeStep(i: number) { setSteps((r) => r.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setBaseError(null);

    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    const body = {
      title,
      description: description || undefined,
      genre,
      tags,
      cookingTime: cookingTime ? Number(cookingTime) : undefined,
      servings:    Number(servings),
      ingredients: ingredients.filter((i) => i.name.trim()),
      steps:       steps.filter((s) => s.body.trim()),
    };

    try {
      const saved = isEdit
        ? await updateRecipe(recipe!.recipeId, body)
        : await createRecipe(body);
      router.push(`${redirectBase}?id=${saved.recipeId}`);
    } catch {
      setBaseError("送信に失敗しました。しばらくしてから再試行してください。");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {baseError && <p className="text-red-500 text-sm">{baseError}</p>}

      <Field label="タイトル" required>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          maxLength={100} className={inputCls(false)} placeholder="レシピ名を入力" />
      </Field>

      <Field label="説明">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          maxLength={500} rows={3} className={inputCls(false)} placeholder="説明（任意）" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="ジャンル" required>
          <select value={genre} onChange={(e) => setGenre(e.target.value as ApiGenre)} className={inputCls(false)}>
            {GENRES.map((g) => <option key={g} value={GENRE_VALUE[g]}>{g}</option>)}
          </select>
        </Field>
        <Field label="人数" required>
          <input type="number" min={1} max={99} value={servings}
            onChange={(e) => setServings(e.target.value)} className={inputCls(false)} />
        </Field>
        <Field label="調理時間（分）">
          <input type="number" min={1} max={999} value={cookingTime}
            onChange={(e) => setCookingTime(e.target.value)} className={inputCls(false)} placeholder="任意" />
        </Field>
      </div>

      <Field label="タグ（カンマ区切り）">
        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
          className={inputCls(false)} placeholder="例: 和食, 簡単, お弁当" />
      </Field>

      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">材料</h3>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)}
                placeholder="食材名" className={`${inputCls(false)} flex-1`} />
              <input type="text" value={ing.amount ?? ""} onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                placeholder="分量" className={`${inputCls(false)} w-24`} />
              <input type="text" value={ing.unit ?? ""} onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                placeholder="単位" className={`${inputCls(false)} w-20`} />
              <button type="button" onClick={() => removeIngredient(i)} disabled={ingredients.length === 1}
                className="text-gray-400 hover:text-red-400 disabled:opacity-30 text-lg leading-none" aria-label="削除">×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addIngredient} className="mt-2 text-sm text-orange-500 hover:text-orange-600">
          ＋ 材料を追加
        </button>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">作り方</h3>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="mt-2 w-6 h-6 flex-shrink-0 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <textarea value={step.body} onChange={(e) => updateStep(i, e.target.value)}
                rows={2} maxLength={300} placeholder={`手順 ${i + 1}`} className={`${inputCls(false)} flex-1`} />
              <button type="button" onClick={() => removeStep(i)} disabled={steps.length === 1}
                className="mt-2 text-gray-400 hover:text-red-400 disabled:opacity-30 text-lg leading-none" aria-label="削除">×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep} className="mt-2 text-sm text-orange-500 hover:text-orange-600">
          ＋ 手順を追加
        </button>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 rounded-full text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          キャンセル
        </button>
        <button type="submit" disabled={submitting}
          className="px-6 py-2 rounded-full text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors">
          {submitting ? "送信中..." : isEdit ? "更新する" : "登録する"}
        </button>
      </div>
    </form>
  );
}

function inputCls(hasError: boolean) {
  return [
    "w-full px-3 py-2 rounded-lg border text-sm text-gray-800 outline-none",
    "focus:ring-2 focus:ring-orange-300 transition",
    hasError ? "border-red-400 bg-red-50" : "border-gray-200 bg-white",
  ].join(" ");
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
