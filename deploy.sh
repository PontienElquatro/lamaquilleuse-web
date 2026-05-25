#!/bin/bash
# LaMaquilleuse — Deploy script
# Usage: TOKEN=ghp_xxx ./deploy.sh
set -e

TOKEN="${TOKEN:?Variable TOKEN requise}"
USER="PontienElquatro"
REPO="lamaquilleuse-web"

git remote remove origin 2>/dev/null || true
git remote add origin "https://${TOKEN}@github.com/${USER}/${REPO}.git"
git branch -M main
git push -u origin main --force
echo "✅ Poussé sur https://github.com/${USER}/${REPO}"
