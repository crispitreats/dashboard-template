# iSearch — Search Portal (Frontend Mockup)

Interactive React + Vite frontend mockup for an internal multi-user data & analytics portal (`iSearch — Search Portal`), built for rapid UI iteration and cross-device pickup.

## Features

- **Header**: Charcoal black `44px` navigation bar with Apple branding (`iSearch` / `Search Portal`) and interactive user role switcher (`Super Admin`, `All`, `Dummy 1`, `Dummy 2`, `Dummy 3`).
- **Navigation Shell**: Slim `52px` left rail (`All`, `Dir`, `Ind`, `Out`, plus bottom `Cons`, `Vers`, `Help`), choreographed rounded-trapezium pull-tab, and collapsible 2-level sub-category sidebar (`Data`, `Analytics`, `Workbench`) with rounded tree-string connectors.
- **All Landing Page**: Full-bleed fixed-height hero announcement carousel with countdown timer, team profile selector (`Dir` | `Ind` | `Out`), uniform-height scrollable Data/Analytics/Workbench tree columns, and a scrollable What's New release feed.
- **Product Directory**: Searchable `Cards` / `List` catalog for every `(Team, Mode)` view.
- **Data Pane (BigQuery-style Workbench)**: Schema-driven columnar Data Table with type-aware multi-select & range `+ Filter` builder, full-height resizable & collapsible 4-zone **Pivot Fields** (`Filters`, `Rows`, `Columns`, `Values`), live **Pivot Output** (`Copy` TSV, `CSV` export, Popup modal), and interactive **Pivot Chart** (`Bar`, `H-Bar`, `Line`, `Donut`, `Copy`, `PNG` export, Popup modal).

## Local Development

```bash
npm install
npm run dev
```

Runs on **`http://localhost:5179/`** (`strictPort: true`).
