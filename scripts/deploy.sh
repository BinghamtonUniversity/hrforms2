#!/usr/bin/env bash
# Usage: ./scripts/deploy.sh dev   OR   ./scripts/deploy.sh prod
set -e

ENV=$1
if [[ "$ENV" == "dev" ]]; then
  BUILD_CMD="build-dev"
elif [[ "$ENV" == "prod" ]]; then
  BUILD_CMD="build"
else
  echo "Usage: $0 [dev|prod]"
  exit 1
fi

SOURCE_BRANCH=$(git branch --show-current)
TARGET_BRANCH="deploy-${ENV}"

if [[ "$SOURCE_BRANCH" != "master" ]]; then
  echo "Switch to 'master' before running a deploy (currently on '${SOURCE_BRANCH}')."
  exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
  echo "Commit or stash uncommitted changes on 'master' before deploying."
  exit 1
fi

# Use an isolated temporary index so 'master' and your working files are never touched
TMP_INDEX="$(git rev-parse --git-dir)/index.deploy.$$"
rm -f "$TMP_INDEX"
trap 'rm -f "$TMP_INDEX"' EXIT

# Run 'build-dev' or 'build' directly in your working directory
npm run "${BUILD_CMD}"

# Uncomment these if your Webpack config does not run them during build:
# npm run build-css
# npm run update-changelog

# Restore any tracked static files inside dist/ if 'clean-dist' deleted them
git checkout -- dist 2>/dev/null || true

# Populate the temporary index from HEAD and stage dist/ + ignored build outputs
GIT_INDEX_FILE="$TMP_INDEX" git read-tree HEAD
GIT_INDEX_FILE="$TMP_INDEX" git add dist
[[ -d dist/htdocs/js ]] && GIT_INDEX_FILE="$TMP_INDEX" git add -f dist/htdocs/js
[[ -d dist/htdocs/css ]] && GIT_INDEX_FILE="$TMP_INDEX" git add -f dist/htdocs/css
[[ -f dist/htdocs/index.php ]] && GIT_INDEX_FILE="$TMP_INDEX" git add -f dist/htdocs/index.php
[[ -f dist/htdocs/CHANGELOG.md ]] && GIT_INDEX_FILE="$TMP_INDEX" git add -f dist/htdocs/CHANGELOG.md
[[ -f dist/htdocs/api/classes/testing.php ]] && GIT_INDEX_FILE="$TMP_INDEX" git add -f dist/htdocs/api/classes/testing.php

# Build a standalone commit whose root directory is the contents of dist/
SHORT_SHA=$(git rev-parse --short HEAD)
DIST_TREE=$(GIT_INDEX_FILE="$TMP_INDEX" git write-tree --prefix=dist/)
DEPLOY_COMMIT=$(git commit-tree "$DIST_TREE" -m "Deploy ${ENV} build from master (${SHORT_SHA})")

# Force-push the dist-rooted commit to internal GitLab
git push -f origin "${DEPLOY_COMMIT}:refs/heads/${TARGET_BRANCH}"

echo "Successfully pushed dist/ root to ${TARGET_BRANCH} on internal GitLab."