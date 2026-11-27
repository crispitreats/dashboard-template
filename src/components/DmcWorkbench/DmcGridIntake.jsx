import { useMemo, useState } from 'react';
import {
  MATERIAL_INTAKE_FIELDS,
  parseTabularPaste,
  PIR_INTAKE_FIELDS,
  SAMPLE_MATERIAL_GRID_TSV,
  SAMPLE_PIR_GRID_TSV,
} from '../../data/dmcData';

export function DmcGridIntake({
  grain,
  initialRawText,
  canClose = true,
  onApplyIntake,
  onClose,
}) {
  const [rawText, setRawText] = useState(initialRawText);
  const [parsed, setParsed] = useState(() =>
    parseTabularPaste(initialRawText, grain)
  );

  const fieldOptions =
    grain === 'pir' ? PIR_INTAKE_FIELDS : MATERIAL_INTAKE_FIELDS;

  function handlePasteTextChange(nextText) {
    setRawText(nextText);
    setParsed(parseTabularPaste(nextText, grain));
  }

  function handleMappingChange(colIdx, nextKey) {
    setParsed((prev) => ({
      ...prev,
      mappings: prev.mappings.map((m, i) => (i === colIdx ? nextKey : m)),
    }));
  }

  function handleCellEdit(rowIdx, colIdx, value) {
    setParsed((prev) => ({
      ...prev,
      rows: prev.rows.map((r, ri) =>
        ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? value : c)) : r
      ),
    }));
  }

  function handleLoadSample() {
    const sample =
      grain === 'pir' ? SAMPLE_PIR_GRID_TSV : SAMPLE_MATERIAL_GRID_TSV;
    handlePasteTextChange(sample);
  }

  const hasMaterialKey = parsed.mappings.includes('material');
  const hasVendorKey = grain !== 'pir' || parsed.mappings.includes('vendor');
  const mappedCount = parsed.mappings.filter(
    (m) => m && m !== 'ignore'
  ).length;
  const canApply =
    parsed.rows.length > 0 && hasMaterialKey && hasVendorKey;

  const missingKeyMsg = useMemo(() => {
    if (!hasMaterialKey) return 'Map at least one column to PRODUCT*';
    if (!hasVendorKey) return 'Map a column to SUPPLIER* for PIR grain';
    return null;
  }, [hasMaterialKey, hasVendorKey]);

  return (
    <section className="dmc-intake-panel" aria-label="Smart Grid Intake">
      <div className="dmc-intake-head">
        <div className="dmc-intake-title-group">
          <h4 className="dmc-intake-title">Smart Grid Intake & Column Map</h4>
          <span className="dmc-intake-sub">
            Paste directly from Excel / CSV, isolate the columns you have, and
            map them to SAP DMC fields.
          </span>
        </div>

        <div className="dmc-intake-actions">
          <button
            type="button"
            className="dmc-link-btn"
            onClick={handleLoadSample}
          >
            Load Sample Excel Table
          </button>
          <button
            type="button"
            className="dmc-ghost-btn"
            onClick={() => handlePasteTextChange('')}
          >
            Clear
          </button>
          {canClose && (
            <button
              type="button"
              className="dmc-close-btn"
              onClick={onClose}
              aria-label="Close Grid Intake"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Paste Box */}
      <div className="dmc-intake-paste-wrap">
        <textarea
          className="dmc-paste-textarea dmc-intake-textarea"
          rows={3}
          placeholder={
            grain === 'pir'
              ? 'Paste from Excel (e.g. Material [Tab] Vendor [Tab] Target Plant [Tab] Net Price [Tab] Mixing Ratio)...'
              : 'Paste from Excel (e.g. Material [Tab] Ref Material [Tab] Target Plants [Tab] Description [Tab] Color)...'
          }
          value={rawText}
          onChange={(e) => handlePasteTextChange(e.target.value)}
        />
      </div>

      {/* Live Mapped Preview Grid */}
      {parsed.rows.length > 0 && (
        <div className="dmc-intake-preview-wrap">
          <table className="dmc-intake-table">
            <thead>
              <tr>
                {parsed.headers.map((header, colIdx) => {
                  const mappedKey = parsed.mappings[colIdx] || 'ignore';
                  const isIgnored = mappedKey === 'ignore';
                  return (
                    <th
                      key={colIdx}
                      className={isIgnored ? 'is-ignored-col' : ''}
                    >
                      <div className="dmc-intake-col-head">
                        <span className="dmc-intake-raw-hdr" title={header}>
                          {header}
                        </span>
                        <select
                          className={`dmc-intake-map-select ${
                            mappedKey === 'material' || mappedKey === 'vendor'
                              ? 'is-key'
                              : mappedKey === 'refMaterial' ||
                                mappedKey === 'targetPlants'
                              ? 'is-special'
                              : isIgnored
                              ? 'is-ignored'
                              : ''
                          }`}
                          value={mappedKey}
                          onChange={(e) =>
                            handleMappingChange(colIdx, e.target.value)
                          }
                          aria-label={`Map column ${header}`}
                        >
                          {fieldOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {parsed.rows.slice(0, 8).map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => {
                    const isIgnored = parsed.mappings[cIdx] === 'ignore';
                    return (
                      <td
                        key={cIdx}
                        className={isIgnored ? 'is-ignored-col' : ''}
                      >
                        <input
                          type="text"
                          className="dmc-intake-cell"
                          value={cell}
                          onChange={(e) =>
                            handleCellEdit(rIdx, cIdx, e.target.value)
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {parsed.rows.length > 8 && (
            <div className="dmc-intake-more">
              Showing first 8 of {parsed.rows.length} rows
            </div>
          )}
        </div>
      )}

      {/* Footer Apply Bar */}
      <div className="dmc-intake-foot">
        <div className="dmc-intake-status">
          {missingKeyMsg ? (
            <span className="dmc-intake-warn">⚠ {missingKeyMsg}</span>
          ) : (
            <span>
              <strong>{parsed.rows.length}</strong> rows ·{' '}
              <strong>{mappedCount}</strong> SAP fields mapped (prepopulates
              Gantt &amp; Staging Workbench)
            </span>
          )}
        </div>

        <button
          type="button"
          className="dmc-primary-btn"
          disabled={!canApply}
          onClick={() => onApplyIntake(rawText, parsed.rows, parsed.mappings)}
        >
          Check SAP &amp; Load Gantt ({parsed.rows.length})
        </button>
      </div>
    </section>
  );
}
