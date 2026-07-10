# Project rules for AI agents (Luminair UI)

This file is the single source of truth for all AI agents working in the `luminair-ui` repository. It defines coding guidelines, architectural patterns, and conventions to maintain code quality, consistency, and performance.

---

## Core Principles

1. **Schema-Driven Design**: The application UI is discovered dynamically from backend schemas. Hardcoding form layouts, fields, or static routes for collections is prohibited. Everything must adapt to metadata resolved from `/api/meta/documents`.
2. **Strict Type Safety**: Write strict TypeScript without using `any`. Utilize compiler constraints and explicit declarations.
3. **Decoupled States**: Enforce clear boundaries between server state (TanStack Query) and local UI states (Zustand or local components).
4. **Vanilla CSS & Design Tokens**: Style elements using Ant Design's Design Token system (`ConfigProvider`) and clean vanilla CSS. TailwindCSS is excluded.

---

## React & TypeScript Guidelines

### 1. Modern React 19 Practices
* **No Default React Imports**: Do not include `import React from 'react';` just to use JSX. It is obsolete under the modern JSX transform.
* **Component Annotations**: Use the `FC` type imported directly from `'react'` (e.g., `import { FC } from 'react';`) instead of `React.FC`.
* **State Hook Injections**: Always destructure hooks properly (e.g. `const [state, setState] = useState()`).
* **Avoid Fragile Panics**: Handle runtime values safely. Avoid direct property access on potentially undefined payloads; use optional chaining (`?.`) or fallback defaults.

### 2. TypeScript Rules
* **No Opaque Types**: Do not bypass compilation checks with `any`. Create explicit interfaces for all API payloads and response structures.
* **Path Aliases**: Import project modules using the `@/` path alias mapped to `src/` (configured in `tsconfig.app.json` and `vite.config.ts`) instead of deeply nested relative paths (`../../../../components`).
* **Strict compiler constraints**: Strictly follow TypeScript 7 guidelines (e.g., no deprecated `baseUrl` in compiler options, strict null checks, and resolved module types).

---

## Architectural & Project Layout Rules

We follow a modular layout designed to scale. Refer to [Project Layout Best Practices](../documentation/project-layout-best-practices.md) for full descriptions.

### 1. Boundaries & Layer Rules
* **`src/components/`**: Decoupled, reusable UI widgets. They must have **no business logic**, make no API calls, and depend purely on passed `props`.
* **`src/features/`**: Business domain feature blocks (e.g., `content`, `schemas`, `settings`). Colocate hooks, styles, types, and sub-components inside their feature folders.
  * **Rule**: Other modules can only import from a feature through its public root API (`features/[feature_name]/index.ts`). Importing directly from internal files of sibling features is forbidden.
* **`src/pages/`**: Thin route entrypoints. A page simply retrieves route parameters, wraps the layout, and composes feature components.
* **`src/api/` & `src/store/`**: Global query endpoints and UI state management.

### 2. State Management Architecture
* **Server State**: Managed exclusively by **TanStack Query** (React Query). Never copy server response data into Zustand stores or local state; read it directly from the query hooks to keep the cache consistent.
* **Global UI State**: Managed using **Zustand** (e.g. sidebar collapse toggle, locale selection, active theme). Keep stores single-purpose rather than monolithic.
* **Form State**: Managed using **Ant Design Form's built-in store** to localise validations and field dependencies efficiently.

---

## Code Formatting & Style

### 1. Formatting
* Before committing, format code with Prettier:
  ```bash
  pnpm dlx prettier --write src/
  ```
* Standard formatting options defined in `.prettierrc`:
  - Double quotes to single quotes.
  - Semicolons required.
  - Trailing commas enabled (`all`).

### 2. Linting
* Validate code using **Oxlint**:
  ```bash
  pnpm lint
  ```
  Ensure all warnings and errors are resolved before declaring a task complete.

### 3. Dependency Management
* All project additions must utilize **pnpm** package management.
* Dependencies inside `package.json` must be sorted alphabetically.
* Shared version patterns must align with backend conventions (e.g., React `19.x`, TS `7.0.x`, Vite `8.x`).
