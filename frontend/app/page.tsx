"use client";

import { useState } from "react";
import Header from "./components/Header";
import GenreFilter from "./components/GenreFilter";
import RecipeCard from "./components/RecipeCard";
import { Genre, RECIPES } from "./data/recipes";

export default function Home() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | "すべて">("すべて");

  const filtered =
    selectedGenre === "すべて"
      ? RECIPES
      : RECIPES.filter((r) => r.genre === selectedGenre);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #ede8e0 100%)" }}
    >
      <div className="max-w-5xl mx-auto px-4">
        <Header />

        <div className="px-2 mb-6">
          <GenreFilter selected={selectedGenre} onChange={setSelectedGenre} />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            該当するレシピが見つかりませんでした
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
