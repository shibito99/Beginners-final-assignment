#!/bin/bash
set -euo pipefail

# タイムゾーン設定
timedatectl set-timezone Asia/Tokyo

# パッケージ更新
dnf update -y

# 必要なパッケージのインストール
dnf install -y \
  nginx \
  git \
  gcc \
  gcc-c++ \
  make \
  openssl-devel \
  readline-devel \
  zlib-devel \
  libffi-devel \
  mysql-devel \
  patch \
  libxml2-devel \
  libxslt-devel

# Nginxの設定
cat > /etc/nginx/conf.d/recipe-app.conf << 'NGINX_CONF'
server {
  listen 80;

  # CloudFrontカスタムトークン検証
  if ($http_x_custom_token != "${cloudfront_token}") {
    return 403;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }

  location /health {
    proxy_pass http://127.0.0.1:3001;
  }
}
NGINX_CONF

systemctl enable nginx
systemctl start nginx

# appユーザー作成
useradd -m -s /bin/bash app

# rbenvのインストール（appユーザー）
sudo -u app bash << 'RBENV'
cd /home/app
git clone https://github.com/rbenv/rbenv.git .rbenv
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> .bashrc
echo 'eval "$(rbenv init -)"' >> .bashrc

git clone https://github.com/rbenv/ruby-build.git .rbenv/plugins/ruby-build

export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"

rbenv install 3.3.0
rbenv global 3.3.0

gem install bundler --no-document
RBENV

# 環境変数ファイルの作成
cat > /home/app/.env << ENV
RAILS_ENV=production
RAILS_LOG_TO_STDOUT=true
RAILS_SERVE_STATIC_FILES=false
SECRET_KEY_BASE=$(openssl rand -hex 64)
DB_HOST=${db_host}
DB_NAME=${db_name}
DB_USERNAME=${db_username}
DB_PASSWORD=${db_password}
CLOUDFRONT_TOKEN=${cloudfront_token}
ENV

chown app:app /home/app/.env
chmod 600 /home/app/.env

echo "EC2 initial setup completed."
