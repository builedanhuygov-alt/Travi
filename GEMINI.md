# Travi — Repository Development Rules & Toolchain Guidelines

## 1. Node.js & Dependency Discipline
- **Toolchain**: Use the verified active Node.js LTS toolchain (`node v24.22.1`, `npm 11.19.1`).
- **No Repeated Installations**: Do NOT reinstall dependencies (`npm install` / `npm ci`) on every task. Dependencies in `node_modules` are clean, pinned, and verified.
- **Inspect First**: Before proposing or adding packages, always inspect `package.json` and `package-lock.json`.
- **Prefer Existing Utilities**: Always reuse existing libraries, components, and helper utilities already installed in the repository (e.g. `lucide-react`, `framer-motion`, `oxlint`, `vitest`, `firebase`).
- **Conditional Installation Only**: Execute `npm ci` or package installation ONLY when required by an explicit dependency/lockfile change, or when `node_modules` is missing or demonstrably broken.
- **Avoid Repeated npx Downloads**: Avoid repeated `npx` executions without clear reason. Never execute unverified packages or repeatedly download transient tools that should be pinned locally in `devDependencies`.
- **Authoritative Lockfile**: Preserve `package-lock.json`. Do not delete lockfiles or alter them without clear justification.
- **Scope Discipline**: Do NOT modify global agent settings, global user configuration, or unrelated projects.

## 2. Quality Gates
Before declaring any task complete, verify:
1. `npm run lint` (`oxlint`) — 0 warnings, 0 errors.
2. `npm run test` (`vitest run`) — all automated test suites pass.
3. `npm run build` (`tsc -b && vite build`) — clean production bundle.
