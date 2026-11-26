# Pickup & Component Transplant Guide (`PICKUP_GUIDE.md`)

> **Mental Model — Donor / Spare-Parts Repository**
> Treat this repository like a **spare car in a workshop**. You can either clone the entire frame as a starting point, **or** strip out individual self-contained modules (e.g., only the `DataPane`, only the `SubSidebar`, or a future `Workbench` tool) and transplant them into an existing React application or an older version of this template—without rebuilding from scratch.

---

## 1. Zero-Bloat Stack

- **Framework**: React 19 + Vite 6 (standard JSX, no TypeScript lock-in).
- **Dependencies**: **Zero third-party UI, icon, table, or charting libraries.** Everything (icons, drag-and-drop pivot builder, SVG charts, PNG/CSV export, modals, splitters) is pure React + CSS custom properties.
- **CSS Scoping**: Each major module uses its own CSS prefix and stylesheet so you can copy styles cleanly without selector collisions:
  - `src/styles/tokens.css` — Design tokens (typography, colors, spacing).
  - `src/styles/app.css` — Shell (`.app-*`, `.side-rail`, `.sub-sidebar-*`) and Directory (`.dir-*`).
  - `src/styles/landing.css` — Landing page (`.landing-*`).
  - `src/styles/datapane.css` — Data Pane workbench (`.dp-*`).

---

## 2. Parts Catalog (Strip & Transplant Matrix)

| Part / Module | What It Gives You | Files to Copy | Styles to Copy | External Coupling |
| --- | --- | --- | --- | --- |
| **A. App Shell & Header** | `44px` charcoal header, brand slot, 2-line site identity, interactive 5-role user pill | `src/components/Header.jsx`<br>`src/components/Icons.jsx`<br>`src/data/roles.js` | `src/styles/tokens.css`<br>`.app-header`, `.user-*`, `.role-*` in `app.css` | None |
| **B. Slim Side Rail + Choreographed Sub-Sidebar** | `52px` left rail (`All`, `Dir`, `Ind`, `Out` + bottom `Cons`, `Vers`, `Help`), dynamic trapezium pull-tab, 3 filled mode tabs (`Data` / `Analytics` / `Workbench`), 2-level rounded-string tree | `src/components/SideRail.jsx`<br>`src/components/SubSidebar.jsx`<br>`src/components/Icons.jsx`<br>`src/data/catalog.js` | `.side-rail`, `.rail-*`, `.sub-sidebar-*`, `.sub-group*`, `.sub-child*` in `app.css` | Controlled via props from parent (`App.jsx`) |
| **C. Landing Page (`All`)** | Full-bleed fixed-height hero carousel with timer, team pill selector (`Dir`/`Ind`/`Out`), uniform-height scrollable 3-pillar trees, scrollable `What's New` feed | `src/components/HomeLanding.jsx`<br>`src/data/landing.js`<br>`public/hero-*.jpg` | `src/styles/landing.css`<br>`.sub-group*` & `.sub-child*` from `app.css` | Calls `onNavigateTarget({ navId, modeId, groupId, itemId })` |
| **D. Product Catalog Directory** | Searchable `Cards` / `List` catalog for any `(Team, Mode)` view | `src/components/ModeProductDirectory.jsx` | `.dir-*` in `app.css` | Reads `PRODUCT_CATALOG` + calls `onSelectProduct(groupId, itemId)` |
| **E. Data Pane (BigQuery Workbench)** | Schema-driven sortable table, type-aware multi-select/range `+ Filter` builder, full-height resizable/collapsible 4-zone Pivot Fields (`Filters`, `Rows`, `Columns`, `Values`), Pivot Output (`Copy` TSV, `CSV`, Popup), Pivot Chart (`Bar`/`H-Bar`/`Line`/`Donut`, `Copy`, `PNG`, Popup) | `src/components/DataPane/DataPane.jsx`<br>`src/components/DataPane/DataTable.jsx`<br>`src/components/DataPane/PivotBuilder.jsx`<br>`src/components/DataPane/PivotOutput.jsx`<br>`src/components/DataPane/PivotChart.jsx`<br>`src/utils/pivot.js` | `src/styles/datapane.css`<br>`:root` vars from `tokens.css` | **100% self-contained** — pass a single `dataset` prop |
| **F. Future Modules (Analytics / Workbench Tools)** | Reserved workspace slots in `App.jsx` (`activeMode === 'analytics'` and `activeMode === 'prep'`) | Create `src/components/AnalyticsPane/` or `src/components/WorkbenchPane/` | Dedicated `src/styles/analytics.css` or `workbench.css` | Plug into the `App.jsx` render switch |

---

## 3. Backend Integration Contracts

### 3.1 Connecting `<DataPane dataset={...} />` to GCP / BigQuery

`<DataPane />` is **completely table-agnostic**. Any BigQuery query response mapped to the shape below automatically receives search, multi-select/numeric-range/date-range filters, sorting, 4-zone drag-and-drop pivots, TSV/CSV export, and 4 interactive chart types:

```js
const dataset = {
  id: 'unique-product-or-table-id',
  name: 'Display Title',
  gcpTable: 'project-id.dataset_name.table_name',
  columns: [
    // type: 'string' -> multi-select checkbox filter
    // type: 'date'   -> From/To date range filter (YYYY-MM-DD)
    // type: 'number' -> Min/Max numeric range filter (format: 'integer' | 'currency')
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'model', label: 'Model', type: 'string' },
    { key: 'searches', label: 'Searches', type: 'number', format: 'integer' },
    { key: 'revenue', label: 'Revenue ($)', type: 'number', format: 'currency' },
  ],
  rows: [
    { date: '2026-01-12', model: 'iPhone 16 Pro', searches: 48200, revenue: 3405160 },
  ],
  defaultPivot: {
    rowField: 'model',       // column key or null
    colField: null,          // optional cross-tab column key or null
    valueField: 'searches',  // numeric column key
    agg: 'SUM',              // 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN'
  },
};
```

> **Tip for AI Agents**: Replace `getDatasetForProduct(...)` in `src/data/datasets.js` with your API fetch hook (e.g., `useQuery` / `fetch('/api/bigquery?table=...')`) returning this exact object. No changes are needed inside `src/components/DataPane/*` or `src/utils/pivot.js`.

### 3.2 Connecting Auth & Roles

- Roles are defined in `src/data/roles.js` (`super-admin`, `all`, `dummy-1`, `dummy-2`, `dummy-3`).
- In `App.jsx`, replace `useState(DEFAULT_ASSIGNED_ROLES)` with your auth provider's user profile & role list.
- `isSuperAdmin = assignedRoles.includes('super-admin')` automatically gates the bottom `Cons` (Super Admin Console & User Tracking) rail icon.

### 3.3 Connecting Product Hierarchy (`PRODUCT_CATALOG`)

- `src/data/catalog.js` defines the 4-level hierarchy: `Rail Category (Dir/Ind/Out)` → `Mode (data/analytics/prep)` → `Product Group` → `Items`.
- Both `SubSidebar`, `HomeLanding`, and `ModeProductDirectory` read directly from `PRODUCT_CATALOG`—updating it once updates the entire app.

---

## 4. Recipes for Another AI Picking Up This Repo

### Recipe 1: Transplant **ONLY** the Data Pane into an Existing React App
1. Copy `src/components/DataPane/*`, `src/utils/pivot.js`, and `src/styles/datapane.css`.
2. Ensure your app defines (or copies from `src/styles/tokens.css`) these CSS variables:
   `--font-heading`, `--font-body`, `--color-accent`, `--color-accent-hover`, `--color-accent-soft`, `--color-canvas-bg`, `--color-surface-bg`, `--color-surface-border`, `--color-text-primary`, `--color-text-secondary`, `--color-rail-hover`, `--radius-sm`, `--radius-md`, `--transition-fast`.
3. Import `datapane.css` and render `<DataPane dataset={yourDataset} />` inside a flex container with a defined height (for viewport-locked BigQuery splitting).

### Recipe 2: Upgrade an Older Template Version with a Newly Added Tool (e.g. Workbench)
1. Copy only the new tool's folder (e.g., `src/components/WorkbenchPane/*`) and its scoped stylesheet (`src/styles/workbench.css`).
2. Import the stylesheet in `src/main.jsx`.
3. In `src/App.jsx`, add the render branch for `activeMode === 'prep'` (replacing the `<section className="workspace-frame">` placeholder) without touching your existing `Header`, `SideRail`, `SubSidebar`, or `DataPane`.

### Recipe 3: Rebrand from Dummy Apple (`iSearch`) to Your Real Brand
1. **Header logo & titles**: `src/components/Header.jsx` (`AppleLogoIcon`, `iSearch`, `Search Portal`) and `index.html` (`<title>`).
2. **Colors & typography**: `src/styles/tokens.css` (defaults to `Futura` / `Jost` headings + `Helvetica` body).
3. **Icons**: Keep all icons in `src/components/Icons.jsx` in the **filled** SVG style for visual consistency.
4. **Rail labels & product tree**: `src/components/SideRail.jsx`, `src/data/catalog.js`, and `src/data/landing.js`.
