import { useRef, useState } from 'react';
import { MAP_NODES } from '../../data/supplyDashboardData';

const NODE_MAP = Object.fromEntries(MAP_NODES.map((n) => [n.id, n]));

const ROLE_COLORS = {
  supplier: '#0071E3',
  assembly: '#AF52DE',
  market: '#34C759',
};

function buildCurvePath(from, to, arcOffset = -34) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2 + arcOffset;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

// Accurate low-poly Natural-Earth-style Equirectangular continents (1000x430)
const WORLD_LAND_PATHS = [
  // North America + Central America
  'M 42 52 L 92 42 L 132 56 L 164 46 L 210 56 L 244 74 L 236 96 L 260 104 L 284 96 L 318 106 L 336 124 L 304 136 L 288 156 L 274 176 L 266 178 L 262 164 L 246 164 L 234 178 L 228 192 L 240 202 L 258 214 L 272 228 L 278 234 L 268 236 L 250 222 L 232 212 L 212 198 L 194 186 L 184 166 L 166 154 L 154 132 L 146 106 L 122 86 L 96 80 L 66 84 L 46 72 Z',
  // Greenland
  'M 342 22 L 408 16 L 444 26 L 430 56 L 398 76 L 372 68 L 352 46 Z',
  // Cuba / Caribbean
  'M 264 190 L 288 192 L 292 198 L 266 196 Z',
  // South America
  'M 278 234 L 302 224 L 332 232 L 364 248 L 398 268 L 404 288 L 386 318 L 366 342 L 348 368 L 332 396 L 318 418 L 304 416 L 298 386 L 298 346 L 294 314 L 274 284 L 272 256 Z',
  // UK & Ireland
  'M 471 95 L 478 96 L 477 104 L 470 103 Z',
  'M 482 82 L 492 84 L 496 104 L 484 106 L 480 94 Z',
  // Iceland
  'M 432 58 L 452 58 L 450 67 L 434 66 Z',
  // Mainland Europe
  'M 476 126 L 494 126 L 502 114 L 516 106 L 522 84 L 538 56 L 564 46 L 584 52 L 588 68 L 570 76 L 554 96 L 564 104 L 584 102 L 604 114 L 614 128 L 586 136 L 566 132 L 552 146 L 542 132 L 534 146 L 522 138 L 516 128 L 502 136 L 492 146 L 476 144 Z',
  // Africa
  'M 472 152 L 516 148 L 542 158 L 574 162 L 594 168 L 614 202 L 636 226 L 642 234 L 622 262 L 608 296 L 594 334 L 568 358 L 548 356 L 534 322 L 528 286 L 516 254 L 494 246 L 466 244 L 450 226 L 452 204 L 466 176 Z',
  // Madagascar
  'M 624 304 L 634 302 L 632 332 L 620 330 Z',
  // Asia + Middle East + India + SE Asia
  'M 578 134 L 612 128 L 632 144 L 656 164 L 664 186 L 640 202 L 618 196 L 602 172 L 614 152 L 636 146 L 664 150 L 684 170 L 702 184 L 716 218 L 724 236 L 736 214 L 748 190 L 764 198 L 774 224 L 786 248 L 794 248 L 788 220 L 802 222 L 804 202 L 818 190 L 834 176 L 840 156 L 826 144 L 844 136 L 854 150 L 860 142 L 856 124 L 876 112 L 892 84 L 928 76 L 952 62 L 910 48 L 832 38 L 744 34 L 658 44 L 606 52 L 584 68 L 584 102 L 604 114 L 614 128 Z',
  // Sri Lanka
  'M 726 236 L 732 238 L 730 246 L 725 244 Z',
  // Taiwan
  'M 835 182 L 841 182 L 840 192 L 835 190 Z',
  // Japan
  'M 886 122 L 900 120 L 902 132 L 888 134 Z',
  'M 888 136 L 896 148 L 882 158 L 868 162 L 866 154 L 882 146 Z',
  // Philippines
  'M 834 202 L 844 204 L 848 226 L 838 228 L 834 214 Z',
  // Indonesia
  'M 768 242 L 792 268 L 786 274 L 762 248 Z',
  'M 796 274 L 828 280 L 826 286 L 794 280 Z',
  'M 806 244 L 826 242 L 828 264 L 808 266 Z',
  'M 834 252 L 844 254 L 842 270 L 834 268 Z',
  // Papua New Guinea
  'M 874 266 L 908 274 L 904 284 L 870 274 Z',
  // Australia
  'M 818 308 L 856 292 L 892 296 L 922 326 L 926 356 L 904 378 L 876 376 L 854 362 L 820 364 L 812 338 Z',
  // New Zealand
  'M 956 372 L 966 378 L 952 404 L 942 398 Z',
];

const BASE_W = 1000;
const BASE_H = 430;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function SupplyFlowMap({ lanes, svgRef }) {
  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(1.15);
  const [center, setCenter] = useState({ x: 545, y: 178 });
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef(null);

  const vbW = BASE_W / zoom;
  const vbH = BASE_H / zoom;
  const vbX = clamp(center.x - vbW / 2, 0, BASE_W - vbW);
  const vbY = clamp(center.y - vbH / 2, 0, BASE_H - vbH);

  function handleZoomBy(factor) {
    setZoom((z) => clamp(Number((z * factor).toFixed(2)), 1, 4));
  }

  function handleResetView() {
    setZoom(1.15);
    setCenter({ x: 545, y: 178 });
  }

  function handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.16 : 0.86;
    handleZoomBy(factor);
  }

  function handleMouseDown(e) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const el = viewportRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCenter = { x: vbX + vbW / 2, y: vbY + vbH / 2 };
    setIsPanning(true);

    function onMove(moveEvent) {
      const dxPx = moveEvent.clientX - startX;
      const dyPx = moveEvent.clientY - startY;
      const dxSvg = (dxPx / rect.width) * vbW;
      const dySvg = (dyPx / rect.height) * vbH;
      setCenter({
        x: clamp(startCenter.x - dxSvg, vbW / 2, BASE_W - vbW / 2),
        y: clamp(startCenter.y - dySvg, vbH / 2, BASE_H - vbH / 2),
      });
    }

    function onUp() {
      setIsPanning(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // Keep node & label crisp at higher zoom levels
  const invScale = 1 / Math.sqrt(zoom);

  return (
    <div className="sc-map-wrap">
      <div
        ref={viewportRef}
        className={`sc-map-viewport ${isPanning ? 'is-panning' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <svg
          ref={svgRef}
          className="sc-map-svg"
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="Animated Apple parts supply chain flow map"
        >
          <defs>
            <linearGradient id="scOceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f2f6fb" />
              <stop offset="100%" stopColor="#e6eff9" />
            </linearGradient>
            <filter id="scLandShadow" x="-2%" y="-2%" width="104%" height="106%">
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="1.2"
                floodColor="#1d1d1f"
                floodOpacity="0.06"
              />
            </filter>
          </defs>

          <rect x="0" y="0" width={BASE_W} height={BASE_H} fill="url(#scOceanGrad)" />

          {/* Graticule Lines */}
          <g stroke="#d9e3f0" strokeWidth={0.6 * invScale} opacity="0.65">
            {[85, 165, 250, 335].map((y) => (
              <line key={y} x1="0" y1={y} x2={BASE_W} y2={y} strokeDasharray="2 5" />
            ))}
            {[166, 333, 500, 666, 833].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2={BASE_H} strokeDasharray="2 5" />
            ))}
          </g>

          {/* Accurate Low-Poly World Landmasses */}
          <g
            fill="#ffffff"
            stroke="#cfd9e6"
            strokeWidth={1.0 * invScale}
            strokeLinejoin="round"
            filter="url(#scLandShadow)"
          >
            {WORLD_LAND_PATHS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* Animated Curved Supply Chain Lanes */}
          {lanes.map((lane, idx) => {
            const from = NODE_MAP[lane.from];
            const to = NODE_MAP[lane.to];
            if (!from || !to) return null;

            const pathD = buildCurvePath(from, to, lane.arc ?? -30);
            const strokeColor =
              lane.status === 'watch'
                ? '#FF9500'
                : from.role === 'supplier'
                ? '#0071E3'
                : '#AF52DE';
            const isHighlighted =
              hovered?.type === 'lane' && hovered.id === lane.id;
            const dur = `${Math.max(2.4, Math.min(5.2, lane.transitDays + 1.2)).toFixed(1)}s`;

            return (
              <g
                key={lane.id}
                className="sc-lane-group"
                onMouseEnter={() =>
                  setHovered({ type: 'lane', id: lane.id, data: lane, from, to })
                }
                onMouseLeave={() => setHovered(null)}
              >
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14 * invScale}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={(isHighlighted ? 2.8 : 1.5) * invScale}
                  strokeOpacity={isHighlighted ? 0.5 : 0.24}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={(isHighlighted ? 2.8 : 1.8) * invScale}
                  strokeDasharray={`${6 * invScale} ${8 * invScale}`}
                  className="sc-flow-dash"
                  strokeLinecap="round"
                />
                <circle r={(isHighlighted ? 4.6 : 3.4) * invScale} fill={strokeColor}>
                  <animateMotion
                    dur={dur}
                    repeatCount="indefinite"
                    begin={`${(idx * 0.35).toFixed(2)}s`}
                    path={pathD}
                  />
                </circle>
              </g>
            );
          })}

          {/* Hub Nodes */}
          {MAP_NODES.map((node) => {
            const color = ROLE_COLORS[node.role];
            const isHovered = hovered?.type === 'node' && hovered.id === node.id;
            const labelBelow =
              node.id === 'shenzhen' ||
              node.id === 'singapore' ||
              node.id === 'chennai' ||
              node.id === 'hsinchu';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="sc-node-group"
                onMouseEnter={() =>
                  setHovered({ type: 'node', id: node.id, data: node })
                }
                onMouseLeave={() => setHovered(null)}
              >
                <circle r={(isHovered ? 13 : 9) * invScale} fill={color} opacity="0.18" />
                <circle
                  r={(isHovered ? 6 : 4.6) * invScale}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={1.6 * invScale}
                />
                <text
                  y={(labelBelow ? 15 : -9) * invScale}
                  textAnchor="middle"
                  className="sc-node-label"
                  style={{ fontSize: `${9.5 * invScale}px` }}
                >
                  {node.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Apple-Maps-Style Zoom & Reset Controls */}
        <div
          className="sc-map-zoom-controls"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="sc-map-zbtn"
            onClick={() => handleZoomBy(1.3)}
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="sc-map-zbtn"
            onClick={() => handleZoomBy(0.76)}
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="sc-map-zbtn sc-map-zbtn--reset"
            onClick={handleResetView}
            title="Reset map view"
            aria-label="Reset map view"
          >
            {Math.round(zoom * 100)}%
          </button>
        </div>
      </div>

      {/* Fixed-Height Legend + Hover Readout Subbar */}
      <div className="sc-map-subbar">
        <div className="sc-map-legend">
          <span className="sc-leg-item">
            <i style={{ backgroundColor: '#0071E3' }} /> Suppliers
          </span>
          <span className="sc-leg-item">
            <i style={{ backgroundColor: '#AF52DE' }} /> Assembly
          </span>
          <span className="sc-leg-item">
            <i style={{ backgroundColor: '#34C759' }} /> End Markets
          </span>
          <span className="sc-leg-item">
            <i style={{ backgroundColor: '#FF9500' }} /> Watch
          </span>
        </div>

        <div className="sc-map-readout">
          {hovered?.type === 'lane' ? (
            <span>
              <strong>
                {hovered.from.name} → {hovered.to.name}
              </strong>{' '}
              · {hovered.data.part} ·{' '}
              <strong>{(hovered.data.volumeK / 1000).toFixed(2)}M</strong> ·{' '}
              {hovered.data.transitDays}d
            </span>
          ) : hovered?.type === 'node' ? (
            <span>
              <strong>{hovered.data.name}</strong> ·{' '}
              {hovered.data.role.toUpperCase()} ({hovered.data.region})
            </span>
          ) : (
            <span>Drag to pan · Scroll or +/− to zoom · Hover routes for SLA</span>
          )}
        </div>
      </div>
    </div>
  );
}
