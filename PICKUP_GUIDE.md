# Pickup & Component Transplant Guide (`PICKUP_GUIDE.md`)

> **Mental Model — Donor / Spare-Parts Repository**
> Treat this repository like a **spare car in a workshop**. You can either clone the entire frame as a starting point, **or** strip out individual self-contained modules (e.g., only the `DataPane`, only the `SubSidebar`, or only the `DmcWorkbench`) and transplant them into an existing React application—without rebuilding from scratch.

---

## 1. Zero-Bloat Stack & Design Rules

- **Framework**: React 19 + Vite 6 (standard JSX, no TypeScript lock-in).
- **Dependencies**: **Zero third-party UI, icon, table, or charting libraries.** Everything (icons, drag-and-drop pivot builder, drag-and-drop plant explosion, SVG charts, PNG/CSV/XML export, modals, splitters) is pure React + CSS custom properties.
- **No AI Inside the App**: All parsing, column mapping, grain detection, SAP rule validation, and XML generation are **100% deterministic client-side JS**. Do not introduce LLM/AI inference inside the runtime app.
- **Icon Style**: All icons in `src/components/Icons.jsx` and inline SVGs use **filled** monochrome shapes (no outline/stroke icons).
- **CSS Scoping**: Each major module uses its own CSS prefix and stylesheet so you can copy styles cleanly without selector collisions:
  - `src/styles/tokens.css` — Design tokens (Futura headings, Helvetica body, `#1D1D1F` charcoal, `#0071E3` Apple Blue, `#F5F5F7` canvas).
  - `src/styles/app.css` — Shell (`.app-*`, `.side-rail`, `.sub-sidebar-*`) and Directory (`.dir-*`).
  - `src/styles/landing.css` — Landing page (`.landing-*`).
  - `src/styles/datapane.css` — Data Pane workbench (`.dp-*`).
  - `src/styles/dmc.css` — SAP DMC Template Workbench (`.dmc-*`).

---

## 2. Parts Catalog (Strip & Transplant Matrix)

| Part / Module | What It Gives You | Files to Copy | Styles to Copy | External Coupling |
| --- | --- | --- | --- | --- |
| **A. App Shell & Header** | `44px` charcoal header, brand slot, 2-line site identity, interactive 5-role user pill | `src/components/Header.jsx`<br>`src/components/Icons.jsx`<br>`src/data/roles.js` | `src/styles/tokens.css`<br>`.app-header`, `.user-*`, `.role-*` in `app.css` | None |
| **B. Slim Side Rail + Choreographed Sub-Sidebar** | `52px` left rail (`All`, `Dir`, `Ind`, `Out` + bottom `Cons`, `Vers`, `Help`), dynamic trapezium pull-tab, 4 filled mode tabs (`Dashboards` / `Data` / `Analytics` / `Workbench`) with hover labels, 2-level rounded-string tree | `src/components/SideRail.jsx`<br>`src/components/SubSidebar.jsx`<br>`src/components/Icons.jsx`<br>`src/data/catalog.js` | `.side-rail`, `.rail-*`, `.sub-sidebar-*`, `.sub-group*`, `.sub-child*` in `app.css` | Controlled via props from parent (`App.jsx`) |
| **C. Landing Page (`All`)** | Full-bleed fixed-height hero carousel with timer, team pill selector (`Dir`/`Ind`/`Out`), uniform-height scrollable 4-pillar trees, scrollable `What's New` feed | `src/components/HomeLanding.jsx`<br>`src/data/landing.js`<br>`public/hero-*.jpg` | `src/styles/landing.css`<br>`.sub-group*` & `.sub-child*` from `app.css` | Calls `onNavigateTarget({ navId, modeId, groupId, itemId })` |
| **D. Product Catalog Directory** | Searchable `Cards` / `List` catalog for any `(Team, Mode)` view | `src/components/ModeProductDirectory.jsx` | `.dir-*` in `app.css` | Reads `PRODUCT_CATALOG` + calls `onSelectProduct(groupId, itemId)` |
| **E. Data Pane (BigQuery Workbench)** | Schema-driven sortable table, type-aware multi-select/range `+ Filter` builder, full-height resizable/collapsible 4-zone Pivot Fields (`Filters`, `Rows`, `Columns`, `Values`), Pivot Output (`Copy` TSV, `CSV`, Popup), Pivot Chart (`Bar`/`H-Bar`/`Line`/`Donut`, `Copy`, `PNG`, Popup) | `src/components/DataPane/*`<br>`src/utils/pivot.js` | `src/styles/datapane.css`<br>`:root` vars from `tokens.css` | **100% self-contained** — pass a single `dataset` prop |
| **F. SAP DMC Template Workbench** | Linear 5-step sequential flow for **Material Master** and **PIR & Quota**, prominent Excel/CSV Grid Intake & Column Mapper, SAP Status Gantt (with 3-way PIR grain switcher & upstream Material prerequisite checks), centralized `SAP_DMC_FIELD_RULES` governance with strict forward blocking, column-level DB drag-down (`↓ All` / `↓ Empty`), targeted Select & Drag-and-Drop Plant Explosion, optional Valuation layer, and multi-sheet SAP SpreadsheetML `.xml` export | `src/components/DmcWorkbench/DmcWorkbench.jsx`<br>`src/components/DmcWorkbench/DmcGridIntake.jsx`<br>`src/components/DmcWorkbench/DmcGanttTable.jsx`<br>`src/components/DmcWorkbench/DmcXmlEditor.jsx`<br>`src/data/dmcData.js` | `src/styles/dmc.css`<br>`:root` vars from `tokens.css` | **100% self-contained** — pass `grain="material" \| "pir"` + optional `onSwitchGrain` |

---

## 3. Backend & Domain Integration Contracts

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

> **Tip for AI Agents**: Replace `getDatasetForProduct(...)` in `src/data/datasets.js` with your API fetch hook returning this exact object. No changes are needed inside `src/components/DataPane/*` or `src/utils/pivot.js`.

### 3.2 Connecting Auth & Roles

- Roles are defined in `src/data/roles.js` (`super-admin`, `all`, `dummy-1`, `dummy-2`, `dummy-3`).
- In `App.jsx`, replace `useState(DEFAULT_ASSIGNED_ROLES)` with your auth provider's user profile & role list.
- `isSuperAdmin = assignedRoles.includes('super-admin')` automatically gates the bottom `Cons` (Super Admin Console & User Tracking) rail icon.

### 3.3 Connecting Product Hierarchy (`PRODUCT_CATALOG`)

- `src/data/catalog.js` defines the 4-level hierarchy: `Rail Category (Dir/Ind/Out)` → `Mode (dashboards/data/analytics/prep)` → `Product Group` → `Items`.
- `SubSidebar`, `HomeLanding`, and `ModeProductDirectory` all read directly from `PRODUCT_CATALOG`.

---

### 3.4 SAP DMC Template Workbench — Architecture & Real XML Onboarding Playbook

Under `Dir → Workbench → SAP DMC Prep`, the workbench is split into two distinct sub-products:
- **Material Master** (`dir-prep-dmc-material` → `<DmcWorkbench grain="material" />`)
- **PIR & Quota** (`dir-prep-dmc-pir` → `<DmcWorkbench grain="pir" />`)

#### Linear 5-Step Sequential Flow (Full Canvas, No Bottom Drawer)
Users move strictly left-to-right through a unified loading-bar stepper at the top of the workspace:
- **Material Master**: `1. Intake & Gantt` → `2. Product Create (MARA)` → `3. Plant Ext Prep (MARC)` → `4. Class & Char (CLFMAS)` → `5. Done & Export`
- **PIR & Quota**: `1. Intake & Gantt` → `2. PIR Header (EINA/EINE)` → `3. Cond. & Scales (KONP/KONM)` → `4. Class & Quota` → `5. Done & Export`

#### Core Behavioral & Governance Rules (Do Not Break These!)
1. **Prominent Blank Intake First**: Stage 1 opens with `DmcGridIntake` expanded and blank (`records = []`) so users paste Excel/TSV rows, map the columns they know (including optional `REF_MATERIAL` and `TARGET_PLANT`), and click **`Check SAP & Load Gantt`**. Once checked, Intake collapses so the Gantt is clear to inspect before proceeding.
2. **Strict Forward Blocking (`SAP_DMC_FIELD_RULES`)**:
   - All mandatory fields, prep hints, and allowed SAP value lists live centrally in `SAP_DMC_FIELD_RULES` in `src/data/dmcData.js`.
   - `validateDmcOrder(order)` checks every row/condition against `checkFieldRule(...)` and returns `stepErrors` + `cellErrors`.
   - Future step pills (`🔒`) and **`Next →`** are **blocked** until all mandatory fields and allowed-value checks on the current stage pass. Failing cells highlight red (`.is-invalid`) with hover tooltips, and a **`Prepare Data · N Mandatory Rules`** toggle shows the configured rules for that stage.
3. **Feed-Forward Grain Deduplication & Expansion**:
   - **Material**: Step 2 (`MARA`) and Step 4 (`CLFMAS`) deduplicate to **1 row per unique Material** (edits sync across all exploded plants underneath). Step 3 (`MARC`) expands to `Material × Plant`.
   - **PIR**: Intake preserves all pasted child Condition Types & Scale Tiers (`detectPirIntakeGrain` auto-detects `pir` | `condType` | `scale`). The PIR Gantt includes a **3-way Grain Switcher** (`PIR` | `Cond. Type` | `Price / Scale`). Step 2 (`EINA/EINE`) and Step 4 (`Class & Quota`) roll up to **1 row per `Material × Vendor`**, while Step 3 (`KONP/KONM`) expands to all Condition Types & Scale Tiers.
4. **Targeted Plant Explosion (Select & Apply + Drag & Drop)**:
   - Because batches often split plants (e.g., 3 of 10 materials → Plants `1000, 2100`; 7 of 10 → Plants `3000, 4000`), Material Step 3 supports checking specific materials and clicking **`+ Add to N Selected`** / **`Set Plants for N Selected`**, **OR** dragging any plant chip (`⋮⋮ 2100`) directly onto a material row (dropping onto a checked row applies to all checked rows).
5. **Column-Level Wrangle + Intake-Locked Fields**:
   - Beneath every grid header, `ColumnWrangleControl` lets users pick DB-backed values (`getDbFieldOptions`) or custom-type, then click **`↓ All`** or **`↓ Empty`**. Never add silent blind auto-default shortcuts.
   - `PRODUCT_DESC` pasted at Grid Intake is locked with an `Intake` pill (with an explicit `Edit` button to unlock) so users don't accidentally overwrite pasted descriptions.
6. **Optional Valuation Layer (`MBEW`)**:
   - `order.includeValuation` defaults to `false`. `BKLAS`, `PRICE_CTRL`, and `STD_PRICE` are only shown, validated, and emitted in `Valuation_MBEW` when the user explicitly toggles **`Include Valuation (Optional)`**.
7. **PIR Upstream Material Prerequisites**:
   - Every PIR row cross-checks `SAP_MATERIAL_DB` (`getPirMaterialPrerequisite`). Missing base materials or unextended target plants surface in the **`0. Mat. Prereq`** Gantt column, a top warning banner with a 1-click **`Open Material Master →`** button, and Step 2 blocking validation.

#### How to Adapt This Workbench When Given a Real SAP DMC `.xml` Template
When the user provides an actual SAP S/4HANA Migration Cockpit SpreadsheetML `.xml` template (e.g., `Product` or `Purchasing Info Record`), follow these exact 4 steps:
1. **Parse the XML Worksheets & Technical Field Names**: Inspect each `<Worksheet ss:Name="...">` and its header rows (usually Row 4/5 = human label, Row 7/8 = SAP technical field key, mandatory markers `*`).
2. **Update `SAP_DMC_FIELD_RULES` & `MATERIAL_INTAKE_FIELDS` / `PIR_INTAKE_FIELDS` in `src/data/dmcData.js`**: Map the real SAP technical keys, mandatory flags, and allowed value tables (from the XML's `Field List` sheet or SAP check tables).
3. **Map Stages in `DmcXmlEditor.jsx`**: Align each sequential step's columns with the real XML worksheets (keeping Material-level sheets deduplicated and Plant/Condition-level sheets expanded).
4. **Match `buildDmcXml(order)` in `src/data/dmcData.js`**: Emit the exact `<Worksheet ss:Name="...">`, column order, header rows, and `ss:Type` (`String` vs `Number`) expected by SAP DMC so the exported `.xml` uploads cleanly into S/4HANA Migration Cockpit without structural errors.

---

## 4. Recipes for Another AI Picking Up This Repo

### Recipe 1: Transplant **ONLY** the Data Pane into an Existing React App
1. Copy `src/components/DataPane/*`, `src/utils/pivot.js`, and `src/styles/datapane.css`.
2. Ensure your app defines (or copies from `src/styles/tokens.css`) the `--font-*`, `--color-*`, `--radius-*`, and `--transition-fast` CSS variables.
3. Import `datapane.css` and render `<DataPane dataset={yourDataset} />` inside a flex container with a defined height.

### Recipe 2: Transplant **ONLY** the SAP DMC Workbench
1. Copy `src/components/DmcWorkbench/*`, `src/data/dmcData.js`, and `src/styles/dmc.css`.
2. Import `dmc.css` and render `<DmcWorkbench grain="material" />` or `<DmcWorkbench grain="pir" onSwitchGrain={...} />`.
3. Swap `SAP_MATERIAL_DB` / `SAP_PIR_DB` lookups in `src/data/dmcData.js` for your backend SAP / BigQuery lookup endpoint.

### Recipe 3: Rebrand from Dummy Apple (`iSearch`) to Your Real Brand
1. **Header logo & titles**: `src/components/Header.jsx` (`AppleLogoIcon`, `iSearch`, `Search Portal`) and `index.html` (`<title>`).
2. **Colors & typography**: `src/styles/tokens.css`.
3. **Icons**: Keep all icons in `src/components/Icons.jsx` in the **filled** SVG style.
4. **Rail labels & product tree**: `src/components/SideRail.jsx`, `src/data/catalog.js`, and `src/data/landing.js`.
