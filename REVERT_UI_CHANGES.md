# Reverting UI Improvements

This repository includes a pair of scripts to revert the UI changes made in the most recent UI improvement patch.

Files modified by the patch:
- components/ui/alert.tsx
- components/shared/WarningBanner.tsx
- components/layout/Footer.tsx
- components/shared/CalculationCard.tsx

Revert options:

- Quick (if not committed):
  - Bash: `./scripts/revert-ui-changes.sh`
  - PowerShell: `./scripts/revert-ui-changes.ps1`

- If changes were committed:
  - Use `git log --oneline` to find the commit and then `git revert <commit>` or create a PR that reverts the commit.

Notes:
- The scripts assume you are in a git working tree. They use `git checkout -- <file>` to restore the files from HEAD.
- If you need the original content as a patch, request it and I can export the original versions into a patch file or copy them to `revert-originals/`.
