#!/usr/bin/env bash
# setup-github-project.sh
# Creates the Synap product roadmap GitHub Projects board (Now / Next / Later / Done)
# Prerequisites: gh CLI authenticated — run `gh auth login` first
# Usage: bash scripts/setup-github-project.sh

set -euo pipefail

REPO="preet2fun/itsm-cloudnative-demo-app"
PROJECT_TITLE="Synap Roadmap"

echo "Creating GitHub Project: $PROJECT_TITLE"
PROJECT_URL=$(gh project create --owner preet2fun --title "$PROJECT_TITLE" --format json | jq -r '.url')
echo "Project created: $PROJECT_URL"

PROJECT_NUMBER=$(echo "$PROJECT_URL" | grep -oE '[0-9]+$')

echo "Adding custom fields..."
# Status field with Now / Next / Later / Done options
gh project field-create "$PROJECT_NUMBER" \
  --owner preet2fun \
  --name "Stage" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "Now,Next,Later,Done"

# Type field
gh project field-create "$PROJECT_NUMBER" \
  --owner preet2fun \
  --name "Type" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "Phase,Sprint,Bug,Chore,Docs"

# Layer field (for sprint work)
gh project field-create "$PROJECT_NUMBER" \
  --owner preet2fun \
  --name "Layer" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "UI,Backend,Infra,E2E,All"

echo ""
echo "Done. Open the board at: $PROJECT_URL"
echo ""
echo "Next steps:"
echo "  1. Open $PROJECT_URL"
echo "  2. Switch to Board layout and group by 'Stage'"
echo "  3. Create issues for each ROADMAP.md item and add them to the project"
echo "  4. Use 'gh issue create --label roadmap' to add new roadmap items"
