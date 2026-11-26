import { useMemo, useState } from 'react';
import { AGGREGATIONS } from '../../utils/pivot';

export function PivotBuilder({
  columns,
  allRows,
  pivotConfig,
  onUpdatePivot,
  collapsed,
  onToggleCollapse,
}) {
  const [dragOverZone, setDragOverZone] = useState(null);

  const colMap = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.key, c])),
    [columns]
  );

  // Dynamically compute distinct options for any column dropped into Pivot Filters
  const distinctByCol = useMemo(() => {
    const map = {};
    for (const pf of pivotConfig.filters ?? []) {
      const vals = Array.from(
        new Set(allRows.map((r) => String(r[pf.key] ?? '')))
      ).filter(Boolean);
      const col = colMap[pf.key];
      map[pf.key] =
        col?.type === 'number'
          ? vals.sort((a, b) => Number(a) - Number(b))
          : vals.sort((a, b) => a.localeCompare(b));
    }
    return map;
  }, [allRows, pivotConfig.filters, colMap]);

  if (collapsed) {
    return (
      <aside
        className="dp-card dp-builder-collapsed"
        aria-label="Pivot Fields (Collapsed)"
      >
        <button
          type="button"
          className="dp-builder-expand-btn"
          onClick={onToggleCollapse}
          title="Expand Pivot Fields"
          aria-label="Expand Pivot Fields"
        >
          <span className="dp-expand-arrow" aria-hidden="true">
            ‹
          </span>
          <span className="dp-vertical-label">Pivot Fields</span>
        </button>
      </aside>
    );
  }

  function handleDragStart(event, colKey) {
    event.dataTransfer.setData('text/plain', colKey);
    event.dataTransfer.effectAllowed = 'copyMove';
  }

  function handleDragOver(event, zone) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (dragOverZone !== zone) setDragOverZone(zone);
  }

  function handleDrop(event, zone) {
    event.preventDefault();
    setDragOverZone(null);
    const colKey = event.dataTransfer.getData('text/plain');
    if (!colKey || !colMap[colKey]) return;

    if (zone === 'filters') {
      const existing = pivotConfig.filters ?? [];
      if (existing.some((f) => f.key === colKey)) return;
      onUpdatePivot({
        ...pivotConfig,
        filters: [...existing, { key: colKey, value: 'ALL' }],
      });
    } else if (zone === 'rows') {
      onUpdatePivot({
        ...pivotConfig,
        rowField: colKey,
        colField: pivotConfig.colField === colKey ? null : pivotConfig.colField,
      });
    } else if (zone === 'columns') {
      onUpdatePivot({
        ...pivotConfig,
        colField: colKey,
        rowField: pivotConfig.rowField === colKey ? null : pivotConfig.rowField,
      });
    } else if (zone === 'values') {
      onUpdatePivot({
        ...pivotConfig,
        valueField: colKey,
      });
    }
  }

  function handleQuickAssign(col) {
    if (col.type === 'number') {
      onUpdatePivot({ ...pivotConfig, valueField: col.key });
    } else if (!pivotConfig.rowField) {
      onUpdatePivot({ ...pivotConfig, rowField: col.key });
    } else if (pivotConfig.rowField !== col.key) {
      onUpdatePivot({ ...pivotConfig, colField: col.key });
    }
  }

  function handleUpdateFilterValue(colKey, value) {
    onUpdatePivot({
      ...pivotConfig,
      filters: (pivotConfig.filters ?? []).map((f) =>
        f.key === colKey ? { ...f, value } : f
      ),
    });
  }

  function handleRemoveFilter(colKey) {
    onUpdatePivot({
      ...pivotConfig,
      filters: (pivotConfig.filters ?? []).filter((f) => f.key !== colKey),
    });
  }

  const pivotFilters = pivotConfig.filters ?? [];
  const rowCol = pivotConfig.rowField ? colMap[pivotConfig.rowField] : null;
  const colCol = pivotConfig.colField ? colMap[pivotConfig.colField] : null;
  const valCol = pivotConfig.valueField ? colMap[pivotConfig.valueField] : null;

  return (
    <aside className="dp-card dp-builder-card" aria-label="Pivot Fields">
      <div className="dp-card-header">
        <h3 className="dp-card-title">Pivot Fields</h3>
        <button
          type="button"
          className="dp-icon-action-btn"
          onClick={onToggleCollapse}
          title="Minimize Pivot Fields"
          aria-label="Minimize Pivot Fields"
        >
          ›
        </button>
      </div>

      <div className="dp-builder-scroll">
        <div className="dp-builder-section-label">Columns (Drag or Click)</div>
        <div className="dp-fields-pool" aria-label="Available columns">
          {columns.map((col) => {
            const isUsed =
              col.key === pivotConfig.rowField ||
              col.key === pivotConfig.colField ||
              col.key === pivotConfig.valueField ||
              pivotFilters.some((f) => f.key === col.key);

            return (
              <button
                key={col.key}
                type="button"
                draggable
                onDragStart={(e) => handleDragStart(e, col.key)}
                onClick={() => handleQuickAssign(col)}
                className={`dp-field-chip ${isUsed ? 'is-used' : ''}`}
                title={`Drag "${col.label}" into Filters, Rows, Columns, or Values`}
              >
                <span className="dp-field-type" aria-hidden="true">
                  {col.type === 'number' ? '#' : 'Aa'}
                </span>
                <span>{col.label}</span>
              </button>
            );
          })}
        </div>

        <div className="dp-zones">
          {/* 1. FILTERS (4th Pivot Zone) */}
          <div
            className={`dp-zone ${
              dragOverZone === 'filters' ? 'is-drag-over' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, 'filters')}
            onDragLeave={() => setDragOverZone(null)}
            onDrop={(e) => handleDrop(e, 'filters')}
          >
            <span className="dp-zone-label">Filters</span>
            <div className="dp-zone-slot dp-zone-slot--stack">
              {pivotFilters.length > 0 ? (
                pivotFilters.map((pf) => {
                  const col = colMap[pf.key];
                  const options = distinctByCol[pf.key] ?? [];
                  return (
                    <div key={pf.key} className="dp-pivot-filter-row">
                      <span className="dp-pivot-filter-name">
                        {col?.label ?? pf.key}
                      </span>
                      <select
                        className="dp-select dp-pivot-filter-select"
                        value={pf.value}
                        onChange={(e) =>
                          handleUpdateFilterValue(pf.key, e.target.value)
                        }
                        aria-label={`Pivot filter for ${col?.label ?? pf.key}`}
                      >
                        <option value="ALL">All</option>
                        {options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="dp-pivot-filter-remove"
                        onClick={() => handleRemoveFilter(pf.key)}
                        aria-label={`Remove ${col?.label ?? pf.key} filter`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              ) : (
                <span className="dp-zone-placeholder">
                  Drop field to filter pivot
                </span>
              )}
            </div>
          </div>

          {/* 2. ROWS */}
          <div
            className={`dp-zone ${
              dragOverZone === 'rows' ? 'is-drag-over' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, 'rows')}
            onDragLeave={() => setDragOverZone(null)}
            onDrop={(e) => handleDrop(e, 'rows')}
          >
            <span className="dp-zone-label">Rows</span>
            <div className="dp-zone-slot">
              {rowCol ? (
                <span className="dp-assigned-pill">
                  <span>{rowCol.label}</span>
                  <button
                    type="button"
                    className="dp-pill-remove"
                    onClick={() =>
                      onUpdatePivot({ ...pivotConfig, rowField: null })
                    }
                    aria-label={`Remove ${rowCol.label} from Rows`}
                  >
                    ×
                  </button>
                </span>
              ) : (
                <span className="dp-zone-placeholder">Drop field here</span>
              )}
            </div>
          </div>

          {/* 3. COLUMNS */}
          <div
            className={`dp-zone ${
              dragOverZone === 'columns' ? 'is-drag-over' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, 'columns')}
            onDragLeave={() => setDragOverZone(null)}
            onDrop={(e) => handleDrop(e, 'columns')}
          >
            <span className="dp-zone-label">Columns</span>
            <div className="dp-zone-slot">
              {colCol ? (
                <span className="dp-assigned-pill">
                  <span>{colCol.label}</span>
                  <button
                    type="button"
                    className="dp-pill-remove"
                    onClick={() =>
                      onUpdatePivot({ ...pivotConfig, colField: null })
                    }
                    aria-label={`Remove ${colCol.label} from Columns`}
                  >
                    ×
                  </button>
                </span>
              ) : (
                <span className="dp-zone-placeholder">Optional split</span>
              )}
            </div>
          </div>

          {/* 4. VALUES */}
          <div
            className={`dp-zone ${
              dragOverZone === 'values' ? 'is-drag-over' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, 'values')}
            onDragLeave={() => setDragOverZone(null)}
            onDrop={(e) => handleDrop(e, 'values')}
          >
            <div className="dp-zone-head">
              <span className="dp-zone-label">Values</span>
              <select
                className="dp-agg-select"
                value={pivotConfig.agg}
                onChange={(e) =>
                  onUpdatePivot({ ...pivotConfig, agg: e.target.value })
                }
                aria-label="Aggregation function"
              >
                {AGGREGATIONS.map((agg) => (
                  <option key={agg} value={agg}>
                    {agg}
                  </option>
                ))}
              </select>
            </div>
            <div className="dp-zone-slot">
              {valCol ? (
                <span className="dp-assigned-pill dp-assigned-pill--accent">
                  <span>
                    {pivotConfig.agg}({valCol.label})
                  </span>
                  <button
                    type="button"
                    className="dp-pill-remove"
                    onClick={() =>
                      onUpdatePivot({ ...pivotConfig, valueField: null })
                    }
                    aria-label={`Remove ${valCol.label} from Values`}
                  >
                    ×
                  </button>
                </span>
              ) : (
                <span className="dp-zone-placeholder">Drop metric here</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
