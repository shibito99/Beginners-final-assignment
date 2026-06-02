# システムアーキテクチャ設計書

## 1. 全体構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                          Internet                               │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AWS CloudFront                            │
│  ・HTTPS終端（ACM証明書）                                        │
│  ・キャッシュ制御（静的ファイル: 長期キャッシュ）                    │
│  ・オリジン振り分け: /* → S3 / /api/* → EC2                      │
└──────────────┬──────────────────────────────┬───────────────────┘
               │ /*                            │ /api/*
               ▼                               ▼
┌──────────────────────┐        ┌──────────────────────────────────┐
│  AWS S3 Bucket       │        │  VPC (10.0.0.0/16)               │
│  (フロントエンド)      │        │                                  │
│                      │        │  ┌────────────────────────────┐  │
│  Next.js 静的ファイル  │        │  │ パブリックサブネット          │  │
│  (HTML/CSS/JS)       │        │  │ (10.0.1.0/24)              │  │
│                      │        │  │                            │  │
│  静的ウェブサイト      │        │  │  ┌──────────────────────┐  │  │
│  ホスティング有効      │        │  │  │  EC2 t3.micro        │  │  │
└──────────────────────┘        │  │  │  (Ruby on Rails)     │  │  │
                                │  │  │                      │  │  │
┌──────────────────────┐        │  │  │  Nginx (port 80)     │  │  │
│  AWS S3 Bucket       │        │  │  │  └─▶ Puma (port 3001)│  │  │
│  (画像ストレージ)      │◀───────┤  │  └──────────────────────┘  │  │
│                      │presign │  └────────────────────────────┘  │
│  レシピ画像           │  URL   │                                  │
│  (private / OAC)     │        │  ┌────────────────────────────┐  │
└──────────────────────┘        │  │ プライベートサブネット         │  │
                                │  │ (10.0.2.0/24)              │  │
                                │  │                            │  │
                                │  │  ┌──────────────────────┐  │  │
                                │  │  │  RDS MySQL 8.0       │  │  │
                                │  │  │  db.t3.micro         │  │  │
                                │  │  │  (シングルAZ)         │  │  │
                                │  │  └──────────────────────┘  │  │
                                │  └────────────────────────────┘  │
                                └──────────────────────────────────┘
```

---

## 2. AWS リソース一覧

### ネットワーク

| リソース | 名前 | 設定値 |
|---------|------|--------|
| VPC | recipe-app-vpc | CIDR: 10.0.0.0/16 |
| パブリックサブネット | recipe-app-public-1a | CIDR: 10.0.1.0/24 / AZ: ap-northeast-1a |
| プライベートサブネット | recipe-app-private-1a | CIDR: 10.0.2.0/24 / AZ: ap-northeast-1a |
| プライベートサブネット | recipe-app-private-1c | CIDR: 10.0.3.0/24 / AZ: ap-northeast-1c（RDS用サブネットグループ要件） |
| Internet Gateway | recipe-app-igw | VPCにアタッチ |
| Route Table（public） | recipe-app-rt-public | 0.0.0.0/0 → IGW |

### セキュリティグループ

| SG名 | 対象 | インバウンドルール |
|------|------|-----------------|
| recipe-app-sg-ec2 | EC2 | HTTP(80): CloudFront IP のみ |
| recipe-app-sg-rds | RDS | MySQL(3306): EC2 SG からのみ |

> CloudFront → EC2 の通信はカスタムヘッダー（X-Custom-Token）でオリジン検証を行い、直接アクセスを防止する。

### コンピューティング

| リソース | 名前 | 設定値 |
|---------|------|--------|
| EC2 | recipe-app-ec2 | t3.micro / Amazon Linux 2023 / パブリックサブネット |
| キーペア | recipe-app-key | 初回作成後、秘密鍵はローカルで管理 |
| IAM ロール | recipe-app-ec2-role | AmazonS3FullAccess（画像バケットのみ絞り込み推奨） |

### ストレージ

| リソース | バケット名（例） | 用途 |
|---------|---------------|------|
| S3 Bucket | recipe-app-frontend | Next.js 静的ファイル |
| S3 Bucket | recipe-app-images | レシピ画像（プライベート） |

### データベース

| リソース | 名前 | 設定値 |
|---------|------|--------|
| RDS | recipe-app-db | MySQL 8.0 / db.t3.micro / シングルAZ |
| DB サブネットグループ | recipe-app-db-subnet | プライベートサブネット1a + 1c |
| パラメータグループ | recipe-app-mysql8 | character_set_server=utf8mb4 |

### CDN / DNS

| リソース | 設定値 |
|---------|--------|
| CloudFront ディストリビューション | オリジン1: S3（フロントエンド） / オリジン2: EC2（API） |
| ACM 証明書 | ドメイン用（独自ドメイン取得後に設定） |

---

## 3. アプリケーション構成

### フロントエンド（Next.js）

```
[ブラウザ]
    │
    │ HTTPS（CloudFront経由）
    │
    ▼
[Next.js 静的ファイル on S3]
    │
    │ クライアントサイドから fetch / axios で API呼び出し
    │
    ▼
[Rails API on EC2] ─── [RDS MySQL]
    │
    │ presigned URL 発行 または S3 直接アップロード
    ▼
[S3 画像バケット]
```

- データ取得はすべてクライアントサイドレンダリング（CSR）で行う
- 初回ページロード時にレシピ一覧を API から取得して表示
- 画像アップロードは Rails API 経由でS3に保存（ActiveStorage + S3）

### バックエンド（Rails API）

```
EC2 (Amazon Linux 2023)
├── Nginx（ポート80 / リバースプロキシ）
│     └── /api/* を Puma（ポート3001）に転送
└── Puma（Rails API アプリケーションサーバー）
      └── Rails 7（API モード）
            ├── routes.rb（/api/v1/...）
            ├── controllers/api/v1/
            ├── models/（ActiveRecord）
            └── ActiveStorage（S3連携）
```

---

## 4. 通信フロー

### レシピ一覧取得

```
1. ブラウザ → CloudFront: GET /
2. CloudFront → S3: index.html を返す
3. ブラウザ: Next.js JS を読み込み
4. ブラウザ → CloudFront: GET /api/v1/recipes
5. CloudFront → EC2(Nginx): GET /api/v1/recipes
6. Nginx → Puma: フォワード
7. Puma → Rails: RecipesController#index
8. Rails → RDS: SELECT * FROM recipes
9. Rails → ブラウザ: JSON レスポンス
```

### 画像アップロード

```
1. ブラウザ → Rails API: POST /api/v1/recipes（multipart）
2. Rails → ActiveStorage: ファイル受け取り
3. ActiveStorage → S3（画像バケット）: アップロード
4. Rails: image_url（S3 key）をDBに保存
5. Rails → ブラウザ: 登録済みレシピJSON（image_urlを含む）
6. ブラウザ → CloudFront/S3: 画像表示（presigned URL または公開URL）
```

---

## 5. セキュリティ設計

| 脅威 | 対策 |
|------|------|
| EC2 への直接アクセス | セキュリティグループで CloudFront IP のみ許可 + カスタムヘッダー検証 |
| SQLインジェクション | ActiveRecord のパラメータバインド（Rails デフォルト） |
| XSS | Next.js の React DOM エスケープ + CSP ヘッダー（CloudFront で付与） |
| 画像の不正アクセス | S3 バケットをプライベートに設定。表示は presigned URL（有効期限付き）で制御 |
| 通信の盗聴 | CloudFront で HTTPS 強制（HTTP → HTTPS リダイレクト） |
| SSH 不正アクセス | EC2 への SSH は SSM Session Manager 経由（22番ポート開放不要） |

---

## 6. 環境構成

| 環境 | 用途 | 構成 |
|------|------|------|
| ローカル | 開発 | Docker Compose（Rails + MySQL） |
| 本番 | リリース | AWS（本設計書の構成） |

> ステージング環境は初期段階では省略。必要に応じて本番と同一構成で追加する。

---

*作成日: 2026-06-03*
