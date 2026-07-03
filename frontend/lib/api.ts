const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type ApiGenre = "japanese" | "western" | "chinese" | "ethnic" | "other";

export type RecipeSummary = {
  id: number;
  title: string;
  genre: ApiGenre;
  servings: number;
  cook_time: number | null;
  image_url: string | null;
  tags: { id: number; name: string }[];
  created_at: string;
};

export type RecipeDetail = RecipeSummary & {
  description: string | null;
  ingredients: { id: number; name: string; amount: number | null; unit: string | null; sort_order: number }[];
  instructions: { id: number; step_number: number; body: string; image_url: string | null }[];
  nutrition: {
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
    fiber: number | null;
    salt: number | null;
  } | null;
  updated_at: string;
};

export type RecipesResponse = {
  data: RecipeSummary[];
  meta: { total: number; page: number; per_page: number };
};

export type RecipeParams = {
  genre?: ApiGenre;
  q?: string;
  cook_time_max?: number;
  ingredient?: string;
  tag_ids?: string;
  sort?: string;
  page?: number;
  per_page?: number;
};

export async function fetchRecipes(params: RecipeParams = {}): Promise<RecipesResponse> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const res = await fetch(`${API_BASE}/api/v1/recipes?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch recipes: ${res.status}`);
  return res.json();
}

export async function fetchRecipe(id: number): Promise<RecipeDetail> {
  const res = await fetch(`${API_BASE}/api/v1/recipes/${id}`);
  if (!res.ok) throw new Error(`Recipe not found: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export type ValidationError = {
  code: "VALIDATION_ERROR";
  message: string;
  details: Record<string, string[]>;
};

export async function createRecipe(body: FormData): Promise<RecipeDetail> {
  const res = await fetch(`${API_BASE}/api/v1/recipes`, { method: "POST", body });
  if (!res.ok) {
    const json = await res.json();
    throw json.error as ValidationError;
  }
  const json = await res.json();
  return json.data;
}

export async function updateRecipe(id: number, body: FormData): Promise<RecipeDetail> {
  const res = await fetch(`${API_BASE}/api/v1/recipes/${id}`, { method: "PATCH", body });
  if (!res.ok) {
    const json = await res.json();
    throw json.error as ValidationError;
  }
  const json = await res.json();
  return json.data;
}

export async function deleteRecipe(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/recipes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete recipe: ${res.status}`);
}

export type Tag = { id: number; name: string };

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch(`${API_BASE}/api/v1/tags`);
  if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
  const json = await res.json();
  return json.data;
}
