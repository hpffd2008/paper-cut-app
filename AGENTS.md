# AGENTS.md

## Project rules
- This repository is a front-end web app exported from YouWare and continued in VS Code.
- Preserve the existing app architecture unless a task explicitly requires refactoring.
- Do not modify already-completed features unless the current task strictly depends on them:
  - API image generation for papercut works
  - Community likes
  - Community category filtering

## Task execution rules
- Work only on the task(s) explicitly assigned in the prompt.
- Prefer minimal local changes over broad refactors.
- Do not add new dependencies unless explicitly required.
- Do not change package manager setup or lockfiles.

## Validation rules
- After changes, run the existing verification commands if available.
- Report:
  1. files changed
  2. what changed in each file
  3. how the acceptance criteria were checked
  4. remaining risks
