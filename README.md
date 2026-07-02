# Luminair UI - CMS Admin Console

Luminair UI is the frontend administration panel for the Luminair Schema-Driven CMS. It is built as a React + TypeScript application powered by Vite, designed to dynamically discover schema layouts from the backend and provide a seamless, premium content editing experience.

---

## Tech Stack & Architecture

- **Core**: React 19, TypeScript
- **Build System**: Vite
- **Styling**: Tailwind CSS + Shadcn/ui (Radix Primitives)
- **Routing**: React Router v7
- **Data Fetching & Cache**: TanStack Query (React Query)
- **State Management**: Zustand (for UI states, selected locales)

### Core Architectural Principle: Schema-Driven Rendering
Luminair UI does not hardcode forms for collections. Instead:
1. It queries the backend schemas endpoint to retrieve registered `DocumentType` configurations.
2. It dynamically builds list tables, pagination controls, search/sort filters, and creation/editing forms based on the fields, constraints, and relations defined in the retrieved schemas.

---

## Implementation Plan

### Phase 1: Project Setup & Shell Layout
* **Vite & TS Initialization**: Scaffold the React project with TypeScript, ESLint, Prettier, and Tailwind CSS.
* **Global Navigation**: Create a sidebar showing the schema-driven content types (Collections and Single Types) and setting pages.
* **Theme System**: Configure a premium dark-mode-first aesthetic with smooth micro-animations.

### Phase 2: Schema Discovery & Navigation
* **API Integration**: Create client services utilizing React Query to call `/api/schema` to discover all registered document types.
* **Dynamic Sidebar**: Populate navigation items dynamically for each collection (e.g., *Restaurants*, *Categories*, *Articles*).

### Phase 3: Dynamic Data Table (List Views)
* **API Querying**: Implement lists that call `GET /api/documents/:pluralApiId`.
* **Pagination, Sort, and Filter UI**:
  * Parse query options and render Strapi-style column sorts and filters (e.g., filter by locale `description.en`, filter by status).
* **Column Rendering**: Dynamically map schema fields (e.g., boolean values rendered as badges, image URLs rendered as micro-thumbnails).

### Phase 4: Dynamic Form Builder (Create & Edit)
* **Form Engine**: Utilize React Hook Form with Zod schemas generated dynamically from field metadata.
* **Component Mapping**:
  * `Text` / `Uid` / `Email` / `Url` / `Uuid` → Text inputs.
  * `Integer` / `Decimal` → Numeric inputs.
  * `Boolean` → Toggle switches.
  * `Date` / `DateTime` → Calendar / Date-Time pickers.
  * `Json` → JSON Editor / Code editor widget.
* **Validation Handler**: Apply schema constraints (min/max length, regex predicates, email validations) clientside before payload submission.
* **Standard Payload Wrapping**: Wrap creation and update payloads inside the canonical `"data"` node.

### Phase 5: Field-Level Localization (i18n)
* **Locale Switcher**: Offer locale-specific editing tabs for fields declared with `LocalizedText`.
* **Multi-Language Forms**: Render multi-lingual sub-inputs side-by-side or inside locale tab views to easily populate JSONB translation objects.

### Phase 6: Relation Management
* **Lookup & Search**: Implement search-as-you-type inputs to look up target relation document items.
* **Connect/Disconnect Payload Engine**: Maintain relation arrays and submit `connect` and `disconnect` payloads on document creation and update.

### Phase 7: Draft & Publish Actions
* **Status Badges**: Display clean badges representing document statuses (`DRAFT`, `PUBLISHED`, `MODIFIED`).
* **Publish Controls**: Implement a single-click "Publish" button triggering `POST /api/documents/:pluralApiId/:id/publish`.

---

## Directory Structure

```
luminair-ui/
├── public/
├── src/
│   ├── api/             # React Query hooks and Axios fetchers
│   ├── components/      # Common UI components (buttons, inputs, tables, modals)
│   ├── features/        # Feature modules
│   │   ├── content/     # Dynamic Content lists and forms
│   │   ├── schemas/     # Schema builder/visualizer
│   │   └── settings/    # CMS configuration
│   ├── hooks/           # Custom utility hooks
│   ├── layout/          # Dashboard Shell & sidebar navigation
│   ├── theme/           # Design system configuration
│   ├── App.tsx          # Main entry point and router definitions
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## Getting Started

To run the developer server locally during implementation:
```bash
npm install
npm run dev
```
