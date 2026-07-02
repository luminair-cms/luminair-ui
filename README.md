# Luminair UI - CMS Admin Console

Luminair UI is the frontend administration panel for the Luminair Schema-Driven CMS. It is built as a React + TypeScript application powered by Vite, designed to dynamically discover schema layouts from the backend and provide a seamless, premium content editing experience.

---

## Tech Stack & Architecture

- **Core**: React 19, TypeScript
- **Build System**: Vite
- **UI Library**: Ant Design (v6.5.0 or above)
- **Routing**: React Router v7
- **Data Fetching & Cache**: TanStack Query (React Query)
- **State Management**: Zustand (for UI states, selected locales)

### Core Architectural Principle: Schema-Driven Rendering
Luminair UI does not hardcode forms for collections. Instead:
1. It queries the backend schemas endpoint to retrieve registered `DocumentType` configurations.
2. It dynamically builds list tables, pagination controls, search/sort filters, and creation/editing forms based on the fields, constraints, and relations defined in the retrieved schemas using Ant Design's configurable components.

---

## Implementation Plan

### Phase 1: Project Setup & Shell Layout
* **Vite & TS Initialization**: Scaffold the React project with TypeScript, ESLint, Prettier, and Ant Design (`antd` v6.5.0+).
* **Global Navigation**: Create a sidebar shell using Ant Design's `Layout` and `Menu` components to display the schema-driven content types (Collections and Single Types) and settings pages.
* **Theme System**: Configure Ant Design's Design Token system (`ConfigProvider`) to set up a premium dark-mode-first aesthetic with custom primary colors.

### Phase 2: Schema Discovery & Navigation
* **API Integration**: Create client services utilizing React Query to call `/api/schema` to discover all registered document types.
* **Dynamic Sidebar**: Populate `Menu` items dynamically for each collection (e.g., *Restaurants*, *Categories*, *Articles*).

### Phase 3: Dynamic Data Table (List Views)
* **API Querying**: Implement lists that call `GET /api/documents/:pluralApiId`.
* **Ant Design Table**: Use the `Table` component to render dynamic rows and columns.
* **Pagination, Sort, and Filter UI**:
  * Parse query options and connect them directly to Ant Design Table filters and sorting handlers (e.g., filter by locale `description.en`, filter by status).
* **Column Rendering**: Dynamically map schema fields to Ant Design cell elements (e.g., boolean values rendered using `Badge` or `Tag`, image URLs rendered as `Image` preview widgets).

### Phase 4: Dynamic Form Builder (Create & Edit)
* **Ant Design Form Engine**: Utilize Ant Design's `Form` component. Map field-level validation constraints (min/max length, regex, required fields) directly to Form `rules`.
* **Component Mapping**:
  * `Text` / `Uid` / `Email` / `Url` / `Uuid` → `Input`.
  * `Integer` / `Decimal` → `InputNumber`.
  * `Boolean` → `Switch`.
  * `Date` / `DateTime` → `DatePicker`.
  * `Json` → JSON Editor / Code editor widget.
* **Standard Payload Wrapping**: Wrap creation and update payloads inside the canonical `"data"` node before submitting.

### Phase 5: Field-Level Localization (i18n)
* **Locale Tabs Switcher**: Use Ant Design's `Tabs` component to offer locale-specific tabs for fields declared with `LocalizedText`.
* **Multi-Language Forms**: Render multi-lingual sub-inputs side-by-side or inside tab views to easily populate JSONB translation objects.

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
