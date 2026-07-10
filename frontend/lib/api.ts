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

export async function requestPresignedUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; imageKey: string }> {
  const res = await fetch(`${API_BASE}/api/v1/upload`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ filename, contentType }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  return res.json();
}

export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method:  "PUT",
    headers: { "Content-Type": file.type },
    body:    file,
  });
  if (!res.ok) throw new Error("Failed to upload image");
}

// ---- 買い物リスト ----

export type ShoppingItem = {
  name:    string;
  checked: boolean;
};

export type ShoppingList = {
  listId:    string;
  name:      string;
  items:     ShoppingItem[];
  createdAt: string;
  updatedAt: string;
};

export async function fetchShoppingLists(): Promise<ShoppingList[]> {
  const res = await fetch(`${API_BASE}/api/v1/shopping-lists`);
  if (!res.ok) throw new Error("Failed to fetch shopping lists");
  return res.json();
}

export async function createShoppingList(name: string, items: ShoppingItem[]): Promise<ShoppingList> {
  const res = await fetch(`${API_BASE}/api/v1/shopping-lists`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name, items }),
  });
  if (!res.ok) throw new Error("Failed to create shopping list");
  return res.json();
}

export async function updateShoppingList(
  id: string,
  name: string,
  items: ShoppingItem[]
): Promise<ShoppingList> {
  const res = await fetch(`${API_BASE}/api/v1/shopping-lists/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name, items }),
  });
  if (!res.ok) throw new Error("Failed to update shopping list");
  return res.json();
}

export async function deleteShoppingList(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/shopping-lists/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete shopping list");
}
