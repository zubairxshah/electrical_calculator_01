# Revert-UI-Changes.ps1
# Revert UI changes introduced by the recent UI patch.
# Usage: ./scripts/revert-ui-changes.ps1

$files = @(
  'components\ui\alert.tsx',
  'components\shared\WarningBanner.tsx',
  'components\layout\Footer.tsx',
  'components\shared\CalculationCard.tsx'
)

if (-not (Test-Path .git)) {
  Write-Error "Not a git repository. Manual revert required."
  exit 1
}

foreach ($f in $files) {
  if (Test-Path $f) {
    git checkout -- $f | Out-Null
    Write-Host "Reverted $f"
  } else {
    Write-Host "File not found: $f"
  }
}

Write-Host "Revert complete. If changes were committed, use 'git revert <commit>' or restore from a branch."