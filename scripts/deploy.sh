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

# Always return cleanly to 'master' and remove the temp branch on exit or build error
cleanup() {
  if [[ "$(git branch --show-current)" != "master" ]]; then
    git checkout -f master >/dev/null 2>&1 || true
  fi
  git branch -D _deploy_tmp >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Build on a temporary branch from current 'master'
git checkout -B _deploy_tmp

npm run "${BUILD_CMD}"

# Uncomment these if your Webpack config does not run them during build:
# npm run build-css
# npm run update-changelog

# Restore any tracked static files inside dist/ if 'clean-dist' deleted them
git checkout -- dist 2>/dev/null || true

# Stage any modified non-ignored files in dist/
git add dist

# Force-stage the ignored compiled frontend outputs
[[ -d dist/htdocs/js ]] && git add -f dist/htdocs/js
[[ -d dist/htdocs/css ]] && git add -f dist/htdocs/css
[[ -f dist/htdocs/index.php ]] && git add -f dist/htdocs/index.php
[[ -f dist/htdocs/CHANGELOG.md ]] && git add -f dist/htdocs/CHANGELOG.md
[[ -f dist/htdocs/api/classes/testing.php ]] && git add -f dist/htdocs/api/classes/testing.php

git commit -m "Temporary build commit"

# Create a standalone commit whose root directory is the contents of dist/
SHORT_SHA=$(git rev-parse --short master)
DEPLOY_COMMIT=$(git commit-tree "HEAD:dist" -m "Deploy ${ENV} build from master (${SHORT_SHA})")

# Force-push the dist-rooted commit to internal GitLab
git push -f origin "${DEPLOY_COMMIT}:refs/heads/${TARGET_BRANCH}"

# Switch back to master and clean up _deploy_tmp
git checkout -f master
git branch -D _deploy_tmp
echo "Successfully pushed dist/ root to ${TARGET_BRANCH} on internal GitLab."