"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  type RecipeDetail,
  type ApiGenre,
  type Ingredient,
  type Step,
  createRecipe,
  updateRecipe,
  requestPresignedUrl,
  uploadToS3,
  imageUrl,
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
  const [imageKey,     setImageKey]     = useState<string | undefined>(recipe?.imageKey);
  const [imagePreview, setImagePreview] = useState<string | null>(imageUrl(recipe?.imageKey));
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [baseError,    setBaseError]    = useState<string | null>(null);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      setUploadError(`画像は${maxMB}MB以下にしてください`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setImagePreview(URL.createObjectURL(file));

    try {
      const { uploadUrl, imageKey: key } = await requestPresignedUrl(file.name, file.type);
      await uploadToS3(uploadUrl, file);
      setImageKey(key);
    } catch {
      setUploadError("画像のアップロードに失敗しました");
      setImagePreview(imageUrl(imageKey) ?? null);
    } finally {
      setUploading(false);
    }
  }

  function handleImageRemove() {
    setImageKey(undefined);
    setImagePreview(null);
    setUploadError(null);
  }

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
      imageKey:    imageKey || undefined,
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

      {/* 画像アップロード */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">料理写真</p>
        {imagePreview ? (
          <div className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-100 mb-2">
            <Image src={imagePreview} alt="プレビュー" fill className="object-cover" sizes="100vw" unoptimized />
            <button
              type="button"
              onClick={handleImageRemove}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/70 transition-colors"
              aria-label="画像を削除"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-gray-50 hover:bg-orange-50 hover:border-orange-300 transition-colors">
            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm text-gray-400">クリックして画像を選択</span>
            <span className="text-xs text-gray-300 mt-1">JPEG / PNG / WebP・5MB以内</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} disabled={uploading} />
          </label>
        )}
        {uploading && <p className="text-xs text-orange-500 mt-1">アップロード中...</p>}
        {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
      </div>

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
