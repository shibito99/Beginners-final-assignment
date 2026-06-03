"use client";

import { Genre, GENRES } from "../data/recipes";

type Props = {
  selected: Genre | "すべて";
  onChange: (genre: Genre | "すべて") => void;
};

export default function GenreFilter({ selected, onChange }: Props) {
  const tabs: (Genre | "すべて")[] = ["すべて", ...GENRES];

  return (
    <nav className="flex gap-1 flex-wrap">
      {tabs.map((genre) => {
        const isActive = selected === genre;
        return (
          <button
            key={genre}
            onClick={() => onChange(genre)}
            className={`
              px-5 py-2 rounded-full text-sm font-medium transition-colors
              ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-500"
              }
            `}
          >
            {genre}
          </button>
        );
      })}
    </nav>
  );
}
