#!/bin/sh
# Collects only the public site files into dist/ (the template backup, docs and
# Vercel function stay out). Used by Cloudflare Pages: build command "sh build.sh",
# output directory "dist"; the lead handler is picked up from functions/ automatically.
#
# Manual deploy:  sh build.sh && npx wrangler pages deploy dist --project-name realty-harbour
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp -R index.html thank-you.html 404.html css js assets dist/
