import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCellValue } from '../../utils/pivot';

function formatFilterSummary(filter, col) {
  if (filter.type === 'multi') {
    if (filter.values.length <= 2) return filter.values.join(', ');
    return `${filter.values.length} selected`;
  }
  if (filter.type === 'number-range') {
    const hasMin = filter.min !== '' && filter.min !== null && filter.min !== undefined;
    const hasMax = filter.max !== '' && filter.max !== null && filter.max !== undefined;
    const minTxt = hasMin ? formatCellValue(Number(filter.min), col?.format) : '';
    const maxTxt = hasMax ? formatCellValue(Number(filter.max), col?.format) : '';
    if (hasMin && hasMax) return `${minTxt} – ${maxTxt}`;
    if (hasMin) return `≥ ${minTxt}`;
    if (hasMax) return `≤ ${maxTxt}`;
  }
  if (filter.type === 'date-range') {
    if (filter.from && filter.to) return `${filter.from} → ${filter.to}`;
    if (filter.from) return `≥ ${filter.from}`;
    if (filter.to) return `≤ ${filter.to}`;
  }
  return '';
}

export function DataTable({
  gcpTable,
  columns,
  allRows,
  filteredRows,
  totalRowCount,
  searchQuery,
  onSearchChange,
  columnFilters,
  onSetColumnFilter,
  onRemoveColumnFilter,
  sortConfig,
  onToggleSort,
  onResetFilters,
}) {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [draftColKey, setDraftColKey] = useState(() => columns[0]?.key ?? '');
  const [draftMulti, setDraftMulti] = useState([]);
  const [draftMin, setDraftMin] = useState('');
  const [draftMax, setDraftMax] = useState('');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const popoverRef = useRef(null);

  const colMap = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.key, c])),
    [columns]
  );

  const activeDraftCol = colMap[draftColKey] ?? columns[0];

  // Dynamically derive distinct values or min/max bounds for the selected column
  const draftMeta = useMemo(() => {
    if (!activeDraftCol) return { values: [], min: '', max: '' };
    const key = activeDraftCol.key;
    if (activeDraftCol.type === 'number') {
      const nums = allRows
        .map((r) => Number(r[key]))
        .filter((n) => Number.isFinite(n));
      return {
        values: [],
        min: nums.length ? Math.min(...nums) : 0,
        max: nums.length ? Math.max(...nums) : 0,
      };
    }
    if (activeDraftCol.type === 'date') {
      const dates = allRows
        .map((r) => String(r[key] ?? ''))
        .filter(Boolean)
        .sort();
      return {
        values: [],
        min: dates[0] ?? '',
        max: dates[dates.length - 1] ?? '',
      };
    }
    const vals = Array.from(
      new Set(allRows.map((r) => String(r[key] ?? '')))
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return { values: vals, min: '', max: '' };
  }, [allRows, activeDraftCol]);

  // Pre-fill draft state when switching column or opening an existing filter
  function syncDraftForColumn(colKey) {
    const existing = columnFilters[colKey];
    const col = colMap[colKey];
    if (!col) return;

    if (col.type === 'number') {
      setDraftMin(existing?.type === 'number-range' ? existing.min ?? '' : '');
      setDraftMax(existing?.type === 'number-range' ? existing.max ?? '' : '');
    } else if (col.type === 'date') {
      setDraftFrom(existing?.type === 'date-range' ? existing.from ?? '' : '');
      setDraftTo(existing?.type === 'date-range' ? existing.to ?? '' : '');
    } else {
      setDraftMulti(existing?.type === 'multi' ? existing.values : []);
    }
  }

  useEffect(() => {
    const firstKey = columns[0]?.key ?? '';
    setDraftColKey(firstKey);
  }, [columns]);

  useEffect(() => {
    if (filterMenuOpen && draftColKey) {
      syncDraftForColumn(draftColKey);
    }
  }, [filterMenuOpen, draftColKey]);

  useEffect(() => {
    if (!filterMenuOpen) return;
    function handleOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setFilterMenuOpen(false);
      }
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setFilterMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [filterMenuOpen]);

  const activeFilterEntries = Object.entries(columnFilters);
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    activeFilterEntries.length > 0 ||
    Boolean(sortConfig.key);

  function handleToggleMultiValue(val) {
    setDraftMulti((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  function handleApplyFilter(e) {
    e.preventDefault();
    if (!activeDraftCol) return;

    if (activeDraftCol.type === 'number') {
      if (draftMin === '' && draftMax === '') {
        onRemoveColumnFilter(activeDraftCol.key);
      } else {
        onSetColumnFilter(activeDraftCol.key, {
          type: 'number-range',
          min: draftMin,
          max: draftMax,
        });
      }
    } else if (activeDraftCol.type === 'date') {
      if (!draftFrom && !draftTo) {
        onRemoveColumnFilter(activeDraftCol.key);
      } else {
        onSetColumnFilter(activeDraftCol.key, {
          type: 'date-range',
          from: draftFrom,
          to: draftTo,
        });
      }
    } else {
      if (draftMulti.length === 0) {
        onRemoveColumnFilter(activeDraftCol.key);
      } else {
        onSetColumnFilter(activeDraftCol.key, {
          type: 'multi',
          values: draftMulti,
        });
      }
    }
    setFilterMenuOpen(false);
  }

  function handleEditPill(colKey) {
    setDraftColKey(colKey);
    setFilterMenuOpen(true);
  }

  return (
    <section className="dp-card dp-table-card" aria-label="Source Data Table">
      <div className="dp-card-header">
        <div className="dp-card-title-group">
          <h3 className="dp-card-title">Data Table</h3>
          <span className="dp-gcp-badge" title={`GCP Table: ${gcpTable}`}>
            <span className="dp-gcp-dot" aria-hidden="true" />
            {gcpTable}
          </span>
        </div>

        <span className="dp-row-count">
          {filteredRows.length} / {totalRowCount} rows
        </span>
      </div>

      <div className="dp-table-toolbar">
        <input
          type="search"
          className="dp-search-input"
          placeholder="Search rows..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search table rows"
        />

        <div className="dp-filter-builder" ref={popoverRef}>
          <button
            type="button"
            className={`dp-ghost-btn ${
              activeFilterEntries.length > 0 ? 'is-toggled' : ''
            }`}
            onClick={() => setFilterMenuOpen((o) => !o)}
            aria-expanded={filterMenuOpen}
          >
            + Filter
            {activeFilterEntries.length > 0
              ? ` (${activeFilterEntries.length})`
              : ''}
          </button>

          {filterMenuOpen && activeDraftCol && (
            <form
              className="dp-filter-popover"
              onSubmit={handleApplyFilter}
              aria-label="Add or edit column filter"
            >
              <label className="dp-popover-field">
                <span>Column</span>
                <select
                  className="dp-select"
                  value={draftColKey}
                  onChange={(e) => setDraftColKey(e.target.value)}
                >
                  {columns.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.label} ({col.type})
                    </option>
                  ))}
                </select>
              </label>

              {/* Multi-select checklist for string columns */}
              {activeDraftCol.type === 'string' && (
                <div className="dp-popover-field">
                  <div className="dp-popover-subhead">
                    <span>Values (Multi-select)</span>
                    <div className="dp-popover-links">
                      <button
                        type="button"
                        className="dp-link-btn"
                        onClick={() => setDraftMulti(draftMeta.values)}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className="dp-link-btn"
                        onClick={() => setDraftMulti([])}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="dp-checklist">
                    {draftMeta.values.map((val) => {
                      const checked = draftMulti.includes(val);
                      return (
                        <label key={val} className="dp-check-item">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleMultiValue(val)}
                          />
                          <span>{val}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Numeric range for number columns */}
              {activeDraftCol.type === 'number' && (
                <div className="dp-popover-field">
                  <span>
                    Range ({formatCellValue(draftMeta.min, activeDraftCol.format)}{' '}
                    – {formatCellValue(draftMeta.max, activeDraftCol.format)})
                  </span>
                  <div className="dp-range-inputs">
                    <input
                      type="number"
                      className="dp-range-input"
                      placeholder={`Min (${draftMeta.min})`}
                      value={draftMin}
                      onChange={(e) => setDraftMin(e.target.value)}
                      aria-label="Minimum value"
                    />
                    <span className="dp-range-sep">–</span>
                    <input
                      type="number"
                      className="dp-range-input"
                      placeholder={`Max (${draftMeta.max})`}
                      value={draftMax}
                      onChange={(e) => setDraftMax(e.target.value)}
                      aria-label="Maximum value"
                    />
                  </div>
                </div>
              )}

              {/* Date range for date columns */}
              {activeDraftCol.type === 'date' && (
                <div className="dp-popover-field">
                  <span>Date Range</span>
                  <div className="dp-range-inputs dp-range-inputs--dates">
                    <label className="dp-date-field">
                      <span>From</span>
                      <input
                        type="date"
                        className="dp-range-input"
                        value={draftFrom}
                        min={draftMeta.min}
                        max={draftMeta.max}
                        onChange={(e) => setDraftFrom(e.target.value)}
                      />
                    </label>
                    <label className="dp-date-field">
                      <span>To</span>
                      <input
                        type="date"
                        className="dp-range-input"
                        value={draftTo}
                        min={draftMeta.min}
                        max={draftMeta.max}
                        onChange={(e) => setDraftTo(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="dp-popover-actions">
                <button
                  type="button"
                  className="dp-ghost-btn"
                  onClick={() => setFilterMenuOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="dp-primary-btn">
                  Apply
                </button>
              </div>
            </form>
          )}
        </div>

        {activeFilterEntries.length > 0 && (
          <div className="dp-active-filters" aria-label="Active filters">
            {activeFilterEntries.map(([key, filter]) => {
              const col = colMap[key];
              return (
                <span key={key} className="dp-filter-pill">
                  <button
                    type="button"
                    className="dp-filter-pill-edit"
                    onClick={() => handleEditPill(key)}
                    title="Click to edit filter"
                  >
                    {col?.label ?? key}:{' '}
                    <strong>{formatFilterSummary(filter, col)}</strong>
                  </button>
                  <button
                    type="button"
                    className="dp-filter-pill-x"
                    onClick={() => onRemoveColumnFilter(key)}
                    aria-label={`Remove ${col?.label ?? key} filter`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            className="dp-reset-btn"
            onClick={onResetFilters}
          >
            Reset
          </button>
        )}
      </div>

      <div className="dp-table-scroll">
        <table className="dp-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sortConfig.key === col.key;
                const dir = isSorted ? sortConfig.direction : null;
                return (
                  <th
                    key={col.key}
                    className={col.type === 'number' ? 'is-num' : ''}
                    aria-sort={
                      dir === 'asc'
                        ? 'ascending'
                        : dir === 'desc'
                        ? 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      className={`dp-sort-btn ${isSorted ? 'is-sorted' : ''}`}
                      onClick={() => onToggleSort(col.key)}
                    >
                      <span>{col.label}</span>
                      <span className="dp-sort-indicator" aria-hidden="true">
                        {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '↕'}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="dp-empty-cell">
                  No matching rows
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={col.type === 'number' ? 'is-num' : ''}
                    >
                      {col.type === 'number'
                        ? formatCellValue(row[col.key], col.format)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
