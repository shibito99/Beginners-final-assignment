# デプロイ手順書

## 1. 前提条件

| 項目 | 確認事項 |
|------|---------|
| AWS CLI | v2 がインストール済み・認証設定済み（`aws configure`） |
| Terraform | v1.7 以上がインストール済み |
| Ruby | ローカルに 3.3 系がインストール済み |
| Node.js | 20 系（LTS）がインストール済み |
| Git | リポジトリのクローン済み |

---

## 2. 初回リリース手順

### Step 1: Terraform でインフラ構築

```bash
# 1. tfstate バックエンド用リソースを作成（初回のみ）
# → infrastructure.md の「tfstate バックエンド初期化手順」を参照

# 2. 変数ファイルを作成
cp infra/envs/prod/terraform.tfvars.example infra/envs/prod/terraform.tfvars
# terraform.tfvars に db_password, cloudfront_custom_token 等を記入

# 3. 初期化
cd infra/
terraform init

# 4. 差分確認
terraform plan -var-file="envs/prod/terraform.tfvars"

# 5. リソース作成（10〜15分程度かかる）
terraform apply -var-file="envs/prod/terraform.tfvars"

# 6. 出力値を確認（後続手順で使用）
terraform output
# → ec2_public_ip, rds_endpoint, s3_frontend_bucket, cloudfront_domain 等
```

---

### Step 2: EC2 の初期セットアップ

SSM Session Manager で EC2 に接続する（SSH 不要）：

```bash
aws ssm start-session --target <インスタンスID>
```

#### Ruby / Nginx / Puma のセットアップ

```bash
# 1. パッケージ更新
sudo dnf update -y

# 2. 依存パッケージインストール
sudo dnf install -y git gcc gcc-c++ make openssl-devel readline-devel \
  zlib-devel libffi-devel mysql-devel nginx

# 3. rbenv + Ruby インストール
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
source ~/.bashrc

git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build
rbenv install 3.3.x
rbenv global 3.3.x

# 4. Bundler インストール
gem install bundler

# 5. Node.js（フロントエンドのビルドには使わないが、assets用に念のため）
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

#### アプリケーションのデプロイ

```bash
# 1. アプリを /var/www/recipe-app にクローン
sudo mkdir -p /var/www/recipe-app
sudo chown ec2-user:ec2-user /var/www/recipe-app
git clone https://github.com/shibito99/Beginner-s-final-assignment.git /var/www/recipe-app
cd /var/www/recipe-app/backend

# 2. 環境変数ファイルを作成
cp .env.example .env
# .env に DATABASE_URL, SECRET_KEY_BASE, AWS_REGION, S3_BUCKET_NAME 等を記入

# 3. Gem インストール
bundle install --deployment

# 4. DBマイグレーション
RAILS_ENV=production bundle exec rails db:create db:migrate db:seed

# 5. Nginx 設定
sudo cp config/nginx.conf /etc/nginx/conf.d/recipe-app.conf
sudo systemctl enable nginx
sudo systemctl start nginx

# 6. Puma をサービスとして起動
sudo cp config/puma.service /etc/systemd/system/
sudo systemctl enable puma
sudo systemctl start puma
```

---

### Step 3: フロントエンドのビルド & S3 デプロイ

ローカル環境で実行：

```bash
cd frontend/

# 1. 依存パッケージインストール
npm ci

# 2. 環境変数設定
cp .env.local.example .env.local
# NEXT_PUBLIC_API_BASE_URL=https://<CloudFrontドメイン>/api/v1 を記入

# 3. 静的エクスポートビルド
npm run build
# → out/ ディレクトリに静的ファイルが生成される

# 4. S3 にアップロード
aws s3 sync out/ s3://<フロントエンドバケット名>/ --delete

# 5. CloudFront キャッシュ無効化
aws cloudfront create-invalidation \
  --distribution-id <ディストリビューションID> \
  --paths "/*"
```

---

## 3. 更新デプロイ手順

### バックエンド（Rails）の更新

```bash
# EC2 に SSM でアクセス
aws ssm start-session --target <インスタンスID>

cd /var/www/recipe-app/backend
git pull origin main

bundle install --deployment
RAILS_ENV=production bundle exec rails db:migrate

sudo systemctl restart puma
```

### フロントエンド（Next.js）の更新

ローカルから実行：

```bash
cd frontend/
npm ci
npm run build

aws s3 sync out/ s3://<フロントエンドバケット名>/ --delete

aws cloudfront create-invalidation \
  --distribution-id <ディストリビューションID> \
  --paths "/*"
```

---

## 4. 環境変数一覧

### バックエンド（Rails / .env）

| 変数名 | 説明 | 例 |
|--------|------|-----|
| RAILS_ENV | 実行環境 | production |
| SECRET_KEY_BASE | Rails 秘密鍵（`rails secret` で生成） | abc123... |
| DATABASE_URL | RDS 接続文字列 | mysql2://user:pass@endpoint/db_name |
| AWS_REGION | S3 リージョン | ap-northeast-1 |
| S3_IMAGES_BUCKET | 画像バケット名 | recipe-app-images |
| CLOUDFRONT_CUSTOM_TOKEN | CloudFront カスタムヘッダー検証用トークン | secret_token |
| FRONTEND_ORIGIN | CORS許可オリジン | https://xxxxx.cloudfront.net |

### フロントエンド（Next.js / .env.local）

| 変数名 | 説明 | 例 |
|--------|------|-----|
| NEXT_PUBLIC_API_BASE_URL | Rails API のベースURL | https://xxxxx.cloudfront.net/api/v1 |

---

## 5. ロールバック手順

### バックエンドのロールバック

```bash
cd /var/www/recipe-app/backend

# 直前のコミットに戻す
git log --oneline  # コミットハッシュを確認
git checkout <戻したいコミットハッシュ>

bundle install --deployment
# DBマイグレーションを戻す場合（注意: データ損失の可能性あり）
RAILS_ENV=production bundle exec rails db:rollback STEP=1

sudo systemctl restart puma
```

### フロントエンドのロールバック

S3 のバージョニングは無効のため、前回ビルドの成果物を再アップロードする：

```bash
# 前バージョンのコミットをローカルでチェックアウト
git checkout <戻したいコミットハッシュ> -- frontend/

cd frontend/
npm ci && npm run build
aws s3 sync out/ s3://<フロントエンドバケット名>/ --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

---

## 6. 運用時の注意事項

| 項目 | 注意事項 |
|------|---------|
| DBバックアップ | RDS 自動バックアップ（7日間）が有効。手動スナップショットは重要な変更前に取得 |
| コスト監視 | AWS Budgets でアラートを設定（月$50超えで通知等） |
| ログ確認 | `sudo journalctl -u puma -f`（Puma）/ `sudo tail -f /var/log/nginx/error.log`（Nginx） |
| 証明書更新 | ACM（AWS Certificate Manager）は自動更新。有効期限を定期確認 |
| EC2停止 | 不要時は EC2 を停止するとコスト削減可能（Elastic IP は停止中も課金に注意） |

---

*作成日: 2026-06-03*
