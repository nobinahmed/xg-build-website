#!/bin/sh
# Upload the committed site to GoDaddy hosting over SSH.
# Needs the "xgbuild" host in ~/.ssh/config (key: ~/.ssh/xgbuild_godaddy).
# Only adds/updates files; never deletes anything on the server.
set -e
cd "$(dirname "$0")"

if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes - commit first so the server matches git." >&2
  exit 1
fi

git ls-files | grep -v -e '^\.git' -e '^deploy\.sh$' \
  | rsync -avz --files-from=- ./ xgbuild:public_html/

echo "Deployed $(git rev-parse --short HEAD) to https://xgbuild.com.au/"
