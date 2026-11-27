import { useEffect, useMemo, useRef, useState } from 'react';
import {
  COMPONENT_FAMILIES,
  DASHBOARD_DATA_BY_FAMILY,
  generateDeterministicSummary,
  MAP_LANES,
  MAP_NODES,
} from '../../data/supplyDashboardData';
import { exportChartSvgPng, exportFullDashboardPng } from './exportUtils';
import { SupplyFlowMap } from './SupplyFlowMap';

const NOTES_STORAGE_KEY = 'isearch_supply_dashboard_notes_v1';
const LAYOUT_STORAGE_KEY = 'isearch_supply_dashboard_layout_v1';
const KPI_ORDER_STORAGE_KEY = 'isearch_supply_dashboard_kpis_v1';

const DEFAULT_KPI_ORDER = ['fill', 'transit', 'dos', 'otif'];

const NODE_NAMES = Object.fromEntries(MAP_NODES.map((n) => [n.id, n.name]));

const WIDGET_META = {
  map: {
    id: 'map',
    title: 'Global Apple Parts Flow',
    sub: 'Suppliers → Assembly → End Markets',
    defaultSpan: 7,
  },
  donut: {
    id: 'donut',
    title: 'Sourcing Allocation',
    sub: 'Regional share (%)',
    defaultSpan: 5,
  },
  plan: {
    id: 'plan',
    title: 'Supply vs Demand Plan',
    sub: 'W41–W48 Supply, Demand & Buffer',
    defaultSpan: 5,
  },
  capacity: {
    id: 'capacity',
    title: 'Plant Capacity & Bottlenecks',
    sub: 'Utilization vs 90% threshold',
    defaultSpan: 4,
  },
  notes: {
    id: 'notes',
    title: 'Notepad & Summary',
    sub: 'Notes & auto brief',
    defaultSpan: 3,
  },
  sla: {
    id: 'sla',
    title: 'Lane SLA & Risk Watch',
    sub: 'Active transit health',
    defaultSpan: 4,
  },
};

const ALL_WIDGET_IDS = Object.keys(WIDGET_META);

const DEFAULT_LAYOUT = [
  { id: 'map', span: 7 },
  { id: 'donut', span: 5 },
  { id: 'plan', span: 5 },
  { id: 'capacity', span: 4 },
  { id: 'notes', span: 3 },
];

export function SupplyDashboard() {
  const [familyId, setFamilyId] = useState('all');
  const [hoveredWeek, setHoveredWeek] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [noteTab, setNoteTab] = useState('notes');
  const [expandedWidgetId, setExpandedWidgetId] = useState(null);
  const [dragState, setDragState] = useState(null); // { source: 'grid'|'dock', id }
  const [dropTargetId, setDropTargetId] = useState(null);
  const [gridDropActive, setGridDropActive] = useState(false);
  const [dockDropActive, setDockDropActive] = useState(false);
  const [resizingInfo, setResizingInfo] = useState(null); // { id, span }
  const [showGridGuide, setShowGridGuide] = useState(false);

  const gridRef = useRef(null);

  const [layout, setLayout] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY) || 'null');
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {
      // Fall back to default
    }
    return DEFAULT_LAYOUT;
  });

  const [kpiOrder, setKpiOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KPI_ORDER_STORAGE_KEY) || 'null');
      if (Array.isArray(saved)) return saved;
    } catch {
      // Fall back to default
    }
    return DEFAULT_KPI_ORDER;
  });
  const [kpiDropTargetId, setKpiDropTargetId] = useState(null);

  const [notes, setNotes] = useState(() => {
    try {
      return (
        localStorage.getItem(NOTES_STORAGE_KEY) ||
        '• W45 Watch: Confirm Hsinchu → Chennai A18 air-freight slot.\n• Zhengzhou utilization at 92% — review weekend shift buffer.'
      );
    } catch {
      return '';
    }
  });
  const [copyToast, setCopyToast] = useState('');

  const mapSvgRef = useRef(null);
  const planSvgRef = useRef(null);
  const donutSvgRef = useRef(null);
  const capacitySvgRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, notes);
    } catch {
      // Ignore storage errors
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Ignore storage errors
    }
  }, [layout]);

  useEffect(() => {
    try {
      localStorage.setItem(KPI_ORDER_STORAGE_KEY, JSON.stringify(kpiOrder));
    } catch {
      // Ignore storage errors
    }
  }, [kpiOrder]);

  const familyLabel =
    COMPONENT_FAMILIES.find((f) => f.id === familyId)?.label ?? 'All Parts';
  const data = DASHBOARD_DATA_BY_FAMILY[familyId] ?? DASHBOARD_DATA_BY_FAMILY.all;

  const activeLanes = useMemo(
    () =>
      familyId === 'all'
        ? MAP_LANES
        : MAP_LANES.filter((l) => l.family === familyId || l.family === 'all'),
    [familyId]
  );

  const generatedSummary = useMemo(
    () => generateDeterministicSummary(familyId, familyLabel, data, activeLanes),
    [familyId, familyLabel, data, activeLanes]
  );

  const activeIds = new Set(layout.map((w) => w.id));
  const dockedIds = ALL_WIDGET_IDS.filter((id) => !activeIds.has(id));
  const kpiMap = Object.fromEntries(data.kpis.map((k) => [k.id, k]));
  const visibleKpis = kpiOrder.map((id) => kpiMap[id]).filter(Boolean);
  const dockedKpis = data.kpis.filter((k) => !kpiOrder.includes(k.id));

  function flashToast(msg) {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(''), 1800);
  }

  function handleStartResize(e, leftWidgetId, rightWidgetId, leftSpan, rightSpan) {
    e.preventDefault();
    e.stopPropagation();
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const startX = e.clientX;
    const colWidth = gridEl.getBoundingClientRect().width / 12;
    const totalPairSpan = leftSpan + rightSpan;
    setResizingInfo({ id: leftWidgetId, span: leftSpan });

    function onMove(moveEvent) {
      const deltaCols = Math.round((moveEvent.clientX - startX) / colWidth);
      if (rightWidgetId) {
        const minSpan = 3;
        const maxLeft = totalPairSpan - minSpan;
        const nextLeft = Math.max(minSpan, Math.min(maxLeft, leftSpan + deltaCols));
        const nextRight = totalPairSpan - nextLeft;
        setResizingInfo({ id: leftWidgetId, span: nextLeft });
        setLayout((prev) =>
          prev.map((w) => {
            if (w.id === leftWidgetId) return { ...w, span: nextLeft };
            if (w.id === rightWidgetId) return { ...w, span: nextRight };
            return w;
          })
        );
      } else {
        const snapped = Math.max(3, Math.min(totalPairSpan, leftSpan + deltaCols));
        setResizingInfo({ id: leftWidgetId, span: snapped });
        setLayout((prev) =>
          prev.map((w) => (w.id === leftWidgetId ? { ...w, span: snapped } : w))
        );
      }
    }

    function onUp() {
      setResizingInfo(null);
      setShowGridGuide(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function handleMinimizeWidget(widgetId) {
    if (expandedWidgetId === widgetId) setExpandedWidgetId(null);
    setLayout((prev) => prev.filter((w) => w.id !== widgetId));
  }

  function handleDropOnDock(e) {
    e.preventDefault();
    const raw = dragState;
    setDragState(null);
    setDropTargetId(null);
    setKpiDropTargetId(null);
    setGridDropActive(false);
    setDockDropActive(false);
    if (raw?.source === 'grid') {
      handleMinimizeWidget(raw.id);
    } else if (raw?.source === 'kpi') {
      setKpiOrder((prev) => prev.filter((id) => id !== raw.id));
    }
  }

  function handleDropOnKpi(e, targetKpiId) {
    e.preventDefault();
    const raw = dragState;
    setDragState(null);
    setKpiDropTargetId(null);
    setDockDropActive(false);
    if (!raw || raw.id === targetKpiId) return;

    if (raw.source === 'dock-kpi') {
      setKpiOrder((prev) => {
        if (prev.includes(raw.id)) return prev;
        const idx = prev.indexOf(targetKpiId);
        const next = [...prev];
        next.splice(idx === -1 ? next.length : idx, 0, raw.id);
        return next;
      });
      return;
    }

    if (raw.source === 'kpi') {
      setKpiOrder((prev) => {
        const fromIdx = prev.indexOf(raw.id);
        const toIdx = prev.indexOf(targetKpiId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        return next;
      });
    }
  }

  function handleRestoreKpi(kpiId) {
    setKpiOrder((prev) => (prev.includes(kpiId) ? prev : [...prev, kpiId]));
  }

  function handleAddFromDock(widgetId, insertBeforeId = null) {
    if (activeIds.has(widgetId)) return;
    const item = { id: widgetId, span: WIDGET_META[widgetId]?.defaultSpan ?? 4 };
    setLayout((prev) => {
      if (!insertBeforeId) return [...prev, item];
      const idx = prev.findIndex((w) => w.id === insertBeforeId);
      if (idx === -1) return [...prev, item];
      const copy = [...prev];
      copy.splice(idx, 0, item);
      return copy;
    });
  }

  function handleDropOnTile(e, targetId) {
    e.preventDefault();
    e.stopPropagation();
    const raw = dragState;
    setDragState(null);
    setDropTargetId(null);
    setGridDropActive(false);
    if (!raw || raw.id === targetId) return;

    if (raw.source === 'dock') {
      handleAddFromDock(raw.id, targetId);
      return;
    }

    // Reorder / swap within grid
    setLayout((prev) => {
      const fromIdx = prev.findIndex((w) => w.id === raw.id);
      const toIdx = prev.findIndex((w) => w.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }

  function handleDropOnGridCanvas(e) {
    e.preventDefault();
    const raw = dragState;
    setDragState(null);
    setDropTargetId(null);
    setGridDropActive(false);
    if (raw?.source === 'dock') {
      handleAddFromDock(raw.id);
    }
  }

  function handleResetLayout() {
    setExpandedWidgetId(null);
    setLayout(DEFAULT_LAYOUT);
    setKpiOrder(DEFAULT_KPI_ORDER);
    flashToast('Layout reset');
  }

  function handleDownloadNotes() {
    const blob = new Blob([notes || generatedSummary], {
      type: 'text/plain;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iSearch_Planning_Notes_${familyId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Supply vs Demand chart math
  const maxBar = Math.max(
    ...data.weeklyPlan.flatMap((w) => [w.supply, w.demand]),
    1
  );
  const maxBuf = Math.max(...data.weeklyPlan.map((w) => w.buffer), 25);
  const minBuf = Math.min(...data.weeklyPlan.map((w) => w.buffer), 14);

  // Donut chart geometry
  const donutRadius = 46;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let donutOffset = 0;
  const donutSegments = data.sourcingMix.map((slice) => {
    const len = (slice.value / 100) * donutCircumference;
    const seg = { ...slice, len, offset: donutOffset };
    donutOffset += len;
    return seg;
  });
  const activeDonut = hoveredSlice
    ? data.sourcingMix.find((s) => s.label === hoveredSlice)
    : null;

  function renderWidgetBody(widgetId) {
    switch (widgetId) {
      case 'map':
        return <SupplyFlowMap lanes={activeLanes} svgRef={mapSvgRef} />;

      case 'plan':
        return (
          <div className="sc-chart-body">
            <svg
              ref={planSvgRef}
              className="sc-plan-svg"
              viewBox="0 0 640 175"
              preserveAspectRatio="xMidYMid meet"
            >
              {[30, 72, 114, 150].map((y) => (
                <line
                  key={y}
                  x1="34"
                  y1={y}
                  x2="622"
                  y2={y}
                  stroke="#f0f0f5"
                  strokeWidth="1"
                />
              ))}
              {data.weeklyPlan.map((w, idx) => {
                const slotW = 580 / data.weeklyPlan.length;
                const gx = 42 + idx * slotW;
                const supH = (w.supply / maxBar) * 116;
                const demH = (w.demand / maxBar) * 116;
                const isHov = hoveredWeek?.week === w.week;
                return (
                  <g
                    key={w.week}
                    onMouseEnter={() => setHoveredWeek(w)}
                    onMouseLeave={() => setHoveredWeek(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={gx - 4}
                      y={20}
                      width={slotW - 4}
                      height={145}
                      fill={isHov ? '#f5f9ff' : 'transparent'}
                      rx="6"
                    />
                    <rect
                      x={gx + 6}
                      y={150 - supH}
                      width={16}
                      height={supH}
                      rx="4"
                      fill="#0071E3"
                      opacity={isHov ? 1 : 0.88}
                    />
                    <rect
                      x={gx + 25}
                      y={150 - demH}
                      width={16}
                      height={demH}
                      rx="4"
                      fill="#D2D2D7"
                    />
                    <text
                      x={gx + 23}
                      y={166}
                      textAnchor="middle"
                      fontSize="10.5"
                      fill="#6e6e73"
                      fontWeight={isHov ? '700' : '500'}
                    >
                      {w.week}
                    </text>
                  </g>
                );
              })}
              <polyline
                fill="none"
                stroke="#34C759"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={data.weeklyPlan
                  .map((w, idx) => {
                    const slotW = 580 / data.weeklyPlan.length;
                    const cx = 42 + idx * slotW + 23;
                    const norm =
                      (w.buffer - minBuf) / Math.max(1, maxBuf - minBuf);
                    const cy = 112 - norm * 78;
                    return `${cx},${cy}`;
                  })
                  .join(' ')}
              />
              {data.weeklyPlan.map((w, idx) => {
                const slotW = 580 / data.weeklyPlan.length;
                const cx = 42 + idx * slotW + 23;
                const norm =
                  (w.buffer - minBuf) / Math.max(1, maxBuf - minBuf);
                const cy = 112 - norm * 78;
                return (
                  <circle
                    key={w.week}
                    cx={cx}
                    cy={cy}
                    r={hoveredWeek?.week === w.week ? 4.5 : 3}
                    fill="#34C759"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
          </div>
        );

      case 'donut':
        return (
          <div className="sc-donut-layout">
            <svg
              ref={donutSvgRef}
              className="sc-donut-svg"
              viewBox="0 0 280 120"
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <g transform="translate(64, 60) rotate(-90)">
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.label}
                    r={donutRadius}
                    cx="0"
                    cy="0"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={hoveredSlice === seg.label ? 17 : 14}
                    strokeDasharray={`${seg.len} ${donutCircumference}`}
                    strokeDashoffset={-seg.offset}
                    style={{
                      cursor: 'pointer',
                      transition: 'stroke-width 150ms ease',
                    }}
                    onMouseEnter={() => setHoveredSlice(seg.label)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                ))}
              </g>
              <text
                x="64"
                y="56"
                textAnchor="middle"
                fontSize="16"
                fontWeight="700"
                fill="#1d1d1f"
              >
                {activeDonut ? `${activeDonut.value}%` : '100%'}
              </text>
              <text
                x="64"
                y="71"
                textAnchor="middle"
                fontSize="9.5"
                fill="#6e6e73"
              >
                {activeDonut ? activeDonut.label : 'Allocated'}
              </text>
              {data.sourcingMix.map((s, idx) => (
                <g
                  key={s.label}
                  transform={`translate(142, ${18 + idx * 20})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredSlice(s.label)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <rect width="8" height="8" rx="2.5" fill={s.color} y="-7" />
                  <text
                    x="14"
                    y="0"
                    fontSize="10.5"
                    fill="#3a3a3c"
                    fontWeight="500"
                  >
                    {s.label}
                  </text>
                  <text
                    x="126"
                    y="0"
                    textAnchor="end"
                    fontSize="10.5"
                    fill="#1d1d1f"
                    fontWeight="700"
                  >
                    {s.value}%
                  </text>
                </g>
              ))}
            </svg>
          </div>
        );

      case 'capacity':
        return (
          <div className="sc-cap-body">
            <svg
              ref={capacitySvgRef}
              className="sc-cap-svg"
              viewBox="0 0 360 128"
            >
              {data.plantCapacity.map((p, idx) => {
                const y = 12 + idx * 24;
                const barX = 126;
                const barW = 172;
                const fillW = (p.util / 100) * barW;
                const barColor =
                  p.util >= 90
                    ? '#FF3B30'
                    : p.util >= 85
                    ? '#FF9500'
                    : '#0071E3';
                const targetX = barX + (p.target / 100) * barW;
                return (
                  <g key={p.name}>
                    <text
                      x="4"
                      y={y + 10}
                      fontSize="10.5"
                      fill="#1d1d1f"
                      fontWeight="500"
                    >
                      {p.name}
                    </text>
                    <rect
                      x={barX}
                      y={y + 2}
                      width={barW}
                      height="9"
                      rx="4.5"
                      fill="#ececf2"
                    />
                    <rect
                      x={barX}
                      y={y + 2}
                      width={fillW}
                      height="9"
                      rx="4.5"
                      fill={barColor}
                    />
                    <line
                      x1={targetX}
                      y1={y}
                      x2={targetX}
                      y2={y + 13}
                      stroke="#1d1d1f"
                      strokeWidth="1.2"
                      strokeDasharray="2 1.5"
                    />
                    <text
                      x="354"
                      y={y + 10}
                      textAnchor="end"
                      fontSize="10.5"
                      fontWeight="700"
                      fill={barColor}
                    >
                      {p.util}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        );

      case 'notes':
        return (
          <div className="sc-notes-inner">
            <div className="sc-notes-toolbar">
              <div className="sc-note-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={noteTab === 'notes'}
                  className={`sc-note-tab ${noteTab === 'notes' ? 'is-active' : ''}`}
                  onClick={() => setNoteTab('notes')}
                >
                  Notepad
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={noteTab === 'summary'}
                  className={`sc-note-tab ${noteTab === 'summary' ? 'is-active' : ''}`}
                  onClick={() => setNoteTab('summary')}
                >
                  Summary
                </button>
              </div>
              <div className="sc-note-actions">
                {noteTab === 'notes' ? (
                  <>
                    <button
                      type="button"
                      className="sc-mini-export"
                      onClick={() => {
                        const snap = `\n[${familyLabel}] Fill ${data.kpis[0].value} | DoS ${data.kpis[2].value} | OTIF ${data.kpis[3].value}`;
                        setNotes((prev) => `${prev}${snap}`);
                      }}
                    >
                      + KPI
                    </button>
                    <button
                      type="button"
                      className="sc-mini-export"
                      onClick={handleDownloadNotes}
                    >
                      .TXT
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="sc-mini-export"
                      onClick={() => {
                        setNotes((prev) =>
                          prev
                            ? `${prev}\n\n${generatedSummary}`
                            : generatedSummary
                        );
                        setNoteTab('notes');
                        flashToast('Added to Notepad');
                      }}
                    >
                      + Notes
                    </button>
                    <button
                      type="button"
                      className="sc-mini-export"
                      onClick={() => {
                        navigator.clipboard?.writeText(generatedSummary);
                        flashToast('Brief copied');
                      }}
                    >
                      Copy
                    </button>
                  </>
                )}
              </div>
            </div>
            {noteTab === 'notes' ? (
              <textarea
                className="sc-notepad-area"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jot supply chain callouts or expediting decisions..."
              />
            ) : (
              <div className="sc-summary-box">
                <pre className="sc-summary-pre">{generatedSummary}</pre>
              </div>
            )}
          </div>
        );

      case 'sla':
        return (
          <div className="sc-sla-list">
            {activeLanes.map((l) => (
              <div key={l.id} className="sc-sla-row">
                <div className="sc-sla-route">
                  <strong>
                    {(NODE_NAMES[l.from] || l.from).split(' ')[0]} →{' '}
                    {(NODE_NAMES[l.to] || l.to).split(' ')[0]}
                  </strong>
                  <span>{l.part}</span>
                </div>
                <span className="sc-sla-vol">
                  {(l.volumeK / 1000).toFixed(2)}M · {l.transitDays}d
                </span>
                <span className={`sc-sla-badge is-${l.status}`}>
                  {l.status === 'watch' ? 'Watch' : 'On Time'}
                </span>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  }

  function handleExportWidgetPng(widgetId) {
    const refMap = {
      map: mapSvgRef.current,
      plan: planSvgRef.current,
      donut: donutSvgRef.current,
      capacity: capacitySvgRef.current,
    };
    const svgEl = refMap[widgetId];
    if (!svgEl) return;
    exportChartSvgPng(
      svgEl,
      `${WIDGET_META[widgetId].title} — ${familyLabel}`,
      `iSearch_${widgetId}_${familyId}.png`
    );
  }

  const visibleLayout = expandedWidgetId
    ? layout.filter((w) => w.id === expandedWidgetId)
    : layout;

  return (
    <div className="sc-dashboard sc-dashboard--modular">
      {/* Top Filter & Export Control Strip */}
      <div className="sc-topbar">
        <div
          className="sc-filter-group"
          role="tablist"
          aria-label="Component family"
        >
          {COMPONENT_FAMILIES.map((fam) => (
            <button
              key={fam.id}
              type="button"
              role="tab"
              aria-selected={familyId === fam.id}
              className={`sc-fam-pill ${familyId === fam.id ? 'is-active' : ''}`}
              onClick={() => setFamilyId(fam.id)}
            >
              {fam.label}
            </button>
          ))}
        </div>

        <div className="sc-topbar-right">
          {copyToast && <span className="sc-toast">{copyToast}</span>}
          <span className="sc-horizon-tag">W41–W48 · Drag to Grid</span>
          <button
            type="button"
            className="sc-export-all-btn"
            onClick={() =>
              exportFullDashboardPng({
                familyLabel,
                kpis: data.kpis,
                mapSvg: mapSvgRef.current,
                planSvg: planSvgRef.current,
                donutSvg: donutSvgRef.current,
                capacitySvg: capacitySvgRef.current,
                summaryText: generatedSummary,
              })
            }
          >
            Export Dashboard PNG ↓
          </button>
        </div>
      </div>

      {/* Draggable & Dockable KPI Metric Strip */}
      {visibleKpis.length > 0 && (
        <div
          className="sc-kpi-row"
          style={{
            gridTemplateColumns: `repeat(${visibleKpis.length}, minmax(0, 1fr))`,
          }}
        >
          {visibleKpis.map((k) => (
            <div
              key={k.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', k.id);
                e.dataTransfer.effectAllowed = 'move';
                setDragState({ source: 'kpi', id: k.id });
              }}
              onDragEnd={() => {
                setDragState(null);
                setKpiDropTargetId(null);
                setDockDropActive(false);
              }}
              onDragOver={(e) => {
                if (
                  dragState?.source === 'kpi' ||
                  dragState?.source === 'dock-kpi'
                ) {
                  e.preventDefault();
                  if (dragState.id !== k.id) setKpiDropTargetId(k.id);
                }
              }}
              onDragLeave={() => {
                if (kpiDropTargetId === k.id) setKpiDropTargetId(null);
              }}
              onDrop={(e) => handleDropOnKpi(e, k.id)}
              className={`sc-kpi-card sc-kpi-card--draggable ${
                kpiDropTargetId === k.id ? 'is-kpi-drop-target' : ''
              } ${
                dragState?.source === 'kpi' && dragState.id === k.id
                  ? 'is-tile-dragging'
                  : ''
              }`}
              title="Drag to reorder KPIs or drag down to Component Dock"
            >
              <div className="sc-kpi-top">
                <span className="sc-tile-grip" aria-hidden="true">
                  ⋮⋮
                </span>
                <span className="sc-kpi-label">{k.label}</span>
              </div>
              <div className="sc-kpi-vals">
                <strong className="sc-kpi-value">{k.value}</strong>
                <span className={`sc-kpi-delta is-${k.tone}`}>{k.delta}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modular 12-Column Non-Scrolling Drag-to-Grid Canvas */}
      <div
        ref={gridRef}
        className={`sc-modular-grid ${
          expandedWidgetId ? 'is-expanded-mode' : ''
        } ${gridDropActive ? 'is-drop-zone' : ''} ${
          resizingInfo ? 'is-resizing-grid' : ''
        } ${
          resizingInfo || dragState || showGridGuide ? 'show-grid-ref' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (dragState?.source === 'dock') setGridDropActive(true);
        }}
        onDragLeave={() => setGridDropActive(false)}
        onDrop={handleDropOnGridCanvas}
      >
        {/* Subtle 12-Column Snap-to-Grid Reference Lines & Numbers */}
        {!expandedWidgetId && (
          <div className="sc-grid-ref-overlay" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="sc-grid-ref-col">
                <span className="sc-grid-ref-num">{i + 1}</span>
              </div>
            ))}
          </div>
        )}
        {visibleLayout.length === 0 ? (
          <div className="sc-empty-grid">
            Drag a component from the bottom dock into the grid (or click Reset
            Layout).
          </div>
        ) : (
          (() => {
            let rowUsed = 0;
            return visibleLayout.map((item, idx) => {
              if (rowUsed + item.span > 12) rowUsed = 0;
              const rowStartCol = rowUsed;
              const rowEndCol = rowStartCol + item.span;
              const nextItem = visibleLayout[idx + 1] ?? null;
              const hasRightNeighbor =
                !expandedWidgetId &&
                Boolean(nextItem) &&
                rowEndCol + nextItem.span <= 12;
              const canDragRightEdge =
                !expandedWidgetId && (hasRightNeighbor || rowEndCol < 12);
              rowUsed = rowEndCol >= 12 ? 0 : rowEndCol;

              const meta = WIDGET_META[item.id];
              const isExpanded = expandedWidgetId === item.id;
              const hasPng = ['map', 'plan', 'donut', 'capacity'].includes(
                item.id
              );
              const subtitle =
                item.id === 'plan' && hoveredWeek
                  ? `${hoveredWeek.week}: Sup ${hoveredWeek.supply}K · Dem ${hoveredWeek.demand}K · ${hoveredWeek.buffer}d`
                  : meta.sub;

              return (
                <section
                  key={item.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragState && dragState.id !== item.id) {
                      setDropTargetId(item.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dropTargetId === item.id) setDropTargetId(null);
                  }}
                  onDrop={(e) => handleDropOnTile(e, item.id)}
                  style={{
                    gridColumn: isExpanded ? 'span 12' : `span ${item.span}`,
                  }}
                  className={`sc-card sc-tile ${
                    dropTargetId === item.id ? 'is-tile-drop-target' : ''
                  } ${dragState?.id === item.id ? 'is-tile-dragging' : ''}`}
                  aria-label={meta.title}
                >
                  <div className="sc-tile-clip">
                    <div
                      className="sc-card-head sc-tile-head"
                      draggable={!isExpanded}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDragState({ source: 'grid', id: item.id });
                      }}
                      onDragEnd={() => {
                        setDragState(null);
                        setDropTargetId(null);
                        setGridDropActive(false);
                        setDockDropActive(false);
                      }}
                    >
                      <div className="sc-card-title-group">
                        <span
                          className="sc-tile-grip"
                          title="Drag to reorder tile on grid"
                          aria-hidden="true"
                        >
                          ⋮⋮
                        </span>
                        <h3 className="sc-card-title">{meta.title}</h3>
                        <span className="sc-card-sub">{subtitle}</span>
                      </div>

                      <div className="sc-tile-controls">
                        {resizingInfo?.id === item.id && (
                          <span className="sc-snap-badge">
                            {resizingInfo.span}/12
                          </span>
                        )}
                        {hasPng && (
                          <button
                            type="button"
                            className="sc-mini-export"
                            onClick={() => handleExportWidgetPng(item.id)}
                            title="Export this chart as PNG"
                          >
                            PNG ↓
                          </button>
                        )}
                        <button
                          type="button"
                          className="sc-tile-btn"
                          onClick={() =>
                            setExpandedWidgetId(isExpanded ? null : item.id)
                          }
                          title={
                            isExpanded
                              ? 'Restore grid view'
                              : 'Expand full screen'
                          }
                          aria-label={
                            isExpanded
                              ? 'Restore grid view'
                              : 'Expand full screen'
                          }
                        >
                          {isExpanded ? '×' : '⤢'}
                        </button>
                        <button
                          type="button"
                          className="sc-tile-btn"
                          onClick={() => handleMinimizeWidget(item.id)}
                          title="Minimize to bottom component dock"
                          aria-label={`Minimize ${meta.title}`}
                        >
                          –
                        </button>
                      </div>
                    </div>

                    {renderWidgetBody(item.id)}
                  </div>

                  {/* Centered Gutter Resize Pill (Between Adjacent Cards OR Into Open Grid Columns) */}
                  {canDragRightEdge && (
                    <div
                      className={`sc-resize-edge ${
                        resizingInfo?.id === item.id ? 'is-active' : ''
                      }`}
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${meta.title}`}
                      title="Drag left or right to snap to 12-column grid"
                      onMouseEnter={() => setShowGridGuide(true)}
                      onMouseLeave={() => setShowGridGuide(false)}
                      onMouseDown={(e) =>
                        handleStartResize(
                          e,
                          item.id,
                          hasRightNeighbor ? nextItem.id : null,
                          item.span,
                          hasRightNeighbor ? nextItem.span : 12 - rowEndCol
                        )
                      }
                    />
                  )}
                </section>
              );
            });
          })()
        )}
      </div>

      {/* Bottom Component Dock (Drag-In to Add, OR Drag Tile/KPI Down Here to Dock!) */}
      <div
        className={`sc-dock ${dockDropActive ? 'is-dock-drop-active' : ''}`}
        aria-label="Component dock"
        onDragOver={(e) => {
          e.preventDefault();
          if (dragState?.source === 'grid' || dragState?.source === 'kpi') {
            setDockDropActive(true);
          }
        }}
        onDragLeave={() => setDockDropActive(false)}
        onDrop={handleDropOnDock}
      >
        <span className="sc-dock-label">
          {dockDropActive ? 'Drop here to dock component' : 'Component Dock'}
        </span>

        <div className="sc-dock-pills">
          {dockedIds.length === 0 && dockedKpis.length === 0 ? (
            <span className="sc-dock-empty">
              All components active — drag any card or KPI down here to dock.
            </span>
          ) : (
            <>
              {dockedKpis.map((k) => (
                <button
                  key={`kpi-${k.id}`}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', k.id);
                    e.dataTransfer.effectAllowed = 'copy';
                    setDragState({ source: 'dock-kpi', id: k.id });
                  }}
                  onDragEnd={() => {
                    setDragState(null);
                    setKpiDropTargetId(null);
                  }}
                  className="sc-dock-pill sc-dock-pill--kpi"
                  onClick={() => handleRestoreKpi(k.id)}
                  title={`Drag up to KPI strip or click to restore ${k.label}`}
                >
                  <span className="sc-dock-grip" aria-hidden="true">
                    ⋮⋮
                  </span>
                  <span>+ KPI: {k.label}</span>
                </button>
              ))}
              {dockedIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', id);
                    e.dataTransfer.effectAllowed = 'copy';
                    setDragState({ source: 'dock', id });
                  }}
                  onDragEnd={() => {
                    setDragState(null);
                    setDropTargetId(null);
                    setGridDropActive(false);
                  }}
                  className="sc-dock-pill"
                  onClick={() => handleAddFromDock(id)}
                  title={`Drag onto grid or click to add ${WIDGET_META[id].title}`}
                >
                  <span className="sc-dock-grip" aria-hidden="true">
                    ⋮⋮
                  </span>
                  <span>+ {WIDGET_META[id].title}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <button
          type="button"
          className="sc-dock-reset"
          onClick={handleResetLayout}
        >
          Reset Layout
        </button>
      </div>
    </div>
  );
}
