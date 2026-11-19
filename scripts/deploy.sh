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

# Reset or create the target deploy branch from the current 'master' commit
git checkout -B "${TARGET_BRANCH}"

# Run the matching package.json build script ('build-dev' or 'build')
npm run "${BUILD_CMD}"

# Uncomment these if your Webpack config doesn't already run them during build:
# npm run build-css
# npm run update-changelog

# Force-stage dist/ despite being listed in .gitignore
git add -f dist

# Unstage internal config and test files so they are never committed
git rm -rf --cached --ignore-unmatch \
  dist/etc \
  'dist/**/*.test.*' \
  'dist/**/*.spec.*' \
  'dist/htdocs/api/classes/testing.php' \

git commit -m "Deploy ${ENV} build from master ($(git rev-parse --short HEAD))"

# Force-push the updated deploy branch to internal GitLab
git push -f origin "${TARGET_BRANCH}"

# Switch back to master
git checkout master
echo "Successfully pushed ${TARGET_BRANCH} to internal GitLab."