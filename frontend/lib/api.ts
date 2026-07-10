const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type ApiGenre = "japanese" | "western" | "chinese" | "ethnic" | "other";

export type Ingredient = { name: string; amount?: string; unit?: string };
export type Step       = { body: string };

export type Nutrition = {
  calories?: number;
  protein?:  number;
  fat?:      number;
  carbs?:    number;
  fiber?:    number;
  salt?:     number;
};

export type Recipe = {
  recipeId:    string;
  title:       string;
  description?: string;
  genre:       ApiGenre;
  tags:        string[];
  cookingTime?: number;
  servings:    number;
  ingredients: Ingredient[];
  steps:       Step[];
  imageKey?:   string;
  nutrition?:  Nutrition;
  createdAt:   string;
  updatedAt:   string;
};

export type RecipeSummary = Recipe;
export type RecipeDetail  = Recipe;

export type RecipeInput = {
  title:       string;
  description?: string;
  genre:       ApiGenre;
  tags?:       string[];
  cookingTime?: number;
  servings:    number;
  ingredients: Ingredient[];
  steps:       Step[];
  imageKey?:   string;
  nutrition?:  Nutrition;
};

export async function fetchRecipes(params: {
  q?: string;
  genre?: ApiGenre;
  tag?: string;
  cooking_time?: string;
} = {}): Promise<Recipe[]> {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") query.set(k, String(v));
  }
  const res = await fetch(`${API_BASE}/api/v1/recipes?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch recipes: ${res.status}`);
  return res.json();
}

export async function fetchRecipe(id: string): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/api/v1/recipes/${id}`);
  if (!res.ok) throw new Error(`Recipe not found: ${res.status}`);
  return res.json();
}

export async function createRecipe(body: RecipeInput): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/api/v1/recipes`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create recipe");
  return res.json();
}

export async function updateRecipe(id: string, body: Partial<RecipeInput>): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/api/v1/recipes/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update recipe");
  return res.json();
}

export async function deleteRecipe(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/recipes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete recipe: ${res.status}`);
}

export function imageUrl(imageKey?: string): string | null {
  if (!imageKey) return null;
  const cdn = process.env.NEXT_PUBLIC_CDN_URL ?? "";
  return cdn ? `${cdn}/${imageKey}` : null;
}
