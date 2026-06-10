# データベース設計書

## 1. ER図

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    recipes      │       │   ingredients    │       │  instructions    │
├─────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id           │──┬──▶│ PK id            │       │ PK id            │
│    title        │  │   │ FK recipe_id     │   ┌──▶│ FK recipe_id     │
│    description  │  │   │    name          │   │   │    step_number   │
│    genre        │  │   │    amount        │   │   │    body          │
│    servings     │  │   │    unit          │   │   │    image_key     │
│    cook_time    │  │   │    created_at    │   │   │    created_at    │
│    image_key    │  │   │    updated_at    │   │   │    updated_at    │
│    created_at   │  └───└──────────────────┘   │   └──────────────────┘
│    updated_at   │──────────────────────────────┘
└────────┬────────┘
         │
         │  1対1
         ▼
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   nutritions    │       │   recipe_tags    │       │      tags        │
├─────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id           │       │ PK id            │       │ PK id            │
│ FK recipe_id    │       │ FK recipe_id     │──────▶│    name          │
│    calories     │       │ FK tag_id        │◀──────│    created_at    │
│    protein      │       │    created_at    │       │    updated_at    │
│    fat          │       └──────────────────┘       └──────────────────┘
│    carbs        │
│    fiber        │       ┌──────────────────┐       ┌──────────────────┐
│    salt         │       │  shopping_lists  │       │  shopping_items  │
│    created_at   │       ├──────────────────┤       ├──────────────────┤
│    updated_at   │       │ PK id            │──────▶│ PK id            │
└─────────────────┘       │    name          │       │ FK list_id       │
                          │    created_at    │       │ FK recipe_id (nullable) │
                          │    updated_at    │       │    name          │
                          └──────────────────┘       │    amount        │
                                                      │    unit          │
┌──────────────────────────────────────────┐          │    checked       │
│         food_nutrients（マスタ）          │          │    created_at    │
├──────────────────────────────────────────┤          │    updated_at    │
│ PK id                                    │          └──────────────────┘
│    name（食品名）                         │
│    calories_per_100g                     │
│    protein_per_100g                      │
│    fat_per_100g                          │
│    carbs_per_100g                        │
│    fiber_per_100g                        │
│    salt_per_100g                         │
│    created_at                            │
│    updated_at                            │
└──────────────────────────────────────────┘
```

---

## 2. テーブル定義

### recipes（レシピ）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|----------|------|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | 主キー |
| title | VARCHAR(100) | NOT NULL | - | レシピタイトル |
| description | TEXT | NULL | NULL | レシピ説明文（500文字以内） |
| genre | ENUM('japanese','western','chinese','italian','other') | NOT NULL | 'other' | ジャンル |
| servings | TINYINT UNSIGNED | NOT NULL | 1 | 人数（1〜99） |
| cook_time | SMALLINT UNSIGNED | NULL | NULL | 調理時間（分） |
| image_key | VARCHAR(255) | NULL | NULL | S3 オブジェクトキー |
| created_at | DATETIME(6) | NOT NULL | - | 作成日時 |
| updated_at | DATETIME(6) | NOT NULL | - | 更新日時 |

**インデックス**
- PRIMARY KEY (id)
- INDEX idx_recipes_genre (genre)
- INDEX idx_recipes_cook_time (cook_time)
- FULLTEXT INDEX ft_recipes_title (title) ※全文検索用

---

### ingredients（材料）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|----------|------|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | 主キー |
| recipe_id | BIGINT UNSIGNED | NOT NULL | - | recipes.id 外部キー |
| name | VARCHAR(100) | NOT NULL | - | 食材名 |
| amount | DECIMAL(8,2) | NULL | NULL | 分量 |
| unit | VARCHAR(20) | NULL | NULL | 単位（g, ml, 個 など） |
| sort_order | TINYINT UNSIGNED | NOT NULL | 0 | 表示順 |
| created_at | DATETIME(6) | NOT NULL | - | 作成日時 |
| updated_at | DATETIME(6) | NOT NULL | - | 更新日時 |

**インデックス**
- PRIMARY KEY (id)
- INDEX idx_ingredients_recipe_id (recipe_id)
- FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE

---

### instructions（手順）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|----------|------|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | 主キー |
| recipe_id | BIGINT UNSIGNED | NOT NULL | - | recipes.id 外部キー |
| step_number | TINYINT UNSIGNED | NOT NULL | - | ステップ番号（1〜） |
| body | TEXT | NOT NULL | - | 手順テキスト（300文字以内） |
| image_key | VARCHAR(255) | NULL | NULL | S3 オブジェクトキー（手順画像） |
| created_at | DATETIME(6) | NOT NULL | - | 作成日時 |
| updated_at | DATETIME(6) | NOT NULL | - | 更新日時 |

**インデックス**
- PRIMARY KEY (id)
- UNIQUE KEY uq_instructions_recipe_step (recipe_id, step_number)
- FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE

---

### nutritions（栄養情報）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|----------|------|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | 主キー |
| recipe_id | BIGINT UNSIGNED | NOT NULL | - | recipes.id 外部キー |
| calories | DECIMAL(7,2) | NULL | NULL | エネルギー（kcal） |
| protein | DECIMAL(6,2) | NULL | NULL | タンパク質（g） |
| fat | DECIMAL(6,2) | NULL | NULL | 脂質（g） |
| carbs | DECIMAL(6,2) | NULL | NULL | 炭水化物（g） |
| fiber | DECIMAL(6,2) | NULL | NULL | 食物繊維（g） |
| salt | DECIMAL(5,2) | NULL | NULL | 食塩相当量（g） |
| created_at | DATETIME(6) | NOT NULL | - | 作成日時 |
| updated_at | DATETIME(6) | NOT NULL | - | 更新日時 |

**インデックス**
- PRIMARY KEY (id)
- UNIQUE KEY uq_nutritions_recipe_id (recipe_id)
- FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE

---

### tags（タグ）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|----------|------|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | 主キー |
| name | VARCHAR(20) | NOT NULL | - | タグ名 |
| created_at | DATETIME(6) | NOT NULL | - | 作成日時 |
| updated_at | DATETIME(6) | NOT NULL | - | 更新日時 |

**インデックス**
- PRIMARY KEY (id)
- UNIQUE KEY uq_tags_name (name)

---

### recipe_tags（レシピ〜タグ 中間テーブル）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|----------|------|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | 主キー |
| recipe_id | BIGINT UNSIGNED | NOT NULL | - | recipes.id 外部キー |
| tag_id | BIGINT UNSIGNED | NOT NULL | - | tags.id 外部キー |
| created_at | DATETIME(6) | NOT NULL | - | 作成日時 |

**インデックス**
- PRIMARY KEY (id)
- UNIQUE KEY uq_recipe_tags (recipe_id, tag_id)
- FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
- FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE

---

### shopping_lists（買い物リスト）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|----------|------|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | 主キー |
| name | VARCHAR(100) | NOT NULL | 'マイリスト' | リスト名 |
| created_at | DATETIME(6) | NOT NULL | - | 作成日時 |
| updated_at | DATETIME(6) | NOT NULL | - | 更新日時 |

---

### shopping_items（買い物アイテム）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|----------|------|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | 主キー |
| list_id | BIGINT UNSIGNED | NOT NULL | - | shopping_lists.id 外部キー |
| recipe_id | BIGINT UNSIGNED | NULL | NULL | 元レシピ（任意） |
| name | VARCHAR(100) | NOT NULL | - | 食材名 |
| amount | DECIMAL(8,2) | NULL | NULL | 分量 |
| unit | VARCHAR(20) | NULL | NULL | 単位 |
| checked | BOOLEAN | NOT NULL | FALSE | 購入済みフラグ |
| created_at | DATETIME(6) | NOT NULL | - | 作成日時 |
| updated_at | DATETIME(6) | NOT NULL | - | 更新日時 |

**インデックス**
- PRIMARY KEY (id)
- INDEX idx_shopping_items_list_id (list_id)
- FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE
- FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL

---

### food_nutrients（食品栄養マスタ）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|----------|------|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | 主キー |
| name | VARCHAR(100) | NOT NULL | - | 食品名 |
| calories_per_100g | DECIMAL(7,2) | NULL | NULL | エネルギー（kcal/100g） |
| protein_per_100g | DECIMAL(6,2) | NULL | NULL | タンパク質（g/100g） |
| fat_per_100g | DECIMAL(6,2) | NULL | NULL | 脂質（g/100g） |
| carbs_per_100g | DECIMAL(6,2) | NULL | NULL | 炭水化物（g/100g） |
| fiber_per_100g | DECIMAL(6,2) | NULL | NULL | 食物繊維（g/100g） |
| salt_per_100g | DECIMAL(5,2) | NULL | NULL | 食塩相当量（g/100g） |
| created_at | DATETIME(6) | NOT NULL | - | 作成日時 |
| updated_at | DATETIME(6) | NOT NULL | - | 更新日時 |

**インデックス**
- PRIMARY KEY (id)
- FULLTEXT INDEX ft_food_nutrients_name (name) ※食材名での曖昧検索用

> 初期データは文部科学省「日本食品標準成分表2020年版（八訂）」から主要食品を seed データとして投入する。

---

## 3. 文字セット・照合順序

| 設定 | 値 |
|------|-----|
| character_set_server | utf8mb4 |
| collation_server | utf8mb4_unicode_ci |

全テーブル・全カラムに `utf8mb4` を適用し、絵文字を含む日本語文字列を正しく扱えるようにする。

---

## 4. マイグレーション方針

- Rails の `db/migrate/` でスキーマを管理する
- `schema.rb` をリポジトリにコミットし、テーブル定義の変更履歴を追跡する
- 本番へのマイグレーションはデプロイ手順書（deployment.md）に従い実施する

---

*作成日: 2026-06-03*
