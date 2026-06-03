export default function Header() {
  return (
    <header className="px-6 pt-8 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-orange-500 text-3xl">🍳</span>
        <h1 className="text-3xl font-bold text-orange-500">レシピ管理アプリ</h1>
      </div>
      <p className="text-gray-400 text-sm ml-10">お気に入りのレシピを見つけましょう</p>
    </header>
  );
}
