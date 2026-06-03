export type Genre = "和食" | "洋食" | "中華" | "エスニック" | "その他";

export type Recipe = {
  id: number;
  title: string;
  genre: Genre;
  cookTime: number;
  servings: number;
  imageUrl: string;
};

export const GENRES: Genre[] = ["和食", "洋食", "中華", "エスニック", "その他"];

export const RECIPES: Recipe[] = [
  {
    id: 1,
    title: "肉じゃが",
    genre: "和食",
    cookTime: 30,
    servings: 4,
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80",
  },
  {
    id: 2,
    title: "親子丼",
    genre: "和食",
    cookTime: 20,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80",
  },
  {
    id: 3,
    title: "味噌汁",
    genre: "和食",
    cookTime: 10,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1607301405752-761f28ac2f0e?w=600&q=80",
  },
  {
    id: 4,
    title: "カルボナーラ",
    genre: "洋食",
    cookTime: 20,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80",
  },
  {
    id: 5,
    title: "ビーフシチュー",
    genre: "洋食",
    cookTime: 90,
    servings: 4,
    imageUrl: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600&q=80",
  },
  {
    id: 6,
    title: "ハンバーグ",
    genre: "洋食",
    cookTime: 40,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  },
  {
    id: 7,
    title: "麻婆豆腐",
    genre: "中華",
    cookTime: 25,
    servings: 3,
    imageUrl: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=600&q=80",
  },
  {
    id: 8,
    title: "チャーハン",
    genre: "中華",
    cookTime: 15,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80",
  },
  {
    id: 9,
    title: "グリーンカレー",
    genre: "エスニック",
    cookTime: 35,
    servings: 3,
    imageUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80",
  },
  {
    id: 10,
    title: "ガパオライス",
    genre: "エスニック",
    cookTime: 20,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1562802378-063ec186a863?w=600&q=80",
  },
];
