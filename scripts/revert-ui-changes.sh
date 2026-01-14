#!/usr/bin/env bash
set -e

# Revert UI changes made by the last UI improvement patch.
# Usage: ./scripts/revert-ui-changes.sh

FILES=(
  "components/ui/alert.tsx"
  "components/shared/WarningBanner.tsx"
  "components/layout/Footer.tsx"
  "components/shared/CalculationCard.tsx"
)

if [ -z "$(git rev-parse --is-inside-work-tree 2>/dev/null)" ]; then
  echo "Not a git repository. Manual revert required."
  exit 1
fi

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    git checkout -- "$f"
    echo "Reverted $f"
  else
    echo "File not found: $f"
  fi
done

echo "Revert complete. If changes were already committed, use 'git revert' on the commit or restore from your branch."