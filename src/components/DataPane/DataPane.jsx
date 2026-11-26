import { useEffect, useMemo, useRef, useState } from 'react';
import { computePivot } from '../../utils/pivot';
import { DataTable } from './DataTable';
import { PivotBuilder } from './PivotBuilder';
import { PivotChart } from './PivotChart';
import { PivotOutput } from './PivotOutput';

/**
 * BigQuery-inspired resizable Data Pane:
 * - Left column: Top Data Table (with dynamic schema-agnostic + Filter builder)
 *   + draggable horizontal splitter (Minimize / Split / Maximize)
 *   + Bottom Results drawer (Pivot Output | draggable vertical splitter | Pivot Chart),
 *     each with Copy, Export (CSV/PNG), and Maximize-as-Popup modal.
 * - Right column: Full-height resizable & collapsible Pivot Fields inspector
 *   with all 4 zones: Filters, Rows, Columns, Values.
 */
export function DataPane({ dataset }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [pivotConfig, setPivotConfig] = useState({
    filters: [],
    ...dataset.defaultPivot,
  });

  // Resizable & collapsible pane state
  const [topPct, setTopPct] = useState(48);
  const [bottomMode, setBottomMode] = useState('split'); // 'split' | 'minimized' | 'maximized'
  const [bottomLeftPct, setBottomLeftPct] = useState(48);
  const [rightWidth, setRightWidth] = useState(272);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Popup modal state for Pivot Output or Pivot Chart ('output' | 'chart' | null)
  const [popupView, setPopupView] = useState(null);

  const mainColRef = useRef(null);
  const bottomPaneRef = useRef(null);
  const workbenchRef = useRef(null);

  useEffect(() => {
    setSearchQuery('');
    setColumnFilters({});
    setSortConfig({ key: null, direction: null });
    setPivotConfig({ filters: [], ...dataset.defaultPivot });
    setPopupView(null);
  }, [dataset.id]);

  useEffect(() => {
    if (!popupView) return;
    function handleEsc(e) {
      if (e.key === 'Escape') setPopupView(null);
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [popupView]);

  const colMap = useMemo(
    () => Object.fromEntries(dataset.columns.map((c) => [c.key, c])),
    [dataset.columns]
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = dataset.rows.filter((row) => {
      for (const [key, filter] of Object.entries(columnFilters)) {
        if (!filter) continue;
        if (filter.type === 'multi') {
          if (
            filter.values.length > 0 &&
            !filter.values.includes(String(row[key] ?? ''))
          ) {
            return false;
          }
        } else if (filter.type === 'number-range') {
          const num = Number(row[key]);
          if (filter.min !== '' && num < Number(filter.min)) return false;
          if (filter.max !== '' && num > Number(filter.max)) return false;
        } else if (filter.type === 'date-range') {
          const val = String(row[key] ?? '');
          if (filter.from && val < filter.from) return false;
          if (filter.to && val > filter.to) return false;
        }
      }
      if (!q) return true;
      return dataset.columns.some((col) =>
        String(row[col.key] ?? '')
          .toLowerCase()
          .includes(q)
      );
    });

    if (!sortConfig.key || !sortConfig.direction) return filtered;

    const col = colMap[sortConfig.key];
    const dir = sortConfig.direction === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      const av = a[sortConfig.key];
      const bv = b[sortConfig.key];
      if (col?.type === 'number') {
        return (Number(av) - Number(bv)) * dir;
      }
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [
    dataset.rows,
    dataset.columns,
    searchQuery,
    columnFilters,
    sortConfig,
    colMap,
  ]);

  // Apply the 4th Pivot Zone (Pivot Filters) on top of Data Table filtered rows
  const pivotRows = useMemo(() => {
    const activePivotFilters = (pivotConfig.filters ?? []).filter(
      (f) => f.value && f.value !== 'ALL'
    );
    if (!activePivotFilters.length) return filteredRows;
    return filteredRows.filter((row) =>
      activePivotFilters.every((f) => String(row[f.key] ?? '') === f.value)
    );
  }, [filteredRows, pivotConfig.filters]);

  const pivotResult = useMemo(
    () =>
      computePivot({
        rows: pivotRows,
        rowField: pivotConfig.rowField,
        colField: pivotConfig.colField,
        valueField: pivotConfig.valueField,
        agg: pivotConfig.agg,
      }),
    [pivotRows, pivotConfig]
  );

  function startDrag(type, event) {
    event.preventDefault();
    document.body.classList.add('is-resizing');

    function handleMove(moveEvent) {
      if (type === 'horizontal' && mainColRef.current) {
        const rect = mainColRef.current.getBoundingClientRect();
        const relY = moveEvent.clientY - rect.top;
        const pct = Math.min(82, Math.max(18, (relY / rect.height) * 100));
        setBottomMode('split');
        setTopPct(Math.round(pct));
      } else if (type === 'bottom-split' && bottomPaneRef.current) {
        const rect = bottomPaneRef.current.getBoundingClientRect();
        const relX = moveEvent.clientX - rect.left;
        const pct = Math.min(72, Math.max(28, (relX / rect.width) * 100));
        setBottomLeftPct(Math.round(pct));
      } else if (type === 'right-panel' && workbenchRef.current) {
        const rect = workbenchRef.current.getBoundingClientRect();
        const widthFromRight = rect.right - moveEvent.clientX;
        const clamped = Math.min(400, Math.max(220, widthFromRight));
        setRightWidth(Math.round(clamped));
      }
    }

    function handleUp() {
      document.body.classList.remove('is-resizing');
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }

  function handleToggleSort(key) {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null };
    });
  }

  function handleSetColumnFilter(key, filterObj) {
    setColumnFilters((prev) => ({ ...prev, [key]: filterObj }));
  }

  function handleRemoveColumnFilter(key) {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleResetFilters() {
    setSearchQuery('');
    setColumnFilters({});
    setSortConfig({ key: null, direction: null });
  }

  const rowCol = pivotConfig.rowField ? colMap[pivotConfig.rowField] : null;
  const colCol = pivotConfig.colField ? colMap[pivotConfig.colField] : null;
  const valCol = pivotConfig.valueField ? colMap[pivotConfig.valueField] : null;

  const topPaneStyle =
    bottomMode === 'minimized'
      ? { flex: '1 1 auto' }
      : bottomMode === 'maximized'
      ? { display: 'none' }
      : { height: `${topPct}%`, flexShrink: 0 };

  return (
    <div className="dp-workbench" ref={workbenchRef}>
      {/* Left Main Column: Data Table (Top) + Pivot Results Drawer (Bottom) */}
      <div className="dp-main-col" ref={mainColRef}>
        <div className="dp-top-pane" style={topPaneStyle}>
          <DataTable
            gcpTable={dataset.gcpTable}
            columns={dataset.columns}
            allRows={dataset.rows}
            filteredRows={filteredRows}
            totalRowCount={dataset.rows.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            columnFilters={columnFilters}
            onSetColumnFilter={handleSetColumnFilter}
            onRemoveColumnFilter={handleRemoveColumnFilter}
            sortConfig={sortConfig}
            onToggleSort={handleToggleSort}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* BigQuery-style Horizontal Drag Bar + Minimize / Split / Maximize Controls */}
        <div className="dp-h-bar">
          <div
            className="dp-h-splitter"
            onMouseDown={(e) => startDrag('horizontal', e)}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize Data Table and Pivot Results"
            title="Drag up or down to resize"
          >
            <span className="dp-grip-pill dp-grip-pill--h" />
          </div>

          <div className="dp-drawer-controls">
            <span className="dp-drawer-label">Pivot Results</span>
            <button
              type="button"
              className={`dp-drawer-btn ${
                bottomMode === 'minimized' ? 'is-active' : ''
              }`}
              onClick={() =>
                setBottomMode((m) => (m === 'minimized' ? 'split' : 'minimized'))
              }
              title={
                bottomMode === 'minimized'
                  ? 'Restore Pivot Results'
                  : 'Minimize Pivot Results (focus Data Table)'
              }
            >
              {bottomMode === 'minimized' ? '▲ Expand' : '▼ Minimize'}
            </button>
            <button
              type="button"
              className={`dp-drawer-btn ${
                bottomMode === 'maximized' ? 'is-active' : ''
              }`}
              onClick={() =>
                setBottomMode((m) => (m === 'maximized' ? 'split' : 'maximized'))
              }
              title={
                bottomMode === 'maximized'
                  ? 'Restore Split View'
                  : 'Maximize Pivot Results'
              }
            >
              {bottomMode === 'maximized' ? '◫ Split' : '⤢ Maximize'}
            </button>
          </div>
        </div>

        {/* Bottom Results Drawer: Pivot Output (Left) + Pivot Chart (Right) */}
        {bottomMode !== 'minimized' && (
          <div className="dp-bottom-pane" ref={bottomPaneRef}>
            <div
              className="dp-bottom-left"
              style={{ width: `${bottomLeftPct}%` }}
            >
              <PivotOutput
                pivotResult={pivotResult}
                rowCol={rowCol}
                colCol={colCol}
                valCol={valCol}
                agg={pivotConfig.agg}
                onExpand={() => setPopupView('output')}
              />
            </div>

            <div
              className="dp-v-splitter"
              onMouseDown={(e) => startDrag('bottom-split', e)}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize Pivot Output and Pivot Chart"
              title="Drag left or right to resize"
            >
              <span className="dp-grip-pill dp-grip-pill--v" />
            </div>

            <div className="dp-bottom-right">
              <PivotChart
                pivotResult={pivotResult}
                rowCol={rowCol}
                colCol={colCol}
                valCol={valCol}
                agg={pivotConfig.agg}
                onExpand={() => setPopupView('chart')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Vertical Splitter for Full-Height Right Pivot Fields */}
      {!rightCollapsed && (
        <div
          className="dp-v-splitter dp-v-splitter--right"
          onMouseDown={(e) => startDrag('right-panel', e)}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Pivot Fields panel"
          title="Drag left or right to resize Pivot Fields"
        >
          <span className="dp-grip-pill dp-grip-pill--v" />
        </div>
      )}

      {/* Full-Height Right Column: Pivot Fields */}
      <div
        className={`dp-right-col ${rightCollapsed ? 'is-collapsed' : ''}`}
        style={rightCollapsed ? undefined : { width: `${rightWidth}px` }}
      >
        <PivotBuilder
          columns={dataset.columns}
          allRows={dataset.rows}
          pivotConfig={pivotConfig}
          onUpdatePivot={setPivotConfig}
          collapsed={rightCollapsed}
          onToggleCollapse={() => setRightCollapsed((c) => !c)}
        />
      </div>

      {/* Maximize-as-Popup Modal for Pivot Output or Pivot Chart */}
      {popupView && (
        <div
          className="dp-modal-backdrop"
          onClick={() => setPopupView(null)}
          role="dialog"
          aria-modal="true"
          aria-label={
            popupView === 'output'
              ? 'Expanded Pivot Output'
              : 'Expanded Pivot Chart'
          }
        >
          <div
            className="dp-modal-shell"
            onClick={(e) => e.stopPropagation()}
          >
            {popupView === 'output' ? (
              <PivotOutput
                pivotResult={pivotResult}
                rowCol={rowCol}
                colCol={colCol}
                valCol={valCol}
                agg={pivotConfig.agg}
                onExpand={() => setPopupView(null)}
                isModal
              />
            ) : (
              <PivotChart
                pivotResult={pivotResult}
                rowCol={rowCol}
                colCol={colCol}
                valCol={valCol}
                agg={pivotConfig.agg}
                onExpand={() => setPopupView(null)}
                isModal
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
