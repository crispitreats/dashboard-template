import { useState } from 'react';
import { formatCellValue } from '../../utils/pivot';

export function PivotOutput({
  pivotResult,
  rowCol,
  colCol,
  valCol,
  agg,
  onExpand,
  isModal = false,
}) {
  const [copied, setCopied] = useState(false);
  const valueFormat = agg === 'COUNT' ? 'integer' : valCol?.format;

  function buildDelimitedText(delimiter, quoteStrings) {
    const headers = colCol
      ? [rowCol.label, ...pivotResult.colKeys, 'Total']
      : [rowCol.label, `${agg}(${valCol.label})`];

    const lines = [headers.join(delimiter)];
    for (const rKey of pivotResult.rowKeys) {
      const label = quoteStrings ? `"${rKey}"` : rKey;
      if (colCol) {
        const vals = pivotResult.colKeys.map(
          (cKey) => pivotResult.cells[`${rKey}|||${cKey}`] ?? 0
        );
        lines.push([label, ...vals, pivotResult.rowTotals[rKey] ?? 0].join(delimiter));
      } else {
        lines.push([label, pivotResult.rowTotals[rKey] ?? 0].join(delimiter));
      }
    }

    if (colCol) {
      const totals = pivotResult.colKeys.map(
        (cKey) => pivotResult.colTotals[cKey] ?? 0
      );
      lines.push(
        [quoteStrings ? '"Grand Total"' : 'Grand Total', ...totals, pivotResult.grandTotal].join(
          delimiter
        )
      );
    } else {
      lines.push(
        [quoteStrings ? '"Grand Total"' : 'Grand Total', pivotResult.grandTotal].join(delimiter)
      );
    }

    return lines.join('\n');
  }

  async function handleCopyTsv() {
    if (!pivotResult.rowKeys.length || !rowCol || !valCol) return;
    const tsv = buildDelimitedText('\t', false);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = tsv;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  function handleExportCsv() {
    if (!pivotResult.rowKeys.length || !rowCol || !valCol) return;
    const csv = buildDelimitedText(',', true);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pivot_${rowCol.key}_${valCol.key}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const hasRows = Boolean(rowCol && valCol && pivotResult.rowKeys.length > 0);

  return (
    <section className="dp-card dp-pivot-card" aria-label="Pivot Output">
      <div className="dp-card-header">
        <div className="dp-card-title-group">
          <h3 className="dp-card-title">Pivot Output</h3>
          {rowCol && valCol && (
            <span className="dp-meta-tag">
              {agg}({valCol.label}) · {rowCol.label}
              {colCol ? ` × ${colCol.label}` : ''}
            </span>
          )}
        </div>

        <div className="dp-card-actions">
          <button
            type="button"
            className={`dp-ghost-btn ${copied ? 'is-toggled' : ''}`}
            onClick={handleCopyTsv}
            disabled={!hasRows}
            title="Copy table to clipboard (paste into Excel / Sheets)"
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
          <button
            type="button"
            className="dp-ghost-btn"
            onClick={handleExportCsv}
            disabled={!hasRows}
            title="Download CSV"
          >
            CSV
          </button>
          {onExpand && (
            <button
              type="button"
              className="dp-icon-action-btn"
              onClick={onExpand}
              title={isModal ? 'Close popup' : 'Open Pivot Output in popup'}
              aria-label={
                isModal ? 'Close popup' : 'Open Pivot Output in popup'
              }
            >
              {isModal ? '×' : '⤢'}
            </button>
          )}
        </div>
      </div>

      {!rowCol || !valCol ? (
        <div className="dp-empty-state">
          Assign a <strong>Row</strong> and <strong>Value</strong> field in
          Pivot Fields.
        </div>
      ) : pivotResult.rowKeys.length === 0 ? (
        <div className="dp-empty-state">No rows match the current filters.</div>
      ) : (
        <div className="dp-table-scroll">
          <table className="dp-table dp-pivot-table">
            <thead>
              <tr>
                <th>{rowCol.label}</th>
                {colCol ? (
                  <>
                    {pivotResult.colKeys.map((cKey) => (
                      <th key={cKey} className="is-num">
                        {cKey}
                      </th>
                    ))}
                    <th className="is-num is-total-col">Total</th>
                  </>
                ) : (
                  <th className="is-num">
                    {agg}({valCol.label})
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {pivotResult.rowKeys.map((rKey) => (
                <tr key={rKey}>
                  <td className="dp-pivot-row-key">{rKey}</td>
                  {colCol ? (
                    <>
                      {pivotResult.colKeys.map((cKey) => (
                        <td key={cKey} className="is-num">
                          {formatCellValue(
                            pivotResult.cells[`${rKey}|||${cKey}`],
                            valueFormat
                          )}
                        </td>
                      ))}
                      <td className="is-num is-total-col">
                        {formatCellValue(
                          pivotResult.rowTotals[rKey],
                          valueFormat
                        )}
                      </td>
                    </>
                  ) : (
                    <td className="is-num">
                      {formatCellValue(
                        pivotResult.rowTotals[rKey],
                        valueFormat
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="dp-grand-total-row">
                <td>Grand Total</td>
                {colCol ? (
                  <>
                    {pivotResult.colKeys.map((cKey) => (
                      <td key={cKey} className="is-num">
                        {formatCellValue(
                          pivotResult.colTotals[cKey],
                          valueFormat
                        )}
                      </td>
                    ))}
                    <td className="is-num is-total-col">
                      {formatCellValue(pivotResult.grandTotal, valueFormat)}
                    </td>
                  </>
                ) : (
                  <td className="is-num">
                    {formatCellValue(pivotResult.grandTotal, valueFormat)}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
