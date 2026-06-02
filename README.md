# 料理レシピ管理アプリ

個人利用を想定した料理レシピ管理Webアプリケーション。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js（静的エクスポート）+ S3 + CloudFront |
| バックエンド | Ruby on Rails（APIモード）on EC2 |
| データベース | MySQL 8.0 on RDS |
| インフラ管理 | Terraform + AWS CLI |

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [docs/requirements.md](docs/requirements.md) | ソフトウェア要件定義書（SRS） |
| [docs/tech-stack.md](docs/tech-stack.md) | 技術スタック選定書 |
| [docs/architecture.md](docs/architecture.md) | システムアーキテクチャ設計書 |
| [docs/database-design.md](docs/database-design.md) | データベース設計書 |
| [docs/api-design.md](docs/api-design.md) | API設計書 |
| [docs/screen-design.md](docs/screen-design.md) | 画面設計書 |
| [docs/infrastructure.md](docs/infrastructure.md) | インフラ設計書（Terraform） |
| [docs/deployment.md](docs/deployment.md) | デプロイ手順書 |
| [docs/test-plan.md](docs/test-plan.md) | テスト計画書 |

## 開発フロー

### ブランチ運用ルール

```
main
 └── feature/<issue番号>-<作業内容の概要>
       例: feature/10-infra-terraform-setup
           feature/12-backend-recipe-crud
```

1. **issue を作成する**（GitHub Issues）
2. **ブランチを切る**（issueに対応したブランチ名）
   ```bash
   git checkout -b feature/<issue番号>-<作業内容>
   ```
3. **作業・コミットする**
   ```bash
   git add .
   git commit -m "feat: 〇〇を実装 #<issue番号>"
   ```
4. **Pull Request を作成する**（GitHub）
   - PR タイトルに `#<issue番号>` を含める
   - レビュー後に main へマージする
5. **issueをクローズする**（PR マージ時に自動クローズ推奨）

### コミットメッセージの規則（Conventional Commits）

| プレフィックス | 用途 |
|-------------|------|
| `feat:` | 新機能の追加 |
| `fix:` | バグ修正 |
| `docs:` | ドキュメントの変更 |
| `refactor:` | リファクタリング |
| `test:` | テストの追加・修正 |
| `infra:` | インフラ構成の変更 |
| `chore:` | その他（設定変更等） |

### ラベル一覧

| ラベル | 用途 |
|-------|------|
| `documentation` | ドキュメント作業 |
| `infrastructure` | インフラ構築 |
| `backend` | バックエンド実装 |
| `frontend` | フロントエンド実装 |
| `testing` | テスト作業 |
