import { useMemo, useRef, useState } from 'react';
import { formatCellValue, formatCompactNumber } from '../../utils/pivot';

const APPLE_CHART_COLORS = [
  '#0071E3',
  '#34C759',
  '#FF9500',
  '#AF52DE',
  '#FF3B30',
  '#5AC8FA',
];

const CHART_TYPES = [
  { id: 'bar', label: 'Bar' },
  { id: 'hbar', label: 'H-Bar' },
  { id: 'line', label: 'Line' },
  { id: 'donut', label: 'Donut' },
];

export function PivotChart({
  pivotResult,
  rowCol,
  colCol,
  valCol,
  agg,
  onExpand,
  isModal = false,
}) {
  const [chartType, setChartType] = useState('bar');
  const [sortByValue, setSortByValue] = useState(true);
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [copiedChart, setCopiedChart] = useState(false);
  const svgRef = useRef(null);

  const valueFormat = agg === 'COUNT' ? 'integer' : valCol?.format;

  const orderedRows = useMemo(() => {
    const keys = [...pivotResult.rowKeys];
    if (sortByValue) {
      keys.sort(
        (a, b) =>
          (pivotResult.rowTotals[b] ?? 0) - (pivotResult.rowTotals[a] ?? 0)
      );
    }
    return keys;
  }, [pivotResult, sortByValue]);

  const seriesKeys = useMemo(
    () => (colCol && pivotResult.colKeys.length ? pivotResult.colKeys : ['Total']),
    [colCol, pivotResult.colKeys]
  );

  function getValue(rKey, sKey) {
    if (!colCol) return pivotResult.rowTotals[rKey] ?? 0;
    return pivotResult.cells[`${rKey}|||${sKey}`] ?? 0;
  }

  const maxValue = useMemo(() => {
    let max = 0;
    for (const rKey of orderedRows) {
      if (chartType === 'hbar' || chartType === 'donut') {
        max = Math.max(max, pivotResult.rowTotals[rKey] ?? 0);
      } else {
        for (const sKey of seriesKeys) {
          max = Math.max(max, getValue(rKey, sKey));
        }
      }
    }
    return max || 1;
  }, [orderedRows, seriesKeys, chartType, pivotResult, colCol]);

  const hasData = Boolean(rowCol && valCol && orderedRows.length > 0);

  function renderSvgToPngBlob() {
    return new Promise((resolve) => {
      const svgEl = svgRef.current;
      if (!svgEl) {
        resolve(null);
        return;
      }
      const clone = svgEl.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const vb = (svgEl.getAttribute('viewBox') || '0 0 460 220')
        .split(' ')
        .map(Number);
      const width = (vb[2] || 460) * 2;
      const height = (vb[3] || 220) * 2;
      clone.setAttribute('width', String(width));
      clone.setAttribute('height', String(height));

      const svgStr = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  }

  async function handleExportPng() {
    if (!hasData) return;
    const blob = await renderSvgToPngBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart_${chartType}_${rowCol?.key ?? 'pivot'}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopyChart() {
    if (!hasData) return;
    const blob = await renderSvgToPngBlob();
    try {
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'image/png': blob }),
        ]);
      } else if (svgRef.current) {
        await navigator.clipboard.writeText(svgRef.current.outerHTML);
      }
      setCopiedChart(true);
      setTimeout(() => setCopiedChart(false), 1800);
    } catch {
      setCopiedChart(true);
      setTimeout(() => setCopiedChart(false), 1800);
    }
  }

  return (
    <section className="dp-card dp-chart-card" aria-label="Pivot Chart">
      <div className="dp-card-header dp-chart-header">
        <div className="dp-card-title-group">
          <h3 className="dp-card-title">Pivot Chart</h3>
        </div>

        <div className="dp-chart-controls">
          <div className="dp-segmented" role="tablist" aria-label="Chart type">
            {CHART_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={chartType === t.id}
                className={`dp-seg-btn ${chartType === t.id ? 'is-active' : ''}`}
                onClick={() => setChartType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`dp-ghost-btn ${sortByValue ? 'is-toggled' : ''}`}
            onClick={() => setSortByValue((s) => !s)}
            title="Sort items by value"
          >
            Sort ↓
          </button>

          <button
            type="button"
            className={`dp-ghost-btn ${copiedChart ? 'is-toggled' : ''}`}
            onClick={handleCopyChart}
            disabled={!hasData}
            title="Copy chart image to clipboard"
          >
            {copiedChart ? 'Copied ✓' : 'Copy'}
          </button>

          <button
            type="button"
            className="dp-ghost-btn"
            onClick={handleExportPng}
            disabled={!hasData}
            title="Export chart as PNG"
          >
            PNG
          </button>

          {onExpand && (
            <button
              type="button"
              className="dp-icon-action-btn"
              onClick={onExpand}
              title={isModal ? 'Close popup' : 'Open Pivot Chart in popup'}
              aria-label={isModal ? 'Close popup' : 'Open Pivot Chart in popup'}
            >
              {isModal ? '×' : '⤢'}
            </button>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="dp-empty-state">
          Select pivot fields to visualize the chart.
        </div>
      ) : (
        <div className="dp-chart-body">
          <div className="dp-chart-subbar">
            <div className="dp-chart-legend">
              {(chartType === 'bar' || chartType === 'line') &&
                colCol &&
                seriesKeys.map((sKey, idx) => (
                  <span key={sKey} className="dp-legend-item">
                    <span
                      className="dp-legend-swatch"
                      style={{
                        backgroundColor:
                          APPLE_CHART_COLORS[idx % APPLE_CHART_COLORS.length],
                      }}
                    />
                    <span>{sKey}</span>
                  </span>
                ))}
            </div>
            <span
              className={`dp-hover-readout ${hoveredInfo ? 'is-visible' : ''}`}
              aria-live="polite"
            >
              {hoveredInfo ?? 'Hover chart for values'}
            </span>
          </div>

          {/* Vertical Grouped Bar Chart */}
          {chartType === 'bar' && (
            <div className="dp-svg-wrap">
              <svg
                ref={svgRef}
                viewBox="0 0 460 226"
                preserveAspectRatio="xMidYMid meet"
                className="dp-svg-chart"
                role="img"
                aria-label="Bar chart"
              >
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const y = 180 - t * 155;
                  return (
                    <g key={t}>
                      <line
                        x1="48"
                        y1={y}
                        x2="448"
                        y2={y}
                        stroke="#ececf0"
                        strokeWidth="1"
                      />
                      <text
                        x="42"
                        y={y + 3}
                        textAnchor="end"
                        className="dp-axis-label"
                      >
                        {formatCompactNumber(maxValue * t, valueFormat)}
                      </text>
                    </g>
                  );
                })}

                {orderedRows.map((rKey, rIdx) => {
                  const groupWidth = 396 / orderedRows.length;
                  const groupX = 52 + rIdx * groupWidth;
                  const innerPad = Math.min(12, groupWidth * 0.16);
                  const usableW = Math.max(8, groupWidth - innerPad * 2);
                  const barW = Math.max(
                    5,
                    (usableW - (seriesKeys.length - 1) * 3) / seriesKeys.length
                  );
                  const shortLabel =
                    rKey.length > 13 ? `${rKey.slice(0, 12)}…` : rKey;

                  return (
                    <g key={rKey}>
                      {seriesKeys.map((sKey, sIdx) => {
                        const val = getValue(rKey, sKey);
                        const h = (val / maxValue) * 155;
                        const x = groupX + innerPad + sIdx * (barW + 3);
                        const y = 180 - h;
                        const color =
                          APPLE_CHART_COLORS[sIdx % APPLE_CHART_COLORS.length];

                        return (
                          <rect
                            key={sKey}
                            x={x}
                            y={y}
                            width={barW}
                            height={Math.max(1, h)}
                            rx="3"
                            fill={color}
                            className="dp-chart-bar"
                            onMouseEnter={() =>
                              setHoveredInfo(
                                `${rKey}${colCol ? ` · ${sKey}` : ''}: ${formatCellValue(
                                  val,
                                  valueFormat
                                )}`
                              )
                            }
                            onMouseLeave={() => setHoveredInfo(null)}
                          />
                        );
                      })}
                      <text
                        x={groupX + groupWidth / 2}
                        y="202"
                        textAnchor="middle"
                        className="dp-axis-label"
                      >
                        {shortLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Horizontal Bar Chart (SVG so Export/Copy PNG works cleanly too!) */}
          {chartType === 'hbar' && (
            <div className="dp-svg-wrap">
              <svg
                ref={svgRef}
                viewBox={`0 0 460 ${Math.max(150, orderedRows.length * 36 + 18)}`}
                preserveAspectRatio="xMidYMid meet"
                className="dp-svg-chart"
                role="img"
                aria-label="Horizontal bar chart"
              >
                {orderedRows.map((rKey, idx) => {
                  const val = pivotResult.rowTotals[rKey] ?? 0;
                  const barW = Math.max(4, (val / maxValue) * 265);
                  const y = 16 + idx * 34;
                  const color =
                    APPLE_CHART_COLORS[idx % APPLE_CHART_COLORS.length];
                  const shortLabel =
                    rKey.length > 16 ? `${rKey.slice(0, 15)}…` : rKey;

                  return (
                    <g
                      key={rKey}
                      className="dp-chart-bar"
                      onMouseEnter={() =>
                        setHoveredInfo(
                          `${rKey}: ${formatCellValue(val, valueFormat)}`
                        )
                      }
                      onMouseLeave={() => setHoveredInfo(null)}
                    >
                      <text
                        x="118"
                        y={y + 11}
                        textAnchor="end"
                        className="dp-axis-label"
                      >
                        {shortLabel}
                      </text>
                      <rect
                        x="128"
                        y={y}
                        width="265"
                        height="14"
                        rx="7"
                        fill="#f0f0f5"
                      />
                      <rect
                        x="128"
                        y={y}
                        width={barW}
                        height="14"
                        rx="7"
                        fill={color}
                      />
                      <text
                        x="402"
                        y={y + 11}
                        textAnchor="start"
                        className="dp-axis-label"
                      >
                        {formatCompactNumber(val, valueFormat)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Line Chart */}
          {chartType === 'line' && (
            <div className="dp-svg-wrap">
              <svg
                ref={svgRef}
                viewBox="0 0 460 226"
                preserveAspectRatio="xMidYMid meet"
                className="dp-svg-chart"
                role="img"
                aria-label="Line chart"
              >
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const y = 180 - t * 155;
                  return (
                    <g key={t}>
                      <line
                        x1="48"
                        y1={y}
                        x2="448"
                        y2={y}
                        stroke="#ececf0"
                        strokeWidth="1"
                      />
                      <text
                        x="42"
                        y={y + 3}
                        textAnchor="end"
                        className="dp-axis-label"
                      >
                        {formatCompactNumber(maxValue * t, valueFormat)}
                      </text>
                    </g>
                  );
                })}

                {seriesKeys.map((sKey, sIdx) => {
                  const color =
                    APPLE_CHART_COLORS[sIdx % APPLE_CHART_COLORS.length];
                  const pts = orderedRows.map((rKey, rIdx) => {
                    const x =
                      orderedRows.length === 1
                        ? 250
                        : 68 + (rIdx / (orderedRows.length - 1)) * 364;
                    const val = getValue(rKey, sKey);
                    const y = 180 - (val / maxValue) * 155;
                    return { x, y, rKey, val };
                  });

                  const d = pts
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                    .join(' ');

                  return (
                    <g key={sKey}>
                      <path
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {pts.map((p) => (
                        <circle
                          key={p.rKey}
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="dp-chart-point"
                          onMouseEnter={() =>
                            setHoveredInfo(
                              `${p.rKey}${colCol ? ` · ${sKey}` : ''}: ${formatCellValue(
                                p.val,
                                valueFormat
                              )}`
                            )
                          }
                          onMouseLeave={() => setHoveredInfo(null)}
                        />
                      ))}
                    </g>
                  );
                })}

                {orderedRows.map((rKey, rIdx) => {
                  const x =
                    orderedRows.length === 1
                      ? 250
                      : 68 + (rIdx / (orderedRows.length - 1)) * 364;
                  const shortLabel =
                    rKey.length > 13 ? `${rKey.slice(0, 12)}…` : rKey;
                  return (
                    <text
                      key={rKey}
                      x={x}
                      y="202"
                      textAnchor="middle"
                      className="dp-axis-label"
                    >
                      {shortLabel}
                    </text>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Donut Chart */}
          {chartType === 'donut' && (() => {
            const total = orderedRows.reduce(
              (sum, rKey) => sum + (pivotResult.rowTotals[rKey] ?? 0),
              0
            );
            const radius = 64;
            const circumference = 2 * Math.PI * radius;
            let offset = 0;

            return (
              <div className="dp-donut-wrap">
                <svg
                  ref={svgRef}
                  viewBox="0 0 180 180"
                  className="dp-donut-svg"
                  role="img"
                  aria-label="Donut chart"
                >
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="#f0f0f5"
                    strokeWidth="24"
                  />
                  {orderedRows.map((rKey, idx) => {
                    const val = pivotResult.rowTotals[rKey] ?? 0;
                    const frac = total > 0 ? val / total : 0;
                    const dash = frac * circumference;
                    const sliceOffset = offset;
                    offset += dash;
                    const color =
                      APPLE_CHART_COLORS[idx % APPLE_CHART_COLORS.length];

                    return (
                      <circle
                        key={rKey}
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="24"
                        strokeDasharray={`${dash} ${circumference}`}
                        strokeDashoffset={-sliceOffset}
                        transform="rotate(-90 90 90)"
                        className="dp-donut-slice"
                        onMouseEnter={() =>
                          setHoveredInfo(
                            `${rKey}: ${formatCellValue(val, valueFormat)} (${(
                              frac * 100
                            ).toFixed(1)}%)`
                          )
                        }
                        onMouseLeave={() => setHoveredInfo(null)}
                      />
                    );
                  })}
                  <text
                    x="90"
                    y="87"
                    textAnchor="middle"
                    className="dp-donut-total-val"
                  >
                    {formatCompactNumber(total, valueFormat)}
                  </text>
                  <text
                    x="90"
                    y="102"
                    textAnchor="middle"
                    className="dp-donut-total-lbl"
                  >
                    {agg}
                  </text>
                </svg>

                <div className="dp-donut-legend">
                  {orderedRows.map((rKey, idx) => {
                    const val = pivotResult.rowTotals[rKey] ?? 0;
                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                    const color =
                      APPLE_CHART_COLORS[idx % APPLE_CHART_COLORS.length];
                    return (
                      <div key={rKey} className="dp-donut-legend-row">
                        <span
                          className="dp-legend-swatch"
                          style={{ backgroundColor: color }}
                        />
                        <span className="dp-donut-legend-name">{rKey}</span>
                        <span className="dp-donut-legend-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
