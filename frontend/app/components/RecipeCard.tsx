"use client";

import Image from "next/image";
import { type RecipeSummary } from "../../lib/api";
import { GENRE_LABEL } from "../data/recipes";

type Props = {
  recipe: RecipeSummary;
};

export default function RecipeCard({ recipe }: Props) {
  const genreLabel = GENRE_LABEL[recipe.genre];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative h-52 w-full bg-gray-100">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 text-sm">
            画像なし
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 font-medium">
            {genreLabel}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{recipe.title}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-500">
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
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {recipe.tags.map((tag) => (
              <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
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
      <path
        strokeWidth="2"
        strokeLinecap="round"
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      />
      <circle cx="9" cy="7" r="4" strokeWidth="2" />
    </svg>
  );
}
