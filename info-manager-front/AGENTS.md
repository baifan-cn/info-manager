# Repository Guidelines

## Project Structure & Module Organization
The Vue 3 application lives inside `src/`. Entry point `src/main.ts` mounts `App.vue`, while reusable UI elements go in `src/components/`. Shared styling sits in `src/style.css` and static assets belong in `src/assets/`. Publicly served files such as favicons remain in `public/`. Build settings are driven by `vite.config.ts` plus the TypeScript configs (`tsconfig*.json`); adjust those rather than inlining configuration. Page layouts should leverage the TDesign Vue component library to keep interactions and visuals consistent.

## Build, Test, and Development Commands
Run `npm install` once to hydrate dependencies from `package.json`. Use `npm run dev` for a Vite development server with hot-module replacement. Ship-ready bundles come from `npm run build`, which executes `vue-tsc -b` for type checks before `vite build`. Review the production bundle locally with `npm run preview`, serving the output of `dist/`. When integrating with backend services, confirm endpoints against the FastAPI auto-generated docs at `http://0.0.0.0:8000/docs`. When adding new commands, document them here and in `package.json` scripts.

## Coding Style & Naming Conventions
Components use `<script setup lang="ts">` with TypeScript; favor strongly typed props and `ref` for reactive state. Always author features with the Vue 3 Composition API to keep logic modular and explicit. Follow the existing two-space indentation in templates, scripts, and styles. Component files are PascalCase (e.g., `HelloWorld.vue`), composables should be camelCase, and assets should use kebab-case filenames. Keep global styles minimal in `src/style.css`; prefer scoped styles inside components to limit bleed-through. Apply vetted best practices from Vue and TDesign documentation before merging changes.

## Testing Guidelines
Automated testing is not yet configured. Add Vitest or Cypress when introducing significant features, colocating spec files alongside components (`ComponentName.spec.ts`). Ensure new tests run through `npm run test` (add the script when you introduce the tooling) and aim for meaningful coverage on user flows. Until a harness exists, manually validate interactive components in `npm run dev` and describe those checks in pull requests.

## Commit & Pull Request Guidelines
Recent history follows a conventional-commit flavor (`feat:`, `docs:`) with concise, sentence-case descriptions; continue that pattern. Reference related issues in the body and keep commits scoped to a single concern. Pull requests should explain the change, outline testing performed, and provide screenshots or screen recordings for UI updates. Request review once CI (if configured) passes and ensure documentation stays synchronized with code changes.
