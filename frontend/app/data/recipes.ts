import type { ApiGenre } from "../../lib/api";

export type Genre = "すべて" | "和食" | "洋食" | "中華" | "エスニック" | "その他";

export const GENRES: Exclude<Genre, "すべて">[] = ["和食", "洋食", "中華", "エスニック", "その他"];

export const GENRE_LABEL: Record<ApiGenre, Exclude<Genre, "すべて">> = {
  japanese: "和食",
  western:  "洋食",
  chinese:  "中華",
  ethnic:   "エスニック",
  other:    "その他",
};

export const GENRE_VALUE: Record<Exclude<Genre, "すべて">, ApiGenre> = {
  和食:       "japanese",
  洋食:       "western",
  中華:       "chinese",
  エスニック: "ethnic",
  その他:     "other",
};
