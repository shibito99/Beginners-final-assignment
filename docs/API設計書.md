# API 設計書

## 1. 基本仕様

| 項目 | 値 |
|------|-----|
| ベースURL | `https://<CloudFrontドメイン>/api/v1` |
| データ形式 | JSON（Content-Type: application/json） |
| 文字コード | UTF-8 |
| 認証 | なし（初期フェーズ / 個人利用） |
| バージョニング | URLパスで管理（/api/v1/...） |

---

## 2. 共通レスポンス形式

### 成功レスポンス

```json
{
  "data": { ... }      // 単一リソース
}

{
  "data": [ ... ],     // 複数リソース
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 12
  }
}
```

### エラーレスポンス

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "バリデーションエラーが発生しました",
    "details": {
      "title": ["タイトルは必須です"],
      "servings": ["人数は1以上99以下で入力してください"]
    }
  }
}
```

### HTTPステータスコード

| コード | 意味 |
|-------|------|
| 200 | OK（取得・更新成功） |
| 201 | Created（作成成功） |
| 204 | No Content（削除成功） |
| 400 | Bad Request（バリデーションエラー） |
| 404 | Not Found（リソース未存在） |
| 422 | Unprocessable Entity（処理失敗） |
| 500 | Internal Server Error |

---

## 3. エンドポイント一覧

### レシピ（Recipes）

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /recipes | レシピ一覧取得 |
| GET | /recipes/:id | レシピ詳細取得 |
| POST | /recipes | レシピ新規登録 |
| PATCH | /recipes/:id | レシピ更新 |
| DELETE | /recipes/:id | レシピ削除 |

### タグ（Tags）

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /tags | タグ一覧取得 |

### 買い物リスト（ShoppingLists）

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /shopping_lists | 買い物リスト一覧取得 |
| POST | /shopping_lists | 買い物リスト新規作成 |
| DELETE | /shopping_lists/:id | 買い物リスト削除 |
| GET | /shopping_lists/:id/items | アイテム一覧取得 |
| POST | /shopping_lists/:id/items | アイテム追加 |
| PATCH | /shopping_lists/:id/items/:item_id | アイテム更新（チェック等） |
| DELETE | /shopping_lists/:id/items/:item_id | アイテム削除 |
| DELETE | /shopping_lists/:id/items/checked | 購入済みアイテム一括削除 |

---

## 4. 詳細仕様

---

### GET /recipes — レシピ一覧取得

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| page | integer | × | ページ番号（デフォルト: 1） |
| per_page | integer | × | 1ページ件数（デフォルト: 12、最大: 50） |
| q | string | × | キーワード検索（タイトル・説明文・タグ） |
| ingredient | string | × | 食材名検索（部分一致） |
| genre | string | × | ジャンル絞り込み（japanese/western/chinese/italian/other） |
| tag_ids | string | × | タグID絞り込み（カンマ区切り複数指定可） |
| cook_time_max | integer | × | 調理時間上限（分） |
| sort | string | × | 並び順（created_at_desc / created_at_asc / cook_time_asc / title_asc） |

**レスポンス例**

```json
{
  "data": [
    {
      "id": 1,
      "title": "肉じゃが",
      "description": "定番の家庭料理です",
      "genre": "japanese",
      "servings": 4,
      "cook_time": 30,
      "image_url": "https://xxx.cloudfront.net/images/recipes/1/main.jpg",
      "tags": [
        { "id": 1, "name": "煮物" },
        { "id": 2, "name": "定番" }
      ],
      "created_at": "2026-06-03T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "per_page": 12
  }
}
```

---

### GET /recipes/:id — レシピ詳細取得

**レスポンス例**

```json
{
  "data": {
    "id": 1,
    "title": "肉じゃが",
    "description": "定番の家庭料理です",
    "genre": "japanese",
    "servings": 4,
    "cook_time": 30,
    "image_url": "https://xxx.cloudfront.net/images/recipes/1/main.jpg",
    "tags": [
      { "id": 1, "name": "煮物" }
    ],
    "ingredients": [
      { "id": 1, "name": "牛肉", "amount": 200, "unit": "g", "sort_order": 1 },
      { "id": 2, "name": "じゃがいも", "amount": 3, "unit": "個", "sort_order": 2 }
    ],
    "instructions": [
      { "id": 1, "step_number": 1, "body": "牛肉を一口大に切る", "image_url": null },
      { "id": 2, "step_number": 2, "body": "じゃがいもを乱切りにする", "image_url": null }
    ],
    "nutrition": {
      "calories": 320.5,
      "protein": 18.2,
      "fat": 10.4,
      "carbs": 38.1,
      "fiber": 3.2,
      "salt": 1.8
    },
    "created_at": "2026-06-03T10:00:00.000Z",
    "updated_at": "2026-06-03T10:00:00.000Z"
  }
}
```

---

### POST /recipes — レシピ新規登録

**リクエスト（multipart/form-data）**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| recipe[title] | string | ○ | タイトル（最大100文字） |
| recipe[description] | string | × | 説明文（最大500文字） |
| recipe[genre] | string | ○ | ジャンル |
| recipe[servings] | integer | ○ | 人数（1〜99） |
| recipe[cook_time] | integer | × | 調理時間（分） |
| recipe[image] | file | × | メイン画像（JPEG/PNG/WebP, 5MB以下） |
| recipe[tag_ids][] | integer | × | タグID（複数） |
| recipe[ingredients][][name] | string | ○ | 食材名 |
| recipe[ingredients][][amount] | decimal | × | 分量 |
| recipe[ingredients][][unit] | string | × | 単位 |
| recipe[ingredients][][sort_order] | integer | ○ | 表示順 |
| recipe[instructions][][step_number] | integer | ○ | ステップ番号 |
| recipe[instructions][][body] | string | ○ | 手順テキスト |
| recipe[instructions][][image] | file | × | 手順画像 |

**レスポンス（201 Created）**

```json
{
  "data": {
    "id": 2,
    "title": "新しいレシピ",
    ...
  }
}
```

---

### PATCH /recipes/:id — レシピ更新

POST /recipes と同じフィールド構造。指定したフィールドのみ更新する。

**レスポンス（200 OK）**: 更新後のレシピ詳細（GET /recipes/:id と同形式）

---

### DELETE /recipes/:id — レシピ削除

**レスポンス（204 No Content）**: ボディなし

---

### GET /tags — タグ一覧取得

**レスポンス例**

```json
{
  "data": [
    { "id": 1, "name": "煮物" },
    { "id": 2, "name": "定番" },
    { "id": 3, "name": "時短" }
  ]
}
```

---

### POST /shopping_lists/:id/items — アイテム追加（レシピから一括追加）

**リクエスト例**

```json
{
  "recipe_id": 1,
  "servings": 2
}
```

`recipe_id` + `servings` を指定すると、レシピの材料を人数分に換算して一括追加する。

個別追加の場合:

```json
{
  "items": [
    { "name": "牛肉", "amount": 100, "unit": "g" },
    { "name": "じゃがいも", "amount": 2, "unit": "個" }
  ]
}
```

**レスポンス（201 Created）**

```json
{
  "data": [
    { "id": 10, "name": "牛肉", "amount": 100.0, "unit": "g", "checked": false },
    { "id": 11, "name": "じゃがいも", "amount": 2.0, "unit": "個", "checked": false }
  ]
}
```

---

### PATCH /shopping_lists/:id/items/:item_id — アイテム更新

**リクエスト例**（チェック状態の更新）

```json
{
  "checked": true
}
```

**レスポンス（200 OK）**

```json
{
  "data": {
    "id": 10,
    "name": "牛肉",
    "amount": 100.0,
    "unit": "g",
    "checked": true
  }
}
```

---

## 5. CORS 設定

Rails の `config/initializers/cors.rb` にて以下を設定する：

```ruby
origins 'https://<CloudFrontドメイン>'
```

開発環境では `http://localhost:3000` も許可する。

---

## 6. 画像 URL の生成方針

- S3 画像バケットはプライベート設定
- CloudFront + OAC（Origin Access Control）を使い、CloudFront 経由でのみ画像にアクセスできるようにする
- レシピ画像の URL は `https://<CloudFrontドメイン>/images/<S3オブジェクトキー>` 形式でAPIレスポンスに含める

---

*作成日: 2026-06-03*
