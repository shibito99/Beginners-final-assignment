#!/bin/bash
set -e

# Railsのserver.pidが残っている場合は削除
rm -f /app/tmp/pids/server.pid

exec "$@"
