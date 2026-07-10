# API 設計書

## 1. 基本仕様

| 項目 | 値 |
|------|-----|
| ベースURL | `https://d2b2m401smddic.cloudfront.net` |
| データ形式 | JSON（Content-Type: application/json） |
| 文字コード | UTF-8 |
| 認証 | なし（個人利用） |
| バージョニング | URLパスで管理（/api/v1/...） |
| 実装 | AWS Lambda (Ruby 3.2) / `backend/lambda/handler.rb` |

---

## 2. 共通レスポンス形式

### 成功レスポンス

レスポンスボディはリソースを **直接返す**（`data` ラッパーなし）。

```json
// 単一リソース
{
  "recipeId": "uuid",
  "title": "親子丼",
  ...
}

// 複数リソース（配列）
[
  { "recipeId": "uuid", "title": "親子丼", ... },
  { "recipeId": "uuid", "title": "肉じゃが", ... }
]
```

### エラーレスポンス

```json
{
  "error": "Internal server error"
}
```

### HTTPステータスコード

| コード | 意味 |
|-------|------|
| 200 | OK（取得・更新・削除成功） |
| 201 | Created（作成成功） |
| 404 | Not Found（リソース未存在） |
| 500 | Internal Server Error |

---

## 3. エンドポイント一覧

### レシピ（Recipes）

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/v1/recipes | レシピ一覧取得（フィルタ対応） |
| GET | /api/v1/recipes/:id | レシピ詳細取得 |
| POST | /api/v1/recipes | レシピ新規登録 |
| PUT | /api/v1/recipes/:id | レシピ更新 |
| DELETE | /api/v1/recipes/:id | レシピ削除 |

### 画像アップロード

| メソッド | パス | 説明 |
|---------|------|------|
| POST | /api/v1/upload | S3 Presigned URL 発行 |

### 買い物リスト（ShoppingLists）

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/v1/shopping-lists | 買い物リスト一覧取得 |
| POST | /api/v1/shopping-lists | 買い物リスト新規作成 |
| PUT | /api/v1/shopping-lists/:id | 買い物リスト更新（アイテム追加・チェック・削除） |
| DELETE | /api/v1/shopping-lists/:id | 買い物リスト削除 |

### ヘルスチェック

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /health | Lambda 死活確認 |

---

## 4. 詳細仕様

---

### GET /api/v1/recipes — レシピ一覧取得

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| q | string | × | キーワード検索（タイトル・説明・タグ・食材名の部分一致） |
| genre | string | × | ジャンル絞り込み（japanese / western / chinese / ethnic / other） |
| tag | string | × | タグ名絞り込み（完全一致） |
| cooking_time | string | × | 調理時間フィルター（"15" / "30" / "60" / "60+"） |

> フィルタリングはLambda（Ruby）側でDynamoDB Scan結果に対して実施。  
> 結果は `createdAt` の降順（新着順）で返す。

**レスポンス例（200 OK）**

```json
[
  {
    "recipeId": "5bc520e7-3263-4aa2-b139-7b0305e9db68",
    "title": "親子丼",
    "description": "定番の家庭料理です",
    "genre": "japanese",
    "servings": 2,
    "cookingTime": 20,
    "imageKey": "recipes/uuid/photo.jpg",
    "tags": ["簡単", "時短"],
    "ingredients": [
      { "name": "鶏もも肉", "amount": "200", "unit": "g" }
    ],
    "steps": [
      { "body": "鶏肉と玉ねぎを出汁で煮る" }
    ],
    "nutrition": {},
    "createdAt": "2026-07-10T01:58:47Z",
    "updatedAt": "2026-07-10T04:23:55Z"
  }
]
```

---

### GET /api/v1/recipes/:id — レシピ詳細取得

**レスポンス例（200 OK）**: 一覧と同じフィールド構造（単一オブジェクト）

**エラー（404）**

```json
{ "error": "Recipe not found" }
```

---

### POST /api/v1/recipes — レシピ新規登録

**リクエストボディ（application/json）**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| title | string | ○ | タイトル |
| description | string | × | 説明文 |
| genre | string | ○ | ジャンル（japanese / western / chinese / ethnic / other） |
| servings | integer | ○ | 人数 |
| cookingTime | integer | × | 調理時間（分） |
| tags | string[] | × | タグ名の配列（例: ["簡単", "時短"]） |
| ingredients | object[] | × | `{ name, amount?, unit? }` の配列 |
| steps | object[] | × | `{ body }` の配列 |
| imageKey | string | × | S3オブジェクトキー（/api/v1/upload で取得） |
| nutrition | object | × | `{ calories?, protein?, fat?, carbs?, fiber?, salt? }` |

**リクエスト例**

```json
{
  "title": "親子丼",
  "genre": "japanese",
  "servings": 2,
  "cookingTime": 20,
  "tags": ["簡単", "時短"],
  "ingredients": [
    { "name": "鶏もも肉", "amount": "200", "unit": "g" },
    { "name": "卵", "amount": "3", "unit": "個" }
  ],
  "steps": [
    { "body": "鶏肉と玉ねぎを出汁で煮る" },
    { "body": "卵でとじてごはんに乗せる" }
  ]
}
```

**レスポンス（201 Created）**: 作成されたレシピオブジェクト（`recipeId` と `createdAt` / `updatedAt` が付与される）

---

### PUT /api/v1/recipes/:id — レシピ更新

POST /api/v1/recipes と同じフィールド構造。更新したいフィールドを含めて送信する（`recipeId` は無視される）。

**レスポンス（200 OK）**: 更新後のフィールドを含むオブジェクト（`updatedAt` が更新される）

---

### DELETE /api/v1/recipes/:id — レシピ削除

**レスポンス（200 OK）**

```json
{ "message": "Deleted" }
```

---

### POST /api/v1/upload — S3 Presigned URL 発行

ブラウザから S3 に直接画像をアップロードするための署名付きURLを発行する。

**リクエストボディ**

```json
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg"
}
```

**レスポンス（200 OK）**

```json
{
  "uploadUrl": "https://recipe-app-images-237228997080.s3.ap-northeast-1.amazonaws.com/recipes/uuid/photo.jpg?X-Amz-...",
  "imageKey": "recipes/uuid/photo.jpg"
}
```

> `uploadUrl` に対して `PUT` リクエストで画像バイナリを送信する（有効期限: 300秒）。  
> アップロード後、`imageKey` をレシピの `POST` / `PUT` リクエストに含める。  
> 画像はCloudFront経由 `https://d2b2m401smddic.cloudfront.net/images/{imageKey}` で配信される。

---

### GET /api/v1/shopping-lists — 買い物リスト一覧取得

**レスポンス例（200 OK）**

```json
[
  {
    "listId": "uuid",
    "name": "今週の買い物",
    "items": [
      { "name": "鶏肉", "checked": false },
      { "name": "卵", "checked": true }
    ],
    "createdAt": "2026-07-10T05:00:00Z",
    "updatedAt": "2026-07-10T06:00:00Z"
  }
]
```

---

### POST /api/v1/shopping-lists — 買い物リスト作成

**リクエストボディ**

```json
{
  "name": "今週の買い物",
  "items": []
}
```

**レスポンス（201 Created）**: 作成された買い物リストオブジェクト

---

### PUT /api/v1/shopping-lists/:id — 買い物リスト更新

アイテムの追加・チェック状態変更・削除はすべてこのエンドポイントで行う。  
`items` 配列全体を差し替える形で更新する。

**リクエストボディ**

```json
{
  "name": "今週の買い物",
  "items": [
    { "name": "鶏肉", "checked": true },
    { "name": "卵", "checked": false },
    { "name": "玉ねぎ", "checked": false }
  ]
}
```

**レスポンス（200 OK）**: 更新後の買い物リストオブジェクト

---

### DELETE /api/v1/shopping-lists/:id — 買い物リスト削除

**レスポンス（200 OK）**

```json
{ "message": "Deleted" }
```

---

## 5. CORS 設定

Lambda のレスポンスヘッダーに以下を設定済み：

```
Access-Control-Allow-Origin: *
Content-Type: application/json
```

---

## 6. 画像 URL の生成方針

- S3 画像バケットはプライベート設定（パブリックアクセスブロック有効）
- CloudFront + OAC（Origin Access Control）を使い、CloudFront 経由でのみ画像にアクセスできる
- 画像URLの形式: `https://d2b2m401smddic.cloudfront.net/images/{imageKey}`
- `imageKey` の形式: `recipes/{uuid}/{filename}`

---

*作成日: 2026-06-03 / 更新日: 2026-07-10（Lambda+DynamoDB構成に全面改訂）*
