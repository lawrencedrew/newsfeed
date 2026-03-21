# Engineering Standards

## Languages & Frameworks
- **Node.js (v20+)**: Main runtime.
- **Express**: SSE and static file server.
- **Node:test**: Built-in test runner.
- **ESLint**: Linter (using current `eslint.config.js`).

## Rules & Patterns
- **Gated Development**: Every milestone must include passing unit/integration tests and zero lint errors.
- **Explicit Git Hygiene**:
  - Stage files individually (`git add [path]`).
  - Use conventional commits.
  - No unrelated or "incidental" changes in the same commit.
- **Modularity**: Small, single-responsibility modules. Keep logic separate from presentation.
- **TUI Focus**: Favor terminal-appropriate logic and minimalistic web presentation.
