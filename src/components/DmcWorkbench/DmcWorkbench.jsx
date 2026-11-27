import { useMemo, useState } from 'react';
import {
  buildDmcXml,
  buildRecordsFromIntake,
  EXPECTED_BKLAS_BY_MTART,
  parseTabularPaste,
  SAMPLE_MATERIAL_GRID_TSV,
  SAMPLE_PIR_GRID_TSV,
  SAP_ACTIVE_PLANTS,
  validateDmcOrder,
} from '../../data/dmcData';
import { DmcGanttTable } from './DmcGanttTable';
import { DmcGridIntake } from './DmcGridIntake';
import { DmcXmlEditor } from './DmcXmlEditor';

const PLANT_PROFIT_CENTER = Object.fromEntries(
  SAP_ACTIVE_PLANTS.map((p) => [p.code, p.profitCenter])
);

const MATERIAL_FLOW_STEPS = [
  { id: 'gantt', num: 1, label: 'Intake & Gantt', sub: 'SAP Check' },
  { id: 'step1', num: 2, label: 'Product Create', sub: 'MARA' },
  { id: 'step2', num: 3, label: 'Plant Ext Prep', sub: 'MARC' },
  { id: 'step3', num: 4, label: 'Class & Char', sub: 'CLFMAS' },
  { id: 'step4', num: 5, label: 'Done & Export', sub: 'DMC XML' },
];

const PIR_FLOW_STEPS = [
  { id: 'gantt', num: 1, label: 'Intake & Gantt', sub: 'Prereq Check' },
  { id: 'step1', num: 2, label: 'PIR Header', sub: 'EINA / EINE' },
  { id: 'step2', num: 3, label: 'Cond. & Scales', sub: 'KONP / KONM' },
  { id: 'step3', num: 4, label: 'Class & Quota', sub: 'Quota = 100%' },
  { id: 'step4', num: 5, label: 'Done & Export', sub: 'DMC XML' },
];

function buildBatchFromRecords(grain, sourceRecords, targetPlants) {
  const stagedRows = [];
  const stagedConditions = [];

  for (const rec of sourceRecords) {
    const intake = rec.intakeData ?? {};

    if (grain === 'pir') {
      const plantCode =
        rec.requestedPlants?.[0] || rec.plants?.[0] || targetPlants[0] || '';
      stagedRows.push({
        rowUid: `${rec.material}__${rec.vendor}`,
        material: rec.material,
        vendor: rec.vendor,
        purchOrg: intake.purchOrg || rec.purchOrg || '',
        plant: plantCode,
        currency: intake.currency || rec.currency || 'USD',
        invoiceReceipt: rec.invoiceReceipt ?? true,
        pirClass: intake.pirClass || rec.pirClass || '',
        mixingRatio: intake.mixingRatio || rec.mixingRatio || '',
        validTo: intake.validTo || '2026-12-31',
      });

      const childConds =
        rec.pastedConditions && rec.pastedConditions.length > 0
          ? rec.pastedConditions
          : [
              {
                condUid: `${rec.material}__${rec.vendor}__PB00__1`,
                plant: plantCode,
                condType: 'PB00',
                scaleQty: 1,
                rate: rec.netPrice || '',
                currency: rec.currency || 'USD',
                validFrom: '2026-01-01',
                validTo: '2026-12-31',
              },
            ];

      for (const c of childConds) {
        stagedConditions.push({
          ...c,
          material: rec.material,
          vendor: rec.vendor,
          plant: c.plant || plantCode,
        });
      }
    } else {
      const ref = rec.refBaseline;
      const resolvedMatType =
        intake.matType || rec.matType || ref?.matType || '';
      const resolvedUom = intake.uom || rec.uom || ref?.uom || '';
      const resolvedClass =
        intake.className || rec.className || ref?.className || '';
      const resolvedDesc = intake.description || rec.description || '';
      const resolvedColor =
        intake.charColor || rec.characteristics?.COLOR || '';
      const resolvedStorage =
        intake.charStorage || rec.characteristics?.STORAGE || '';
      const resolvedRegion =
        intake.charRegion ||
        rec.characteristics?.REGION_LOCK ||
        ref?.characteristics?.REGION_LOCK ||
        '';

      const plantsToStage =
        rec.requestedPlants && rec.requestedPlants.length > 0
          ? rec.requestedPlants
          : rec.plants && rec.plants.length > 0
          ? [rec.plants[0]]
          : [''];

      for (const plantCode of plantsToStage) {
        stagedRows.push({
          rowUid: `${rec.material}__${plantCode || 'NEW'}`,
          material: rec.material,
          existsInSap: Boolean(rec.exists),
          description: resolvedDesc,
          descriptionFromIntake: Boolean(intake.description),
          matType: resolvedMatType,
          uom: resolvedUom,
          plant: plantCode,
          profitCenter: PLANT_PROFIT_CENTER[plantCode] || '',
          valuationClass: EXPECTED_BKLAS_BY_MTART[resolvedMatType] || '',
          mrpType: '',
          lotSize: '',
          procType: '',
          priceCtrl: '',
          stdPrice: intake.stdPrice || '',
          className: resolvedClass,
          charColor: resolvedColor,
          charStorage: resolvedStorage,
          charRegion: resolvedRegion,
        });
      }
    }
  }

  return {
    id: grain === 'pir' ? 'PIR-BATCH' : 'MAT-BATCH',
    cluster: 'flow',
    grain,
    includeValuation: false,
    rows: stagedRows,
    conditions: stagedConditions,
    savedAt: null,
  };
}

export function DmcWorkbench({ grain = 'material', onSwitchGrain }) {
  const flowSteps = grain === 'pir' ? PIR_FLOW_STEPS : MATERIAL_FLOW_STEPS;

  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [intakeOpen, setIntakeOpen] = useState(true);
  const [intakeRawText, setIntakeRawText] = useState('');
  const [records, setRecords] = useState([]);
  const [targetPlants, setTargetPlants] = useState(['1000', '2100']);
  const [selectedIds, setSelectedIds] = useState([]);
  const [inspectedRecord, setInspectedRecord] = useState(null);
  const [batchOrder, setBatchOrder] = useState(null);

  const activeStepId = flowSteps[activeStepIdx]?.id ?? 'gantt';
  const validation = useMemo(
    () => (batchOrder ? validateDmcOrder(batchOrder) : null),
    [batchOrder]
  );

  function getRowId(rec) {
    return grain === 'material' ? rec.material : rec.key;
  }

  // Highest step index unlocked by passing all mandatory & allowed-value checks sequentially
  const maxUnlockedStepIdx = useMemo(() => {
    if (records.length === 0) return 0;
    if (!batchOrder || !validation) return 1;
    if (!validation.step1Done) return 1;
    if (!validation.step2Done) return 2;
    if (!validation.step3Done) return 3;
    return 4;
  }, [records.length, batchOrder, validation]);

  const currentStageErrorCount = useMemo(() => {
    if (!validation) return 0;
    if (activeStepId === 'step1') return validation.stepErrors?.step1?.length ?? 0;
    if (activeStepId === 'step2') return validation.stepErrors?.step2?.length ?? 0;
    if (activeStepId === 'step3') return validation.stepErrors?.step3?.length ?? 0;
    return 0;
  }, [validation, activeStepId]);

  const canAdvanceFromCurrent =
    activeStepIdx === 0
      ? records.length > 0
      : activeStepIdx < maxUnlockedStepIdx;

  function ensureBatchAndNavigate(targetIdx, explicitRecords = null) {
    if (targetIdx === 0) {
      setActiveStepIdx(0);
      return;
    }
    if (records.length === 0) return;

    // Enforce strict sequential gate: cannot skip ahead past an unvalidated stage
    if (!explicitRecords && targetIdx > maxUnlockedStepIdx) return;

    if (explicitRecords || !batchOrder) {
      const source =
        explicitRecords && explicitRecords.length > 0
          ? explicitRecords
          : selectedIds.length > 0
          ? records.filter((r) => selectedIds.includes(getRowId(r)))
          : records;
      setBatchOrder(buildBatchFromRecords(grain, source, targetPlants));
    }
    setActiveStepIdx(targetIdx);
  }

  function handleApplyIntake(rawText, parsedRows, mappings) {
    setIntakeRawText(rawText);
    const nextRecords = buildRecordsFromIntake(grain, parsedRows, mappings);
    setRecords(nextRecords);
    setSelectedIds([]);
    setInspectedRecord(null);
    setBatchOrder(null);
    setIntakeOpen(false);
    setActiveStepIdx(0);
  }

  function handleToggleTargetPlant(code) {
    setTargetPlants((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function handleToggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleExportXml() {
    if (!batchOrder || !validation?.readyToExport) return;
    const xml = buildDmcXml(batchOrder);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SAP_DMC_${batchOrder.grain}_${batchOrder.id}.xml`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const flowFillPct = Math.round(
    (activeStepIdx / (flowSteps.length - 1)) * 100
  );

  const stepDoneFlags = [
    records.length > 0 && activeStepIdx > 0,
    Boolean(validation?.step1Done),
    Boolean(validation?.step2Done),
    Boolean(validation?.step3Done),
    Boolean(validation?.readyToExport),
  ];

  const nextStepObj = flowSteps[activeStepIdx + 1] ?? null;
  const prevStepObj = flowSteps[activeStepIdx - 1] ?? null;

  return (
    <div className="dmc-workbench">
      {/* Top-Level Unified 5-Step Linear Loading-Bar Process Flow */}
      <div className="dmc-top-flow-card">
        <div
          className="dmc-flow-stepper dmc-flow-stepper--wide"
          role="tablist"
          aria-label="Sequential SAP DMC preparation flow"
        >
          <div className="dmc-flow-track" aria-hidden="true">
            <div
              className="dmc-flow-track-fill"
              style={{ width: `${flowFillPct}%` }}
            />
          </div>

          {flowSteps.map((step, idx) => {
            const isActive = idx === activeStepIdx;
            const isDone = stepDoneFlags[idx];
            const isLocked = idx > maxUnlockedStepIdx;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={isLocked}
                title={
                  isLocked
                    ? 'Complete all mandatory fields and allowed-value checks in earlier stages to unlock'
                    : step.label
                }
                className={`dmc-flow-node ${isActive ? 'is-active' : ''} ${
                  isDone ? 'is-done' : ''
                }`}
                onClick={() => ensureBatchAndNavigate(idx)}
              >
                <span className="dmc-flow-dot">
                  {isDone ? (
                    '✓'
                  ) : isLocked ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M11 7V5a3 3 0 1 0-6 0v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1Zm-4.5-2a1.5 1.5 0 1 1 3 0v2h-3V5Z" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </span>
                <span className="dmc-flow-meta">
                  <span className="dmc-flow-title">{step.label}</span>
                  <span className="dmc-flow-sub">{step.sub}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="dmc-top-flow-actions">
          {activeStepId === 'gantt' ? (
            <button
              type="button"
              className={`dmc-primary-btn ${intakeOpen ? 'is-active' : ''}`}
              onClick={() => setIntakeOpen((o) => !o)}
            >
              {intakeOpen ? 'Hide Grid Intake' : '+ Grid Intake'}
            </button>
          ) : (
            <button
              type="button"
              className={`dmc-export-btn ${
                validation?.readyToExport ? 'is-ready' : 'is-locked'
              }`}
              disabled={!validation?.readyToExport}
              onClick={handleExportXml}
              title={
                validation?.readyToExport
                  ? 'Download validated SAP DMC XML workbook'
                  : 'Complete remaining SAP checks to unlock XML export'
              }
            >
              {validation?.readyToExport
                ? 'Export DMC XML ↓'
                : `🔒 ${validation?.errors.length ?? 0} Checks`}
            </button>
          )}
        </div>
      </div>

      {/* Prominent Grid Intake at Top of Stage 1 */}
      {activeStepId === 'gantt' && intakeOpen && (
        <DmcGridIntake
          grain={grain}
          initialRawText={intakeRawText}
          canClose={records.length > 0}
          onApplyIntake={handleApplyIntake}
          onClose={() => setIntakeOpen(false)}
        />
      )}

      {/* Main Full-Canvas Stage Content */}
      <div className="dmc-main-area">
        {activeStepId === 'gantt' ? (
          <>
            <DmcGanttTable
              grain={grain}
              records={records}
              targetPlants={targetPlants}
              onToggleTargetPlant={handleToggleTargetPlant}
              onClearTargetPlants={() => setTargetPlants([])}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectIds={setSelectedIds}
              onProceedToFlow={(selectedRecs) =>
                ensureBatchAndNavigate(1, selectedRecs)
              }
              onInspectRecord={setInspectedRecord}
              onSwitchGrain={onSwitchGrain}
            />

            {inspectedRecord && (
              <aside
                className="dmc-inspector-card"
                aria-label="SAP Record Details"
              >
                <div className="dmc-inspector-head">
                  <div>
                    <h4 className="dmc-inspector-title">
                      {inspectedRecord.material}
                    </h4>
                    <span className="dmc-inspector-sub">
                      {inspectedRecord.exists
                        ? 'Active in SAP S/4HANA'
                        : 'Not Found in SAP'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="dmc-close-btn"
                    onClick={() => setInspectedRecord(null)}
                    aria-label="Close inspector"
                  >
                    ×
                  </button>
                </div>

                <div className="dmc-inspector-body">
                  {inspectedRecord.refMaterial && (
                    <div className="dmc-kv">
                      <span>Reference Material (Intake)</span>
                      <strong>{inspectedRecord.refMaterial}</strong>
                    </div>
                  )}
                  {inspectedRecord.requestedPlants?.length > 0 && (
                    <div className="dmc-kv">
                      <span>Requested Target Plants (Intake)</span>
                      <div className="dmc-inspector-tags">
                        {inspectedRecord.requestedPlants.map((p) => (
                          <span
                            key={p}
                            className="dmc-plant-mini-tag dmc-plant-mini-tag--req"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {grain === 'material' ? (
                    <>
                      <div className="dmc-kv">
                        <span>Description</span>
                        <strong>{inspectedRecord.description || '—'}</strong>
                      </div>
                      <div className="dmc-kv">
                        <span>Material Type / UoM</span>
                        <strong>
                          {inspectedRecord.matType || '—'} ·{' '}
                          {inspectedRecord.uom || '—'}
                        </strong>
                      </div>
                      <div className="dmc-kv">
                        <span>
                          Extended Plants ({inspectedRecord.plants.length})
                        </span>
                        <div className="dmc-inspector-tags">
                          {inspectedRecord.plants.length > 0 ? (
                            inspectedRecord.plants.map((p) => (
                              <span key={p} className="dmc-plant-mini-tag">
                                {p}
                              </span>
                            ))
                          ) : (
                            <strong>None</strong>
                          )}
                        </div>
                      </div>
                      <div className="dmc-kv">
                        <span>Material Class</span>
                        <strong>
                          {inspectedRecord.className || 'Missing'}
                        </strong>
                      </div>
                      <div className="dmc-kv">
                        <span>Characteristics</span>
                        <div className="dmc-char-list">
                          {Object.entries(
                            inspectedRecord.characteristics ?? {}
                          ).map(([k, v]) => (
                            <div key={k} className="dmc-char-row">
                              <span>{k}</span>
                              <strong>{v || 'Missing'}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="dmc-kv">
                        <span>Vendor</span>
                        <strong>
                          {inspectedRecord.vendor} ·{' '}
                          {inspectedRecord.vendorName}
                        </strong>
                      </div>
                      <div className="dmc-kv">
                        <span>Purchasing Org</span>
                        <strong>{inspectedRecord.purchOrg || '—'}</strong>
                      </div>
                      <div className="dmc-kv">
                        <span>
                          Pasted Conditions / Scales (
                          {inspectedRecord.pastedConditions?.length ?? 0})
                        </span>
                        <div className="dmc-char-list">
                          {(inspectedRecord.pastedConditions ?? []).map((c) => (
                            <div key={c.condUid} className="dmc-char-row">
                              <span>
                                {c.condType} (≥{c.scaleQty})
                              </span>
                              <strong>
                                ${Number(c.rate || 0).toFixed(2)} {c.currency}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="dmc-kv">
                        <span>PIR Class / Quota</span>
                        <strong>
                          {inspectedRecord.pirClass || 'Missing'} ·{' '}
                          {inspectedRecord.mixingRatio
                            ? `${inspectedRecord.mixingRatio}%`
                            : 'Missing'}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </aside>
            )}
          </>
        ) : (
          batchOrder && (
            <div className="dmc-card dmc-stage-card">
              <DmcXmlEditor
                order={batchOrder}
                activeStep={activeStepId}
                onChangeOrder={setBatchOrder}
                onExportXml={handleExportXml}
              />
            </div>
          )
        )}
      </div>

      {/* Unified Linear Bottom Navigation Bar */}
      <div className="dmc-flow-footer dmc-flow-footer--outer">
        <div className="dmc-flow-footer-left">
          {prevStepObj ? (
            <button
              type="button"
              className="dmc-ghost-btn"
              onClick={() => setActiveStepIdx((i) => Math.max(0, i - 1))}
            >
              ← Back: {prevStepObj.label}
            </button>
          ) : (
            <span className="dmc-flow-hint">
              {records.length === 0
                ? 'Paste values into Grid Intake above and check against SAP to begin'
                : selectedIds.length > 0
                ? `${selectedIds.length} selected will enter sequential prep`
                : `All ${records.length} records in scope (or check specific rows)`}
            </span>
          )}
        </div>

        <div className="dmc-flow-footer-right">
          <span className="dmc-flow-hint">
            Step {activeStepIdx + 1} of {flowSteps.length}
            {validation ? ` · ${validation.pct}% valid` : ''}
          </span>
          {nextStepObj && (
            <button
              type="button"
              className="dmc-primary-btn"
              disabled={!canAdvanceFromCurrent}
              title={
                canAdvanceFromCurrent
                  ? `Proceed to ${nextStepObj.label}`
                  : 'Resolve all mandatory fields and allowed-value checks on this stage to proceed'
              }
              onClick={() =>
                ensureBatchAndNavigate(
                  Math.min(flowSteps.length - 1, activeStepIdx + 1)
                )
              }
            >
              {!canAdvanceFromCurrent && currentStageErrorCount > 0
                ? `🔒 Fix ${currentStageErrorCount} Check${
                    currentStageErrorCount === 1 ? '' : 's'
                  } to Continue`
                : `Next: ${nextStepObj.label} →`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
