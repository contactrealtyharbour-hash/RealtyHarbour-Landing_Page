#!/bin/sh
# Collects only the public site files into dist/ (the template backup, docs and
# Vercel function stay out). Run automatically by `npx wrangler deploy` (see wrangler.jsonc).
#
# Manual deploy:  npx wrangler deploy
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp -R index.html thank-you.html 404.html css js assets dist/
