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
| [docs/要件定義書.md](docs/要件定義書.md) | ソフトウェア要件定義書（SRS） |
| [docs/技術スタック選定書.md](docs/技術スタック選定書.md) | 技術スタック選定書 |
| [docs/アーキテクチャ設計書.md](docs/アーキテクチャ設計書.md) | システムアーキテクチャ設計書 |
| [docs/データベース設計書.md](docs/データベース設計書.md) | データベース設計書 |
| [docs/API設計書.md](docs/API設計書.md) | API設計書 |
| [docs/画面設計書.md](docs/画面設計書.md) | 画面設計書 |
| [docs/インフラ設計書.md](docs/インフラ設計書.md) | インフラ設計書（Terraform） |
| [docs/デプロイ手順書.md](docs/デプロイ手順書.md) | デプロイ手順書 |
| [docs/テスト計画書.md](docs/テスト計画書.md) | テスト計画書 |

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
