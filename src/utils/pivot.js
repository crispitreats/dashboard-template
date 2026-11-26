export const AGGREGATIONS = ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'];

export function formatCellValue(value, format) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (typeof value !== 'number') return String(value);

  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: format === 'integer' ? 0 : 1,
  }).format(value);
}

export function formatCompactNumber(value, format) {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  const prefix = format === 'currency' ? '$' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}K`;
  return `${prefix}${Math.round(value)}`;
}

function aggregate(values, agg) {
  if (!values.length) return 0;
  switch (agg) {
    case 'COUNT':
      return values.length;
    case 'AVG':
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    case 'MAX':
      return Math.max(...values);
    case 'MIN':
      return Math.min(...values);
    case 'SUM':
    default:
      return values.reduce((sum, v) => sum + v, 0);
  }
}

/**
 * Schema-agnostic pivot engine: takes any filtered columnar rows and computes
 * grouped matrix + row totals + column totals + grand total.
 */
export function computePivot({ rows, rowField, colField, valueField, agg }) {
  if (!rowField || !valueField) {
    return {
      rowKeys: [],
      colKeys: [],
      cells: {},
      rowTotals: {},
      colTotals: {},
      grandTotal: 0,
    };
  }

  const rowKeySet = new Set();
  const colKeySet = new Set();
  const buckets = new Map();
  const rowAllValues = new Map();
  const colAllValues = new Map();
  const allValues = [];

  for (const row of rows) {
    const rKey = String(row[rowField] ?? '—');
    const cKey = colField ? String(row[colField] ?? '—') : '__TOTAL__';
    const rawVal = Number(row[valueField]);
    const numVal = Number.isFinite(rawVal) ? rawVal : 0;

    rowKeySet.add(rKey);
    if (colField) colKeySet.add(cKey);

    const cellKey = `${rKey}|||${cKey}`;
    if (!buckets.has(cellKey)) buckets.set(cellKey, []);
    buckets.get(cellKey).push(numVal);

    if (!rowAllValues.has(rKey)) rowAllValues.set(rKey, []);
    rowAllValues.get(rKey).push(numVal);

    if (colField) {
      if (!colAllValues.has(cKey)) colAllValues.set(cKey, []);
      colAllValues.get(cKey).push(numVal);
    }

    allValues.push(numVal);
  }

  const rowKeys = Array.from(rowKeySet).sort((a, b) => a.localeCompare(b));
  const colKeys = colField
    ? Array.from(colKeySet).sort((a, b) => a.localeCompare(b))
    : [];

  const cells = {};
  const rowTotals = {};
  const colTotals = {};

  for (const rKey of rowKeys) {
    rowTotals[rKey] = aggregate(rowAllValues.get(rKey) ?? [], agg);
    if (colField) {
      for (const cKey of colKeys) {
        const vals = buckets.get(`${rKey}|||${cKey}`) ?? [];
        cells[`${rKey}|||${cKey}`] = vals.length ? aggregate(vals, agg) : 0;
      }
    } else {
      cells[`${rKey}|||__TOTAL__`] = rowTotals[rKey];
    }
  }

  for (const cKey of colKeys) {
    colTotals[cKey] = aggregate(colAllValues.get(cKey) ?? [], agg);
  }

  const grandTotal = aggregate(allValues, agg);

  return {
    rowKeys,
    colKeys,
    cells,
    rowTotals,
    colTotals,
    grandTotal,
  };
}
