#!/bin/bash
# terraform initの前に一度だけ実行するスクリプト
# tfstate管理用のS3バケットとDynamoDBテーブルを作成します

set -euo pipefail

REGION="ap-northeast-1"
BUCKET="recipe-app-tfstate"
TABLE="recipe-app-tfstate-lock"

echo "S3バケットを作成中: $BUCKET"
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"

aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
    }]
  }'

aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "DynamoDBテーブルを作成中: $TABLE"
aws dynamodb create-table \
  --table-name "$TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION"

echo "完了！次のコマンドを実行してください:"
echo "  cd infra && terraform init"
