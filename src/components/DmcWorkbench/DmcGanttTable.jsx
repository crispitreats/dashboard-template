import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getCharCompletion,
  getPirMaterialPrerequisite,
  getPlantScopeStatus,
  SAP_ACTIVE_PLANTS,
} from '../../data/dmcData';

const TEMPLATE_META = {
  material: {
    CREATE: {
      code: 'CREATE',
      label: 'Product — Create',
      short: 'DMC: Product Create',
      stageOrder: 1,
    },
    EXTEND: {
      code: 'EXTEND',
      label: 'Product — Extend Plant',
      short: 'DMC: Extend Plant',
      stageOrder: 2,
    },
    CLASS: {
      code: 'CLASS',
      label: 'Object Classification',
      short: 'DMC: Class / Char',
      stageOrder: 3,
    },
    COMPLETE: {
      code: 'COMPLETE',
      label: 'Ready · No Action',
      short: 'Complete ✓',
      stageOrder: 4,
    },
  },
  pir: {
    PREREQ: {
      code: 'PREREQ',
      label: 'Prereq: Material Master First',
      short: 'Prereq: Mat. First',
      stageOrder: 0,
    },
    CREATE: {
      code: 'CREATE',
      label: 'PIR — Create (EINA)',
      short: 'DMC: PIR Create',
      stageOrder: 1,
    },
    EXTEND: {
      code: 'EXTEND',
      label: 'PIR — Plant / Cond.',
      short: 'DMC: PIR Extend',
      stageOrder: 2,
    },
    CLASS: {
      code: 'CLASS',
      label: 'PIR Class & Quota',
      short: 'DMC: Class / Quota',
      stageOrder: 3,
    },
    COMPLETE: {
      code: 'COMPLETE',
      label: 'Ready · No Action',
      short: 'Complete ✓',
      stageOrder: 4,
    },
  },
};

export function DmcGanttTable({
  grain,
  records,
  targetPlants,
  onToggleTargetPlant,
  onClearTargetPlants,
  selectedIds,
  onToggleSelect,
  onSelectIds,
  onProceedToFlow,
  onInspectRecord,
  onSwitchGrain,
}) {
  const [search, setSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [plantMenuOpen, setPlantMenuOpen] = useState(false);
  const [pirViewGrain, setPirViewGrain] = useState(() =>
    grain === 'pir' ? records[0]?.intakeGrain || 'pir' : 'pir'
  );
  const plantPopoverRef = useRef(null);

  useEffect(() => {
    if (grain === 'pir' && records[0]?.intakeGrain) {
      setPirViewGrain(records[0].intakeGrain);
    }
  }, [grain, records]);

  const tplMap = TEMPLATE_META[grain] ?? TEMPLATE_META.material;

  useEffect(() => {
    if (!plantMenuOpen) return;
    function handleOutside(e) {
      if (
        plantPopoverRef.current &&
        !plantPopoverRef.current.contains(e.target)
      ) {
        setPlantMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [plantMenuOpen]);

  function getRowId(rec) {
    return grain === 'material' ? rec.material : rec.key;
  }

  function getRowTargetPlants(rec) {
    if (rec.requestedPlants && rec.requestedPlants.length > 0) {
      return rec.requestedPlants;
    }
    return targetPlants;
  }

  function getRowPrereq(rec) {
    if (grain !== 'pir') return null;
    return getPirMaterialPrerequisite(rec.material, getRowTargetPlants(rec));
  }

  function classifyRecord(rec) {
    if (grain === 'pir') {
      const prereq = getRowPrereq(rec);
      if (prereq && prereq.status !== 'READY') return 'PREREQ';
    }
    if (!rec.exists) return 'CREATE';
    const plantStatus = getPlantScopeStatus(
      rec.plants,
      getRowTargetPlants(rec)
    );
    if (plantStatus.state === 'missing' || plantStatus.state === 'partial') {
      return 'EXTEND';
    }
    if (grain === 'material') {
      const charComp = getCharCompletion(rec.characteristics);
      if (!rec.className || charComp.filled < charComp.total) return 'CLASS';
    } else {
      if (!rec.pirClass || !rec.mixingRatio) return 'CLASS';
    }
    return 'COMPLETE';
  }

  function handleToggleSort(key) {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null };
    });
  }

  const templateCounts = useMemo(() => {
    const counts = { PREREQ: 0, CREATE: 0, EXTEND: 0, CLASS: 0, COMPLETE: 0 };
    for (const rec of records) {
      counts[classifyRecord(rec)] += 1;
    }
    return counts;
  }, [records, targetPlants, grain]);

  const pirPrereqSummary = useMemo(() => {
    if (grain !== 'pir') return { missingMat: [], missingPlant: [] };
    const missingMat = [];
    const missingPlant = [];
    for (const rec of records) {
      const p = getRowPrereq(rec);
      if (p?.status === 'MAT_MISSING') missingMat.push(rec.material);
      else if (p?.status === 'PLANT_MISSING') {
        missingPlant.push(`${rec.material} (${p.missingPlants.join(', ')})`);
      }
    }
    return {
      missingMat: Array.from(new Set(missingMat)),
      missingPlant: Array.from(new Set(missingPlant)),
    };
  }, [records, targetPlants, grain]);

  const filteredAndSortedRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = records.filter((rec) => {
      const cluster = classifyRecord(rec);
      if (templateFilter !== 'ALL' && cluster !== templateFilter) return false;
      if (!q) return true;
      if (grain === 'material') {
        return (
          rec.material.toLowerCase().includes(q) ||
          (rec.description || '').toLowerCase().includes(q) ||
          (rec.matType || '').toLowerCase().includes(q) ||
          tplMap[cluster].label.toLowerCase().includes(q)
        );
      }
      return (
        rec.material.toLowerCase().includes(q) ||
        rec.vendor.toLowerCase().includes(q) ||
        (rec.vendorName || '').toLowerCase().includes(q) ||
        tplMap[cluster].label.toLowerCase().includes(q)
      );
    });

    if (!sortConfig.key || !sortConfig.direction) return filtered;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;

    const getSortVal = (rec) => {
      const cluster = classifyRecord(rec);
      const plantStatus = getPlantScopeStatus(
        rec.plants,
        getRowTargetPlants(rec)
      );
      const charComp =
        grain === 'material' ? getCharCompletion(rec.characteristics) : null;

      switch (sortConfig.key) {
        case 'id':
          return getRowId(rec);
        case 'baseInfo':
          return grain === 'material'
            ? rec.description || ''
            : rec.vendorName || '';
        case 'prereq': {
          const p = getRowPrereq(rec);
          return p?.status === 'READY' ? 2 : p?.status === 'PLANT_MISSING' ? 1 : 0;
        }
        case 'stage1':
          return rec.exists ? 1 : 0;
        case 'stage2':
          return plantStatus.state === 'complete'
            ? 3
            : plantStatus.state === 'partial'
            ? 2
            : plantStatus.state === 'neutral'
            ? 1
            : 0;
        case 'stage3':
          return grain === 'material'
            ? rec.className
              ? 1
              : 0
            : rec.pirClass
            ? 1
            : 0;
        case 'stage4':
          return grain === 'material'
            ? charComp.filled
            : Number(rec.mixingRatio || 0);
        case 'template':
          return tplMap[cluster].stageOrder;
        default:
          return '';
      }
    };

    return [...filtered].sort((a, b) => {
      const av = getSortVal(a);
      const bv = getSortVal(b);
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [records, search, templateFilter, targetPlants, grain, sortConfig, tplMap]);

  const selectedRecords = useMemo(
    () => records.filter((r) => selectedIds.includes(getRowId(r))),
    [records, selectedIds, grain]
  );

  const selectedMissing = selectedRecords.filter((r) => !r.exists);
  const selectedExisting = selectedRecords.filter((r) => r.exists);
  const isMixedCluster =
    selectedMissing.length > 0 && selectedExisting.length > 0;
  const canCreate = selectedMissing.length > 0 && selectedExisting.length === 0;
  const canExtendOrClass =
    selectedExisting.length > 0 && selectedMissing.length === 0;

  const allFilteredSelected =
    filteredAndSortedRecords.length > 0 &&
    filteredAndSortedRecords.every((r) => selectedIds.includes(getRowId(r)));

  // Expanded child rows for PIR Cond. Type / Price Scale Gantt views
  const pirChildRows = useMemo(() => {
    if (grain !== 'pir' || pirViewGrain === 'pir') return [];
    const out = [];
    for (const rec of filteredAndSortedRecords) {
      const pasted = rec.pastedConditions ?? [];
      const dbConds = rec.conditions ?? [];
      const prereq = getRowPrereq(rec);

      if (pirViewGrain === 'condType') {
        const seenCond = new Set();
        for (const c of pasted) {
          const ck = `${c.condType}|${c.validFrom}|${c.validTo}`;
          if (seenCond.has(ck)) continue;
          seenCond.add(ck);
          const matchingScales = pasted.filter(
            (x) =>
              x.condType === c.condType &&
              x.validFrom === c.validFrom &&
              x.validTo === c.validTo
          );
          const dbMatch = dbConds.find((d) => d.condType === c.condType);
          out.push({
            uid: `${rec.key}__${ck}`,
            parentRec: rec,
            prereq,
            condType: c.condType,
            plant: c.plant || rec.requestedPlants?.[0] || rec.plants?.[0] || '—',
            validFrom: c.validFrom,
            validTo: c.validTo,
            scaleCount: matchingScales.length,
            baseRate: c.rate,
            currency: c.currency,
            sapStatus: !rec.exists
              ? 'New PIR'
              : dbMatch
              ? 'In SAP ✓'
              : 'New Cond. Type',
            sapState: !rec.exists ? 'missing' : dbMatch ? 'green' : 'amber',
          });
        }
      } else {
        for (const c of pasted) {
          const dbMatch = dbConds.find(
            (d) =>
              d.condType === c.condType &&
              Number(d.scaleQty) === Number(c.scaleQty)
          );
          let sapStatus = 'New Tier';
          let sapState = 'amber';
          if (!rec.exists) {
            sapStatus = 'New PIR';
            sapState = 'missing';
          } else if (dbMatch) {
            if (Number(dbMatch.rate) === Number(c.rate)) {
              sapStatus = 'Match ✓';
              sapState = 'green';
            } else {
              sapStatus = `Δ $${Number(dbMatch.rate).toFixed(2)} → $${Number(c.rate).toFixed(2)}`;
              sapState = 'amber';
            }
          }
          out.push({
            uid: c.condUid,
            parentRec: rec,
            prereq,
            condType: c.condType,
            plant: c.plant || rec.requestedPlants?.[0] || rec.plants?.[0] || '—',
            scaleQty: c.scaleQty,
            rate: c.rate,
            currency: c.currency,
            validFrom: c.validFrom,
            validTo: c.validTo,
            sapStatus,
            sapState,
          });
        }
      }
    }
    return out;
  }, [grain, pirViewGrain, filteredAndSortedRecords, targetPlants]);

  function handleToggleAllVisible() {
    if (allFilteredSelected) {
      onSelectIds([]);
    } else {
      onSelectIds(filteredAndSortedRecords.map(getRowId));
    }
  }

  function renderSortHeader(colKey, label, extra) {
    const isSorted = sortConfig.key === colKey;
    const dir = isSorted ? sortConfig.direction : null;
    return (
      <button
        type="button"
        className={`dmc-sort-btn ${isSorted ? 'is-sorted' : ''}`}
        onClick={() => handleToggleSort(colKey)}
      >
        <span>
          {label}
          {extra}
        </span>
        <span className="dmc-sort-ind" aria-hidden="true">
          {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '↕'}
        </span>
      </button>
    );
  }

  return (
    <section
      className="dmc-card dmc-gantt-card"
      aria-label="SAP DMC Gantt Status"
    >
      {/* Toolbar: Search + Target Plants Scope + Proposed Template Filter Pills */}
      <div className="dmc-gantt-toolbar">
        <input
          type="search"
          className="dmc-search"
          placeholder={
            grain === 'material'
              ? 'Search material, desc, template...'
              : 'Search material, vendor, template...'
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Target Plants Scope Picker */}
        <div className="dmc-plant-picker" ref={plantPopoverRef}>
          <button
            type="button"
            className={`dmc-scope-btn ${
              targetPlants.length > 0 ? 'is-active' : ''
            }`}
            onClick={() => setPlantMenuOpen((o) => !o)}
            aria-expanded={plantMenuOpen}
          >
            <span>Target Plants:</span>
            <strong>
              {targetPlants.length === 0
                ? 'Any (50)'
                : targetPlants.length <= 2
                ? targetPlants.join(', ')
                : `${targetPlants.length} selected`}
            </strong>
          </button>

          {plantMenuOpen && (
            <div
              className="dmc-plant-popover"
              role="dialog"
              aria-label="Target plant scope"
            >
              <div className="dmc-popover-head">
                <span>Fallback Plant Scope</span>
                {targetPlants.length > 0 && (
                  <button
                    type="button"
                    className="dmc-link-btn"
                    onClick={onClearTargetPlants}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="dmc-plant-list">
                {SAP_ACTIVE_PLANTS.map((p) => {
                  const checked = targetPlants.includes(p.code);
                  return (
                    <label key={p.code} className="dmc-plant-option">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleTargetPlant(p.code)}
                      />
                      <span className="dmc-plant-code">{p.code}</span>
                      <span className="dmc-plant-name">{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3-Way PIR Gantt Grain Switcher */}
        {grain === 'pir' && (
          <div
            className="dmc-pir-grain-switch"
            role="tablist"
            aria-label="PIR Gantt viewing grain"
          >
            {[
              { id: 'pir', label: 'PIR' },
              { id: 'condType', label: 'Cond. Type' },
              { id: 'scale', label: 'Price / Scale' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={pirViewGrain === g.id}
                className={`dmc-pir-grain-btn ${
                  pirViewGrain === g.id ? 'is-active' : ''
                }`}
                onClick={() => setPirViewGrain(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}

        {/* Color-Coded Proposed Template Filter Strip */}
        <div
          className="dmc-filter-pills"
          role="tablist"
          aria-label="Filter by proposed template"
        >
          <button
            type="button"
            role="tab"
            aria-selected={templateFilter === 'ALL'}
            className={`dmc-filter-pill ${
              templateFilter === 'ALL' ? 'is-active' : ''
            }`}
            onClick={() => setTemplateFilter('ALL')}
          >
            All ({records.length})
          </button>

          {(grain === 'pir'
            ? ['PREREQ', 'CREATE', 'EXTEND', 'CLASS', 'COMPLETE']
            : ['CREATE', 'EXTEND', 'CLASS', 'COMPLETE']
          ).map((code) => (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={templateFilter === code}
              className={`dmc-filter-pill dmc-tpl-filter--${code.toLowerCase()} ${
                templateFilter === code ? 'is-active' : ''
              }`}
              onClick={() => setTemplateFilter(code)}
            >
              <span
                className={`dmc-tpl-dot dmc-tpl-dot--${code.toLowerCase()}`}
                aria-hidden="true"
              />
              <span>
                {tplMap[code].short} ({templateCounts[code]})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* PIR Upstream Material Master Prerequisite Alert Banner */}
      {grain === 'pir' &&
        (pirPrereqSummary.missingMat.length > 0 ||
          pirPrereqSummary.missingPlant.length > 0) && (
          <div className="dmc-prereq-banner" role="status">
            <div className="dmc-prereq-copy">
              <strong>Upstream SAP Material Prerequisite Detected:</strong>{' '}
              {pirPrereqSummary.missingMat.length > 0 && (
                <span>
                  Create Material first ({pirPrereqSummary.missingMat.join(', ')})
                  {pirPrereqSummary.missingPlant.length > 0 ? ' · ' : ''}
                </span>
              )}
              {pirPrereqSummary.missingPlant.length > 0 && (
                <span>
                  Extend Material to target Plant first (
                  {pirPrereqSummary.missingPlant.join(', ')})
                </span>
              )}
              . SAP DMC will reject PIR loads until Material Master (MARA/MARC) exists.
            </div>
            {onSwitchGrain && (
              <button
                type="button"
                className="dmc-prereq-cta"
                onClick={() => onSwitchGrain('material')}
              >
                Open Material Master →
              </button>
            )}
          </div>
        )}

      {/* Clean Scope Selection Strip (feeds into linear Process Flow) */}
      {selectedIds.length > 0 && (
        <div
          className="dmc-wrangle-bar"
          role="region"
          aria-label="Selected batch scope"
        >
          <div className="dmc-wrangle-left">
            <span className="dmc-wrangle-count">
              {selectedIds.length} record{selectedIds.length === 1 ? '' : 's'} selected for sequential prep
            </span>
            <span className="dmc-wrangle-hint">
              {selectedMissing.length > 0 && `${selectedMissing.length} new`}
              {selectedMissing.length > 0 && selectedExisting.length > 0 ? ' · ' : ''}
              {selectedExisting.length > 0 && `${selectedExisting.length} existing`}
            </span>
          </div>

          <div className="dmc-wrangle-actions">
            {onProceedToFlow && (
              <button
                type="button"
                className="dmc-wrangle-btn dmc-wrangle-btn--primary"
                onClick={() => onProceedToFlow(selectedRecords)}
              >
                Start Prep with Selected ({selectedIds.length}) →
              </button>
            )}
            <button
              type="button"
              className="dmc-wrangle-clear"
              onClick={() => onSelectIds([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Sortable Gantt Status Matrix Table (or PIR Cond. Type / Price Scale Grain View) */}
      <div className="dmc-table-scroll">
        {grain === 'pir' && pirViewGrain !== 'pir' ? (
          <table className="dmc-gantt-table">
            <thead>
              <tr>
                <th className="dmc-col-check">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleToggleAllVisible}
                    aria-label="Select all visible parent PIRs"
                  />
                </th>
                <th>Material · Vendor</th>
                <th>Plant</th>
                <th>KSCHL (Cond.)</th>
                {pirViewGrain === 'scale' ? (
                  <>
                    <th>Scale Qty</th>
                    <th>Pasted Rate</th>
                  </>
                ) : (
                  <>
                    <th>Validity Window</th>
                    <th>Scale Tiers</th>
                  </>
                )}
                <th className="dmc-gantt-col">0. Mat. Prereq</th>
                <th className="dmc-gantt-col">SAP Cond. Check</th>
              </tr>
            </thead>
            <tbody>
              {pirChildRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="dmc-empty-cell">
                    No condition/scale rows available. Paste condition columns in Grid Intake.
                  </td>
                </tr>
              ) : (
                pirChildRows.map((cr) => {
                  const rowId = getRowId(cr.parentRec);
                  const isChecked = selectedIds.includes(rowId);
                  return (
                    <tr
                      key={cr.uid}
                      className={isChecked ? 'is-selected' : ''}
                    >
                      <td className="dmc-col-check">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleSelect(rowId)}
                          aria-label={`Select ${rowId}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="dmc-mat-link"
                          onClick={() => onInspectRecord(cr.parentRec)}
                        >
                          {cr.parentRec.material} · {cr.parentRec.vendor}
                        </button>
                      </td>
                      <td className="dmc-ref-desc">{cr.plant}</td>
                      <td>
                        <span className="dmc-plant-mini-tag">{cr.condType}</span>
                      </td>
                      {pirViewGrain === 'scale' ? (
                        <>
                          <td className="dmc-ref-desc">≥ {cr.scaleQty}</td>
                          <td className="dmc-ref-desc">
                            <strong>
                              ${Number(cr.rate || 0).toFixed(2)} {cr.currency}
                            </strong>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="dmc-ref-desc">
                            {cr.validFrom} → {cr.validTo}
                          </td>
                          <td className="dmc-ref-desc">
                            {cr.scaleCount} tier{cr.scaleCount === 1 ? '' : 's'}
                          </td>
                        </>
                      )}
                      <td className="dmc-gantt-cell">
                        <span
                          className={`dmc-gantt-bar ${
                            cr.prereq.status === 'READY'
                              ? 'is-green'
                              : cr.prereq.status === 'PLANT_MISSING'
                              ? 'is-amber'
                              : 'is-missing'
                          }`}
                        >
                          {cr.prereq.label}
                        </span>
                      </td>
                      <td className="dmc-gantt-cell">
                        <span
                          className={`dmc-gantt-bar is-${cr.sapState}`}
                        >
                          {cr.sapStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <table className="dmc-gantt-table">
          <thead>
            <tr>
              <th className="dmc-col-check">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={handleToggleAllVisible}
                  aria-label="Select all visible rows"
                />
              </th>
              <th>
                {renderSortHeader(
                  'id',
                  grain === 'material' ? 'Material #' : 'Material · Vendor'
                )}
              </th>
              <th>
                {renderSortHeader(
                  'baseInfo',
                  grain === 'material'
                    ? 'Base Data (Type · UoM)'
                    : 'Vendor / Price'
                )}
              </th>
              {grain === 'pir' && (
                <th className="dmc-gantt-col">
                  {renderSortHeader('prereq', '0. Mat. Prereq')}
                </th>
              )}
              <th className="dmc-gantt-col">
                {renderSortHeader(
                  'stage1',
                  grain === 'material' ? '1. Base Mat.' : '1. PIR Record'
                )}
              </th>
              <th className="dmc-gantt-col">
                {renderSortHeader(
                  'stage2',
                  '2. Plant Ext.',
                  targetPlants.length > 0 ? (
                    <span className="dmc-th-sub"> ({targetPlants.length})</span>
                  ) : null
                )}
              </th>
              <th className="dmc-gantt-col">
                {renderSortHeader(
                  'stage3',
                  grain === 'material' ? '3. Mat. Class' : '3. PIR Class'
                )}
              </th>
              <th className="dmc-gantt-col">
                {renderSortHeader(
                  'stage4',
                  grain === 'material' ? '4. Characteristics' : '4. Mixing Ratio'
                )}
              </th>
              <th>{renderSortHeader('template', 'Proposed Template')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={grain === 'pir' ? 9 : 8}
                  className="dmc-empty-cell"
                >
                  {records.length === 0
                    ? 'No records loaded yet — paste your rows in Grid Intake above, map the columns you know, and click "Check SAP & Load Gantt".'
                    : 'No records match your current search or filter.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedRecords.map((rec) => {
                const rowId = getRowId(rec);
                const isChecked = selectedIds.includes(rowId);
                const effectivePlants = getRowTargetPlants(rec);
                const hasRowPlants =
                  rec.requestedPlants && rec.requestedPlants.length > 0;
                const plantStatus = getPlantScopeStatus(
                  rec.plants,
                  effectivePlants
                );
                const prereq = getRowPrereq(rec);
                const cluster = classifyRecord(rec);
                const tpl = tplMap[cluster];
                const charComp =
                  grain === 'material'
                    ? getCharCompletion(rec.characteristics)
                    : null;

                // Highlight which Gantt stage cell(s) correspond to the Proposed DMC Template!
                const highlightPrereq = cluster === 'PREREQ';
                const highlightStage1 = cluster === 'CREATE';
                const highlightStage2 = cluster === 'EXTEND';
                const highlightStage3 =
                  cluster === 'CLASS' &&
                  (grain === 'material' ? !rec.className : !rec.pirClass);
                const highlightStage4 =
                  cluster === 'CLASS' &&
                  (grain === 'material'
                    ? charComp.filled < charComp.total
                    : !rec.mixingRatio);

                return (
                  <tr
                    key={rowId}
                    className={isChecked ? 'is-selected' : ''}
                  >
                    <td className="dmc-col-check">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleSelect(rowId)}
                        aria-label={`Select ${rowId}`}
                      />
                    </td>

                    <td>
                      <div className="dmc-mat-cell-wrap">
                        <button
                          type="button"
                          className="dmc-mat-link"
                          onClick={() => onInspectRecord(rec)}
                          title="Click to inspect full SAP master fields"
                        >
                          {grain === 'material'
                            ? rec.material
                            : `${rec.material} · ${rec.vendor}`}
                        </button>
                        {(rec.refMaterial ||
                          rec.intakeFieldCount > 0 ||
                          (grain === 'pir' &&
                            (rec.pastedConditions?.length ?? 0) > 1)) && (
                          <div className="dmc-intake-tags">
                            {rec.refMaterial && (
                              <span
                                className="dmc-ref-tag"
                                title={`Copies structural baseline from ${rec.refMaterial}`}
                              >
                                Ref: {rec.refMaterial}
                              </span>
                            )}
                            {grain === 'pir' &&
                              (rec.pastedConditions?.length ?? 0) > 0 && (
                                <span
                                  className="dmc-mapped-tag"
                                  title="Switch to Cond. Type or Price / Scale grain to view individual tiers"
                                >
                                  {
                                    new Set(
                                      rec.pastedConditions.map((c) => c.condType)
                                    ).size
                                  }{' '}
                                  Cond · {rec.pastedConditions.length} Tier
                                  {rec.pastedConditions.length === 1 ? '' : 's'}
                                </span>
                              )}
                            {grain !== 'pir' && rec.intakeFieldCount > 0 && (
                              <span
                                className="dmc-mapped-tag"
                                title="Prepopulates sequential prep from Grid Intake"
                              >
                                +{rec.intakeFieldCount} mapped
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="dmc-base-cell">
                      {grain === 'material' ? (
                        rec.exists ? (
                          <div className="dmc-base-info">
                            <span className="dmc-desc" title={rec.description}>
                              {rec.description}
                            </span>
                            <span className="dmc-meta-badges">
                              <span>{rec.matType}</span>
                              <span>·</span>
                              <span>{rec.uom}</span>
                            </span>
                          </div>
                        ) : (
                          <span className="dmc-not-found">
                            Not in SAP MARA
                          </span>
                        )
                      ) : rec.exists ? (
                        <div className="dmc-base-info">
                          <span className="dmc-desc">{rec.vendorName}</span>
                          <span className="dmc-meta-badges">
                            <span>{rec.purchOrg}</span>
                            <span>·</span>
                            <span>
                              ${rec.netPrice.toFixed(2)} {rec.currency}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <span className="dmc-not-found">
                          Not in SAP EINA/EINE
                        </span>
                      )}
                    </td>

                    {/* Stage 0 (PIR only): Upstream SAP Material Master Prerequisite */}
                    {grain === 'pir' && prereq && (
                      <td className="dmc-gantt-cell">
                        <span
                          className={`dmc-gantt-bar ${
                            prereq.status === 'READY'
                              ? 'is-green'
                              : prereq.status === 'PLANT_MISSING'
                              ? 'is-amber'
                              : 'is-missing'
                          } ${highlightPrereq ? 'is-proposed-prereq' : ''}`}
                          title={prereq.detail}
                        >
                          {highlightPrereq ? `⚠ ${prereq.label}` : prereq.label}
                        </span>
                      </td>
                    )}

                    {/* Stage 1: Base Material / PIR Exists */}
                    <td className="dmc-gantt-cell">
                      <span
                        className={`dmc-gantt-bar ${
                          rec.exists ? 'is-green' : 'is-missing'
                        } ${highlightStage1 ? 'is-proposed-create' : ''}`}
                      >
                        {rec.exists ? 'Exists ✓' : '● Create'}
                      </span>
                    </td>

                    {/* Stage 2: Plant Extension */}
                    <td className="dmc-gantt-cell">
                      <span
                        className={`dmc-gantt-bar ${
                          plantStatus.state === 'complete'
                            ? 'is-green'
                            : plantStatus.state === 'partial'
                            ? 'is-amber'
                            : plantStatus.state === 'neutral'
                            ? 'is-neutral'
                            : 'is-missing'
                        } ${highlightStage2 ? 'is-proposed-extend' : ''}`}
                        title={`${
                          hasRowPlants
                            ? `Intake Target Plants: ${effectivePlants.join(', ')}\n`
                            : ''
                        }${
                          rec.plants.length > 0
                            ? `Extended in SAP: ${rec.plants.join(', ')}`
                            : 'Not extended to any plant in SAP'
                        }`}
                      >
                        {highlightStage2 ? `● ${plantStatus.label}` : plantStatus.label}
                      </span>
                    </td>

                    {/* Stage 3: Material Class / PIR Class */}
                    <td className="dmc-gantt-cell">
                      {grain === 'material' ? (
                        <span
                          className={`dmc-gantt-bar ${
                            rec.className ? 'is-green' : 'is-missing'
                          } ${highlightStage3 ? 'is-proposed-class' : ''}`}
                          title={rec.className || 'Class not assigned'}
                        >
                          {rec.className
                            ? 'Assigned ✓'
                            : highlightStage3
                            ? '● Assign'
                            : 'Missing'}
                        </span>
                      ) : (
                        <span
                          className={`dmc-gantt-bar ${
                            rec.pirClass ? 'is-green' : 'is-missing'
                          } ${highlightStage3 ? 'is-proposed-class' : ''}`}
                        >
                          {rec.pirClass
                            ? 'Assigned ✓'
                            : highlightStage3
                            ? '● Assign'
                            : 'Missing'}
                        </span>
                      )}
                    </td>

                    {/* Stage 4: Characteristics / Mixing Ratio */}
                    <td className="dmc-gantt-cell">
                      {grain === 'material' ? (
                        <span
                          className={`dmc-gantt-bar ${
                            charComp.filled === charComp.total
                              ? 'is-green'
                              : charComp.filled > 0
                              ? 'is-amber'
                              : 'is-missing'
                          } ${highlightStage4 ? 'is-proposed-class' : ''}`}
                        >
                          {charComp.filled === charComp.total
                            ? `${charComp.filled}/${charComp.total} ✓`
                            : highlightStage4
                            ? `● ${charComp.filled}/${charComp.total} Fill`
                            : `${charComp.filled}/${charComp.total}`}
                        </span>
                      ) : (
                        <span
                          className={`dmc-gantt-bar ${
                            rec.mixingRatio > 0 ? 'is-green' : 'is-missing'
                          } ${highlightStage4 ? 'is-proposed-class' : ''}`}
                        >
                          {rec.mixingRatio > 0
                            ? `${rec.mixingRatio}% Quota`
                            : highlightStage4
                            ? '● Set Quota'
                            : 'Missing'}
                        </span>
                      )}
                    </td>

                    {/* Proposed SAP DMC Template Indicator */}
                    <td>
                      <span
                        className={`dmc-cluster-pill dmc-cluster-pill--${cluster.toLowerCase()}`}
                        title={`Recommended SAP DMC Template: ${tpl.label}`}
                      >
                        <span
                          className={`dmc-tpl-dot dmc-tpl-dot--${cluster.toLowerCase()}`}
                          aria-hidden="true"
                        />
                        <span>{tpl.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
