# インフラ設計書（Terraform）

## 1. 概要

AWS リソースはすべて Terraform で管理し、AWSコンソールの手動操作は行わない。
Terraform の状態ファイル（tfstate）は S3 バックエンドで管理し、チーム開発・再現性を確保する。

---

## 2. ディレクトリ構成

```
infra/
├── main.tf              # プロバイダー設定・バックエンド設定
├── variables.tf         # 変数定義
├── outputs.tf           # 出力値定義
├── terraform.tfvars     # 変数の実値（gitignore対象）
├── modules/
│   ├── vpc/             # VPC・サブネット・IGW・ルートテーブル
│   ├── security_group/  # セキュリティグループ
│   ├── ec2/             # EC2インスタンス・IAMロール・キーペア
│   ├── rds/             # RDS MySQL・サブネットグループ・パラメータグループ
│   ├── s3/              # S3バケット（フロントエンド・画像）
│   └── cloudfront/      # CloudFrontディストリビューション・OAC
└── envs/
    └── prod/            # 本番環境用 tfvars・バックエンド設定
```

---

## 3. AWSリージョン・アカウント設定

| 項目 | 値 |
|------|-----|
| リージョン | ap-northeast-1（東京） |
| Terraform バージョン | >= 1.7 |
| AWS Provider バージョン | ~> 5.0 |
| tfstate バックエンド | S3（バケット名: recipe-app-tfstate） |
| tfstate ロック | DynamoDB（テーブル名: recipe-app-tfstate-lock） |

---

## 4. モジュール設計

### module: vpc

**作成するリソース**

| リソース | 名前 | 設定値 |
|---------|------|--------|
| aws_vpc | recipe-app-vpc | cidr: 10.0.0.0/16 / DNS解決有効 |
| aws_subnet（public） | recipe-app-public-1a | cidr: 10.0.1.0/24 / AZ: 1a |
| aws_subnet（private） | recipe-app-private-1a | cidr: 10.0.2.0/24 / AZ: 1a |
| aws_subnet（private） | recipe-app-private-1c | cidr: 10.0.3.0/24 / AZ: 1c（RDS用） |
| aws_internet_gateway | recipe-app-igw | VPCにアタッチ |
| aws_route_table | recipe-app-rt-public | 0.0.0.0/0 → IGW |
| aws_route_table_association | - | public subnet に関連付け |

---

### module: security_group

**作成するリソース**

| SG名 | インバウンド | アウトバウンド |
|------|------------|-------------|
| recipe-app-sg-ec2 | TCP 80: CloudFront マネージドプレフィックスリスト | 全許可 |
| recipe-app-sg-rds | TCP 3306: recipe-app-sg-ec2 から | 全許可 |

> CloudFront のIPレンジは `aws_ec2_managed_prefix_list` data source で取得する。

---

### module: ec2

**作成するリソース**

| リソース | 設定値 |
|---------|--------|
| aws_instance | t3.micro / Amazon Linux 2023 AMI / パブリックサブネット |
| aws_key_pair | ローカルで生成した公開鍵を登録 |
| aws_iam_role | EC2 から S3（画像バケット）へのアクセス権限 |
| aws_iam_instance_profile | EC2 に IAM ロールをアタッチ |
| aws_eip | EC2 に Elastic IP を割り当て（固定IPアドレス） |

**ユーザーデータ（初期セットアップスクリプト概要）**
- Nginx インストール・起動
- Ruby（rbenv経由）インストール
- Bundler インストール
- SSM Agent が有効（Amazon Linux 2023 にはデフォルト搭載）

---

### module: rds

**作成するリソース**

| リソース | 設定値 |
|---------|--------|
| aws_db_subnet_group | プライベートサブネット1a + 1c |
| aws_db_parameter_group | MySQL 8.0 / character_set_server=utf8mb4 |
| aws_db_instance | MySQL 8.0 / db.t3.micro / シングルAZ / 20GB gp3 / 自動バックアップ7日 |

**RDS 設定値**

| 項目 | 値 |
|------|-----|
| エンジン | mysql 8.0 |
| インスタンスクラス | db.t3.micro |
| ストレージ | 20 GB（gp3） |
| マルチAZ | false（シングルAZ） |
| バックアップ保持期間 | 7日 |
| 削除保護 | true |
| パブリックアクセス | false |

---

### module: s3

**作成するリソース**

#### フロントエンドバケット（recipe-app-frontend）

| 設定 | 値 |
|------|-----|
| バケットポリシー | CloudFront OAC のみ GetObject 許可 |
| パブリックアクセスブロック | 全項目 true |
| バージョニング | 無効 |
| 静的ウェブサイトホスティング | 有効（エラードキュメント: index.html） |

#### 画像バケット（recipe-app-images）

| 設定 | 値 |
|------|-----|
| バケットポリシー | EC2 IAM ロールから PutObject/GetObject 許可、CloudFront OAC から GetObject 許可 |
| パブリックアクセスブロック | 全項目 true |
| CORS 設定 | CloudFront ドメインからの PUT を許可（ActiveStorage ダイレクトアップロード用） |

---

### module: cloudfront

**作成するリソース**

| リソース | 設定値 |
|---------|--------|
| aws_cloudfront_origin_access_control | S3 用 OAC（署名プロトコル: sigv4） |
| aws_cloudfront_distribution | 以下参照 |

**CloudFront ディストリビューション設定**

| 項目 | 設定値 |
|------|--------|
| オリジン1（デフォルト） | S3 フロントエンドバケット（OAC使用） |
| オリジン2（API） | EC2 の Elastic IP または DNS（カスタムオリジン） |
| キャッシュビヘイビア（デフォルト `/*`） | オリジン1へ / キャッシュあり |
| キャッシュビヘイビア（`/api/*`） | オリジン2へ / キャッシュなし / 全ヘッダー転送 |
| キャッシュビヘイビア（`/images/*`） | 画像S3へ / キャッシュあり |
| HTTPS | ACM証明書（us-east-1 で発行必須） |
| HTTP → HTTPS リダイレクト | 有効 |
| カスタムヘッダー（EC2向け） | `X-Custom-Token: <秘密トークン>`（EC2直接アクセスを防止） |

---

## 5. tfstate バックエンド初期化手順

```bash
# 1. tfstate 用 S3 バケットを AWS CLI で作成（初回のみ）
aws s3api create-bucket \
  --bucket recipe-app-tfstate \
  --region ap-northeast-1 \
  --create-bucket-configuration LocationConstraint=ap-northeast-1

# 2. バージョニング有効化
aws s3api put-bucket-versioning \
  --bucket recipe-app-tfstate \
  --versioning-configuration Status=Enabled

# 3. tfstate ロック用 DynamoDB テーブル作成
aws dynamodb create-table \
  --table-name recipe-app-tfstate-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1

# 4. Terraform 初期化
cd infra/
terraform init
```

---

## 6. Terraform 実行フロー

```bash
# 差分確認
terraform plan -var-file="envs/prod/terraform.tfvars"

# 適用
terraform apply -var-file="envs/prod/terraform.tfvars"

# 特定リソースのみ適用
terraform apply -target=module.ec2 -var-file="envs/prod/terraform.tfvars"

# リソース削除（注意: RDS削除保護を先に外す）
terraform destroy -var-file="envs/prod/terraform.tfvars"
```

---

## 7. 主要な変数（variables.tf）

| 変数名 | 説明 | 例 |
|--------|------|-----|
| aws_region | AWSリージョン | ap-northeast-1 |
| project_name | プロジェクト名（リソース名のプレフィックス） | recipe-app |
| ec2_key_name | EC2 キーペア名 | recipe-app-key |
| db_username | RDS ユーザー名 | recipe_admin |
| db_password | RDS パスワード（tfvarsに記載 / gitignore） | xxxxxxxx |
| cloudfront_custom_token | EC2 直接アクセス防止トークン | xxxxxxxx |
| domain_name | 独自ドメイン名（取得後に設定） | example.com |
| acm_certificate_arn | ACM 証明書 ARN（us-east-1） | arn:aws:... |

---

## 8. セキュリティ注意事項

- `terraform.tfvars` は `.gitignore` に追加し、リポジトリにコミットしない
- DBパスワードは AWS Secrets Manager への移行を将来的に検討する
- IAM ロールの権限は最小権限の原則に従い、特定バケット・特定操作のみに絞る
- EC2 への SSH は SSM Session Manager 経由で行い、22番ポートは開放しない

---

*作成日: 2026-06-03*
