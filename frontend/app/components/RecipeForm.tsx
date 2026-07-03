"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  type RecipeDetail,
  type ApiGenre,
  type Tag,
  type ValidationError,
  createRecipe,
  updateRecipe,
  fetchTags,
} from "../../lib/api";
import { GENRE_VALUE, GENRES } from "../data/recipes";

type IngredientRow = { name: string; amount: string; unit: string };
type InstructionRow = { body: string };

type Props = {
  recipe?: RecipeDetail;
};

export default function RecipeForm({ recipe }: Props) {
  const router = useRouter();
  const isEdit = !!recipe;

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [genre, setGenre] = useState<ApiGenre>(recipe?.genre ?? "japanese");
  const [servings, setServings] = useState(String(recipe?.servings ?? 2));
  const [cookTime, setCookTime] = useState(String(recipe?.cook_time ?? ""));
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    recipe?.ingredients.length
      ? recipe.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount != null ? String(i.amount) : "",
          unit: i.unit ?? "",
        }))
      : [{ name: "", amount: "", unit: "" }]
  );
  const [instructions, setInstructions] = useState<InstructionRow[]>(
    recipe?.instructions.length
      ? recipe.instructions.map((s) => ({ body: s.body }))
      : [{ body: "" }]
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    recipe?.tags.map((t) => t.id) ?? []
  );
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchTags().then(setAllTags).catch(() => {});
  }, []);

  function updateIngredient(index: number, field: keyof IngredientRow, value: string) {
    setIngredients((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function addIngredient() {
    setIngredients((rows) => [...rows, { name: "", amount: "", unit: "" }]);
  }

  function removeIngredient(index: number) {
    setIngredients((rows) => rows.filter((_, i) => i !== index));
  }

  function updateInstruction(index: number, value: string) {
    setInstructions((rows) =>
      rows.map((r, i) => (i === index ? { body: value } : r))
    );
  }

  function addInstruction() {
    setInstructions((rows) => [...rows, { body: "" }]);
  }

  function removeInstruction(index: number) {
    setInstructions((rows) => rows.filter((_, i) => i !== index));
  }

  function toggleTag(id: number) {
    setSelectedTagIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const fd = new FormData();
    fd.append("recipe[title]", title);
    fd.append("recipe[description]", description);
    fd.append("recipe[genre]", genre);
    fd.append("recipe[servings]", servings);
    if (cookTime) fd.append("recipe[cook_time]", cookTime);

    selectedTagIds.forEach((id) => fd.append("recipe[tag_ids][]", String(id)));

    ingredients.forEach((ing, i) => {
      if (!ing.name.trim()) return;
      fd.append(`recipe[ingredients_attributes][${i}][name]`, ing.name);
      fd.append(`recipe[ingredients_attributes][${i}][sort_order]`, String(i + 1));
      if (ing.amount) fd.append(`recipe[ingredients_attributes][${i}][amount]`, ing.amount);
      if (ing.unit) fd.append(`recipe[ingredients_attributes][${i}][unit]`, ing.unit);
    });

    instructions.forEach((step, i) => {
      if (!step.body.trim()) return;
      fd.append(`recipe[instructions_attributes][${i}][step_number]`, String(i + 1));
      fd.append(`recipe[instructions_attributes][${i}][body]`, step.body);
    });

    try {
      const saved = isEdit
        ? await updateRecipe(recipe!.id, fd)
        : await createRecipe(fd);
      router.push(`/recipes/${saved.id}`);
    } catch (err) {
      const ve = err as ValidationError;
      if (ve?.details) {
        setErrors(ve.details);
      } else {
        setErrors({ base: ["送信に失敗しました。しばらくしてから再試行してください。"] });
      }
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      {errors.base && (
        <p className="text-red-500 text-sm">{errors.base[0]}</p>
      )}

      {/* タイトル */}
      <Field label="タイトル" required error={errors.title?.[0]}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className={inputCls(!!errors.title)}
          placeholder="レシピ名を入力"
        />
      </Field>

      {/* 説明 */}
      <Field label="説明" error={errors.description?.[0]}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className={inputCls(!!errors.description)}
          placeholder="レシピの説明を入力（任意）"
        />
      </Field>

      {/* ジャンル・人数・調理時間 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="ジャンル" required error={errors.genre?.[0]}>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as ApiGenre)}
            className={inputCls(!!errors.genre)}
          >
            {GENRES.map((g) => (
              <option key={g} value={GENRE_VALUE[g]}>
                {g}
              </option>
            ))}
          </select>
        </Field>

        <Field label="人数" required error={errors.servings?.[0]}>
          <input
            type="number"
            min={1}
            max={99}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className={inputCls(!!errors.servings)}
          />
        </Field>

        <Field label="調理時間（分）" error={errors.cook_time?.[0]}>
          <input
            type="number"
            min={1}
            max={999}
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            className={inputCls(!!errors.cook_time)}
            placeholder="任意"
          />
        </Field>
      </div>

      {/* タグ */}
      {allTags.length > 0 && (
        <Field label="タグ">
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = selectedTagIds.includes(tag.id);
              return (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    active
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-500"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {/* 材料 */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">材料</h3>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)}
                placeholder="食材名"
                className={`${inputCls(false)} flex-1`}
              />
              <input
                type="number"
                value={ing.amount}
                onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                placeholder="分量"
                className={`${inputCls(false)} w-24`}
                min={0}
                step="any"
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                placeholder="単位"
                className={`${inputCls(false)} w-20`}
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                disabled={ingredients.length === 1}
                className="text-gray-400 hover:text-red-400 disabled:opacity-30 text-lg leading-none"
                aria-label="削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 text-sm text-orange-500 hover:text-orange-600"
        >
          ＋ 材料を追加
        </button>
      </div>

      {/* 作り方 */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">作り方</h3>
        <div className="space-y-3">
          {instructions.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="mt-2 w-6 h-6 flex-shrink-0 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <textarea
                value={step.body}
                onChange={(e) => updateInstruction(i, e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={`手順 ${i + 1}`}
                className={`${inputCls(false)} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeInstruction(i)}
                disabled={instructions.length === 1}
                className="mt-2 text-gray-400 hover:text-red-400 disabled:opacity-30 text-lg leading-none"
                aria-label="削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addInstruction}
          className="mt-2 text-sm text-orange-500 hover:text-orange-600"
        >
          ＋ 手順を追加
        </button>
      </div>

      {/* ボタン */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-full text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 rounded-full text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
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

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
