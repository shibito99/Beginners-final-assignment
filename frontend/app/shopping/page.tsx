"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  fetchShoppingLists,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  type ShoppingList,
  type ShoppingItem,
} from "../../lib/api";

export default function ShoppingPage() {
  return (
    <Suspense fallback={<PageShell><p className="text-center py-20 text-gray-400">読み込み中...</p></PageShell>}>
      <ShoppingPageInner />
    </Suspense>
  );
}

function ShoppingPageInner() {
  const [lists,   setLists]   = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState("");
  const newNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchShoppingLists()
      .then(setLists)
      .catch(() => setError("買い物リストの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim() || "買い物リスト";
    setCreating(true);
    try {
      const created = await createShoppingList(name, []);
      setLists((prev) => [created, ...prev]);
      setNewName("");
    } catch {
      setError("リストの作成に失敗しました");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このリストを削除しますか？")) return;
    try {
      await deleteShoppingList(id);
      setLists((prev) => prev.filter((l) => l.listId !== id));
    } catch {
      setError("削除に失敗しました");
    }
  }

  async function handleToggleItem(list: ShoppingList, itemIndex: number) {
    const updatedItems = list.items.map((item, i) =>
      i === itemIndex ? { ...item, checked: !item.checked } : item
    );
    try {
      const updated = await updateShoppingList(list.listId, list.name, updatedItems);
      setLists((prev) => prev.map((l) => l.listId === list.listId ? updated : l));
    } catch {
      setError("更新に失敗しました");
    }
  }

  async function handleAddItem(list: ShoppingList, itemName: string) {
    if (!itemName.trim()) return;
    const updatedItems = [...list.items, { name: itemName.trim(), checked: false }];
    try {
      const updated = await updateShoppingList(list.listId, list.name, updatedItems);
      setLists((prev) => prev.map((l) => l.listId === list.listId ? updated : l));
    } catch {
      setError("追加に失敗しました");
    }
  }

  async function handleRemoveItem(list: ShoppingList, itemIndex: number) {
    const updatedItems = list.items.filter((_, i) => i !== itemIndex);
    try {
      const updated = await updateShoppingList(list.listId, list.name, updatedItems);
      setLists((prev) => prev.map((l) => l.listId === list.listId ? updated : l));
    } catch {
      setError("削除に失敗しました");
    }
  }

  return (
    <PageShell>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          レシピ一覧へ
        </Link>
        <h1 className="text-xl font-bold text-gray-800">🛒 買い物リスト</h1>
        <div className="w-20" />
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
      )}

      {/* 新規リスト作成 */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          ref={newNameRef}
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しいリスト名（例：今週の買い物）"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {creating ? "作成中..." : "＋ 作成"}
        </button>
      </form>

      {/* リスト一覧 */}
      {loading && <p className="text-center py-20 text-gray-400">読み込み中...</p>}
      {!loading && lists.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p>買い物リストがありません</p>
          <p className="text-sm mt-1">上のフォームから作成してください</p>
        </div>
      )}
      <div className="space-y-4">
        {lists.map((list) => (
          <ShoppingListCard
            key={list.listId}
            list={list}
            onToggleItem={(i) => handleToggleItem(list, i)}
            onAddItem={(name) => handleAddItem(list, name)}
            onRemoveItem={(i) => handleRemoveItem(list, i)}
            onDelete={() => handleDelete(list.listId)}
          />
        ))}
      </div>
    </PageShell>
  );
}

/* ---------- リストカード ---------- */
function ShoppingListCard({
  list,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onDelete,
}: {
  list: ShoppingList;
  onToggleItem: (i: number) => void;
  onAddItem: (name: string) => void;
  onRemoveItem: (i: number) => void;
  onDelete: () => void;
}) {
  const [newItem, setNewItem] = useState("");
  const checkedCount = list.items.filter((i) => i.checked).length;
  const total        = list.items.length;

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    onAddItem(newItem);
    setNewItem("");
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {/* リストヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-gray-800">{list.name}</h2>
          {total > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{checkedCount}/{total} 完了</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition-colors text-sm"
          aria-label="リストを削除"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* 進捗バー */}
      {total > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
          <div
            className="bg-orange-400 h-1.5 rounded-full transition-all"
            style={{ width: `${(checkedCount / total) * 100}%` }}
          />
        </div>
      )}

      {/* アイテム一覧 */}
      {list.items.length > 0 && (
        <ul className="divide-y divide-gray-50 mb-3">
          {list.items.map((item, i) => (
            <li key={i} className="flex items-center gap-3 py-2">
              <button
                onClick={() => onToggleItem(i)}
                className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                  item.checked
                    ? "bg-orange-500 border-orange-500"
                    : "border-gray-300 hover:border-orange-300"
                }`}
                aria-label={item.checked ? "未完了に戻す" : "完了にする"}
              >
                {item.checked && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${item.checked ? "line-through text-gray-300" : "text-gray-700"}`}>
                {item.name}
              </span>
              <button
                onClick={() => onRemoveItem(i)}
                className="text-gray-200 hover:text-red-400 transition-colors text-lg leading-none"
                aria-label="削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* アイテム追加フォーム */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="食材を追加..."
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg text-sm text-orange-500 border border-orange-200 hover:bg-orange-50 transition-colors"
        >
          追加
        </button>
      </form>
    </div>
  );
}

/* ---------- 共通 ---------- */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #ede8e0 100%)" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
