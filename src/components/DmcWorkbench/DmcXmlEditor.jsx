import { useMemo, useState } from 'react';
import {
  BASE_UOMS,
  CONDITION_TYPES,
  CURRENCIES,
  EXPECTED_BKLAS_BY_MTART,
  getDbFieldOptions,
  LOT_SIZES,
  MATERIAL_CLASSES,
  MATERIAL_TYPES,
  MRP_TYPES,
  PIR_CLASSES,
  PRICE_CTRLS,
  PROC_TYPES,
  PURCH_ORGS,
  SAP_ACTIVE_PLANTS,
  SAP_DMC_FIELD_RULES,
  SAP_MATERIAL_DB,
  validateDmcOrder,
  VALUATION_CLASSES,
} from '../../data/dmcData';

const MATERIAL_LEVEL_FIELDS = new Set([
  'description',
  'matType',
  'uom',
  'className',
  'charColor',
  'charStorage',
  'charRegion',
]);

/**
 * Column-level drag-down / wrangle header control.
 */
function ColumnWrangleControl({
  fieldKey,
  options = [],
  allowCustom = true,
  placeholder = 'Pick or type...',
  onApply,
}) {
  const [mode, setMode] = useState(options.length > 0 ? 'select' : 'custom');
  const [val, setVal] = useState('');
  const trimmed = String(val).trim();

  return (
    <div className="dmc-col-wrangle">
      {mode === 'select' && options.length > 0 ? (
        <select
          className="dmc-wrangle-select"
          value={val}
          onChange={(e) => {
            if (e.target.value === '__CUSTOM__') {
              setMode('custom');
              setVal('');
            } else {
              setVal(e.target.value);
            }
          }}
          aria-label={`Wrangle ${fieldKey}`}
        >
          <option value="">DB values...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          {allowCustom && <option value="__CUSTOM__">+ Custom type...</option>}
        </select>
      ) : (
        <div className="dmc-wrangle-custom-wrap">
          <input
            type="text"
            className="dmc-wrangle-input"
            value={val}
            placeholder={placeholder}
            onChange={(e) => setVal(e.target.value)}
            aria-label={`Custom wrangle ${fieldKey}`}
          />
          {options.length > 0 && (
            <button
              type="button"
              className="dmc-wrangle-mode-btn"
              title="Back to DB values"
              onClick={() => {
                setMode('select');
                setVal('');
              }}
            >
              ▾
            </button>
          )}
        </div>
      )}

      <div className="dmc-wrangle-drag-btns">
        <button
          type="button"
          className="dmc-drag-btn"
          disabled={!trimmed}
          title="Apply to ALL rows in this column"
          onClick={() => onApply(fieldKey, trimmed, 'all')}
        >
          ↓ All
        </button>
        <button
          type="button"
          className="dmc-drag-btn dmc-drag-btn--soft"
          disabled={!trimmed}
          title="Fill only EMPTY cells in this column"
          onClick={() => onApply(fieldKey, trimmed, 'empty')}
        >
          ↓ Empty
        </button>
      </div>
    </div>
  );
}

export function DmcXmlEditor({
  order,
  activeStep = 'step1',
  onChangeOrder,
  onExportXml,
}) {
  const isPir = order.grain === 'pir';
  const includeValuation = Boolean(order.includeValuation);

  const [unlockedDescMats, setUnlockedDescMats] = useState({});
  const [selectedMats, setSelectedMats] = useState([]);
  const [palettePlants, setPalettePlants] = useState([]);
  const [dragOverMat, setDragOverMat] = useState(null);
  const [skipExistingPlants, setSkipExistingPlants] = useState(true);
  const [customPlantOpen, setCustomPlantOpen] = useState(false);
  const [customPlantCode, setCustomPlantCode] = useState('');
  const [customPlantConfirmed, setCustomPlantConfirmed] = useState(false);
  const [customPlantsAdded, setCustomPlantsAdded] = useState([]);
  const [showErrorsList, setShowErrorsList] = useState(false);
  const [showRulesPanel, setShowRulesPanel] = useState(false);

  const rows = order.rows;
  const conditions = order.conditions ?? [];
  const validation = useMemo(() => validateDmcOrder(order), [order]);

  const activeStageRules = useMemo(() => {
    const grainRules = isPir
      ? SAP_DMC_FIELD_RULES.pir
      : SAP_DMC_FIELD_RULES.material;
    if (activeStep === 'step1') return grainRules.step1 ?? [];
    if (activeStep === 'step2') {
      return isPir
        ? grainRules.step2 ?? []
        : [
            ...(grainRules.step2 ?? []),
            ...(includeValuation ? grainRules.step2Valuation ?? [] : []),
          ];
    }
    if (activeStep === 'step3') return grainRules.step3 ?? [];
    return [];
  }, [isPir, activeStep, includeValuation]);

  function getCellErr(uid, fieldKey) {
    return validation.cellErrors?.[`${uid}::${fieldKey}`] || '';
  }

  const uniqueMaterialRows = useMemo(() => {
    const out = [];
    const seen = new Set();
    for (const r of rows) {
      if (!seen.has(r.material)) {
        seen.add(r.material);
        out.push(r);
      }
    }
    return out;
  }, [rows]);

  const isDeduplicatedStep =
    !isPir && (activeStep === 'step1' || activeStep === 'step3');
  const displayRows = isDeduplicatedStep ? uniqueMaterialRows : rows;

  const availablePlants = useMemo(
    () => [
      ...SAP_ACTIVE_PLANTS,
      ...customPlantsAdded.map((code) => ({
        code,
        name: 'Custom Override',
        profitCenter: '',
        isCustom: true,
      })),
    ],
    [customPlantsAdded]
  );

  const plantMap = useMemo(
    () => Object.fromEntries(availablePlants.map((p) => [p.code, p])),
    [availablePlants]
  );

  const dbOptions = useMemo(
    () => ({
      matType: getDbFieldOptions('matType'),
      uom: getDbFieldOptions('uom'),
      mrpType: getDbFieldOptions('mrpType'),
      lotSize: getDbFieldOptions('lotSize'),
      procType: getDbFieldOptions('procType'),
      valuationClass: getDbFieldOptions('valuationClass'),
      priceCtrl: getDbFieldOptions('priceCtrl'),
      className: getDbFieldOptions('className'),
      charColor: getDbFieldOptions('charColor'),
      charStorage: getDbFieldOptions('charStorage'),
      charRegion: getDbFieldOptions('charRegion'),
      purchOrg: getDbFieldOptions('purchOrg'),
      currency: getDbFieldOptions('currency'),
      pirClass: getDbFieldOptions('pirClass'),
      condType: CONDITION_TYPES.map((c) => c.code),
    }),
    []
  );

  function setRows(nextRows) {
    onChangeOrder({ ...order, rows: nextRows });
  }

  function setConditions(nextConditions) {
    onChangeOrder({ ...order, conditions: nextConditions });
  }

  function updateCell(rowUid, field, value) {
    const targetRow = rows.find((r) => r.rowUid === rowUid);
    const syncByMaterial = !isPir && MATERIAL_LEVEL_FIELDS.has(field);

    setRows(
      rows.map((r) => {
        const matches = syncByMaterial
          ? r.material === targetRow?.material
          : r.rowUid === rowUid;
        if (!matches) return r;

        const next = { ...r, [field]: value };
        if (
          field === 'plant' &&
          plantMap[value]?.profitCenter &&
          !r.profitCenter
        ) {
          next.profitCenter = plantMap[value].profitCenter;
        }
        if (field === 'matType' && EXPECTED_BKLAS_BY_MTART[value]) {
          next.valuationClass = EXPECTED_BKLAS_BY_MTART[value];
        }
        return next;
      })
    );
  }

  function updateConditionCell(condUid, field, value) {
    setConditions(
      conditions.map((c) => (c.condUid === condUid ? { ...c, [field]: value } : c))
    );
  }

  function handleAddConditionRow(templateCond) {
    const base = templateCond || conditions[0];
    if (!base) return;
    const nextQty =
      Math.max(
        1,
        ...conditions
          .filter(
            (c) =>
              c.material === base.material &&
              c.vendor === base.vendor &&
              c.condType === base.condType
          )
          .map((c) => Number(c.scaleQty) || 1)
      ) + 500;

    setConditions([
      ...conditions,
      {
        ...base,
        condUid: `${base.material}__${base.vendor}__${base.condType}__${nextQty}__${Date.now()}`,
        scaleQty: nextQty,
        rate: '',
      },
    ]);
  }

  function handleRemoveConditionRow(condUid) {
    if (conditions.length <= 1) return;
    setConditions(conditions.filter((c) => c.condUid !== condUid));
  }

  function handleApplyColumnWrangle(fieldKey, value, scope) {
    if (isPir && activeStep === 'step2') {
      setConditions(
        conditions.map((c) => {
          if (scope === 'empty' && String(c[fieldKey] ?? '').trim().length > 0) {
            return c;
          }
          return { ...c, [fieldKey]: value };
        })
      );
      return;
    }

    setRows(
      rows.map((r) => {
        if (scope === 'empty' && String(r[fieldKey] ?? '').trim().length > 0) {
          return r;
        }
        const next = { ...r, [fieldKey]: value };
        if (fieldKey === 'matType' && EXPECTED_BKLAS_BY_MTART[value]) {
          next.valuationClass = EXPECTED_BKLAS_BY_MTART[value];
        }
        return next;
      })
    );
  }

  function handleToggleValuation() {
    onChangeOrder({ ...order, includeValuation: !includeValuation });
  }

  function handleRemoveRow(rowUid) {
    if (isDeduplicatedStep) {
      const targetRow = rows.find((r) => r.rowUid === rowUid);
      if (uniqueMaterialRows.length <= 1 || !targetRow) return;
      setRows(rows.filter((r) => r.material !== targetRow.material));
    } else {
      if (rows.length <= 1) return;
      setRows(rows.filter((r) => r.rowUid !== rowUid));
    }
  }

  // Targeted Plant Explosion: apply plantCodes ONLY to targetMaterials (Select-to-Apply OR Drag-and-Drop!)
  function applyPlantsToMaterials(targetMaterialCodes, plantCodes, mode = 'add') {
    if (!targetMaterialCodes.length || !plantCodes.length) return;
    const targetSet = new Set(targetMaterialCodes);
    const nextRows = [];

    for (const mat of uniqueMaterialRows) {
      const existingMatRows = rows.filter((r) => r.material === mat.material);
      if (!targetSet.has(mat.material)) {
        nextRows.push(...existingMatRows);
        continue;
      }

      const dbRec = SAP_MATERIAL_DB[mat.material];
      const existingByPlant = new Map(
        existingMatRows.filter((r) => r.plant).map((r) => [r.plant, r])
      );

      const desiredPlants =
        mode === 'replace'
          ? [...plantCodes]
          : Array.from(new Set([...existingByPlant.keys(), ...plantCodes]));

      const matOut = [];
      for (const pCode of desiredPlants) {
        if (
          skipExistingPlants &&
          dbRec?.exists &&
          dbRec.plants.includes(pCode) &&
          !existingByPlant.has(pCode)
        ) {
          continue;
        }
        if (existingByPlant.has(pCode)) {
          matOut.push(existingByPlant.get(pCode));
        } else {
          const plantInfo = plantMap[pCode];
          matOut.push({
            ...mat,
            rowUid: `${mat.material}__${pCode}`,
            plant: pCode,
            profitCenter: plantInfo?.profitCenter || '',
            valuationClass:
              mat.valuationClass || EXPECTED_BKLAS_BY_MTART[mat.matType] || '',
            mrpType: mat.mrpType || '',
            lotSize: mat.lotSize || '',
            procType: mat.procType || '',
            priceCtrl: mat.priceCtrl || '',
            stdPrice: mat.stdPrice || '',
          });
        }
      }

      nextRows.push(...(matOut.length > 0 ? matOut : existingMatRows));
    }

    setRows(nextRows);
  }

  function handleTogglePalettePlant(code) {
    setPalettePlants((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function handleToggleSelectMat(materialCode) {
    setSelectedMats((prev) =>
      prev.includes(materialCode)
        ? prev.filter((m) => m !== materialCode)
        : [...prev, materialCode]
    );
  }

  function handleDropPlantOnRow(e, rowMaterial) {
    e.preventDefault();
    setDragOverMat(null);
    const droppedPlant = e.dataTransfer.getData('text/plain');
    if (!droppedPlant) return;

    // If dropped onto a checked material, apply to ALL checked materials at once!
    const targets = selectedMats.includes(rowMaterial)
      ? selectedMats
      : [rowMaterial];
    applyPlantsToMaterials(targets, [droppedPlant], 'add');
  }

  function handleAddCustomPlant(e) {
    e.preventDefault();
    const cleaned = customPlantCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(cleaned) || !customPlantConfirmed) return;
    if (
      !SAP_ACTIVE_PLANTS.some((p) => p.code === cleaned) &&
      !customPlantsAdded.includes(cleaned)
    ) {
      setCustomPlantsAdded((prev) => [...prev, cleaned]);
    }
    if (!palettePlants.includes(cleaned)) {
      setPalettePlants((prev) => [...prev, cleaned]);
    }
    setCustomPlantCode('');
    setCustomPlantConfirmed(false);
    setCustomPlantOpen(false);
  }

  const customCodeValid = /^[A-Z0-9]{4}$/.test(
    customPlantCode.trim().toUpperCase()
  );

  const currentStepErrors =
    activeStep === 'step1'
      ? validation.stepErrors?.step1 ?? []
      : activeStep === 'step2'
      ? validation.stepErrors?.step2 ?? []
      : activeStep === 'step3'
      ? validation.stepErrors?.step3 ?? []
      : validation.errors;

  const allMatsSelected =
    uniqueMaterialRows.length > 0 &&
    uniqueMaterialRows.every((m) => selectedMats.includes(m.material));

  const targetMatsForApply =
    selectedMats.length > 0
      ? selectedMats
      : uniqueMaterialRows.map((m) => m.material);

  return (
    <div className="dmc-editor-root is-inline">
      {/* Compact Live SAP Validation Strip */}
      <div
        className={`dmc-validation-bar ${
          currentStepErrors.length === 0 ? 'is-clean' : 'has-errors'
        }`}
      >
        <span className="dmc-validation-summary">
          {activeStep === 'step4'
            ? validation.readyToExport
              ? '✓ Ready for SAP S/4HANA DMC upload — all required stages passed.'
              : `⚠ ${validation.errors.length} check(s) still open in earlier stages.`
            : currentStepErrors.length === 0
            ? '✓ Current stage checks passed — ready to move to the next step.'
            : `⚠ ${currentStepErrors.length} check(s) on this stage (${validation.errors.length} total).`}
        </span>

        <div className="dmc-validation-right">
          {!isPir && activeStep === 'step2' && (
            <label
              className="dmc-valuation-toggle"
              title="Only enable if your team maintains Accounting/Valuation (MBEW)."
            >
              <input
                type="checkbox"
                checked={includeValuation}
                onChange={handleToggleValuation}
              />
              <span>Include Valuation (Optional)</span>
            </label>
          )}

          {isPir && activeStep === 'step2' && (
            <button
              type="button"
              className="dmc-ghost-btn"
              onClick={() => handleAddConditionRow(conditions[0])}
            >
              + Add Scale / Cond. Row
            </button>
          )}

          {activeStageRules.length > 0 && (
            <button
              type="button"
              className="dmc-rules-pill-btn"
              onClick={() => setShowRulesPanel((s) => !s)}
            >
              {showRulesPanel
                ? 'Hide Stage Rules'
                : `Prepare Data · ${activeStageRules.length} Mandatory Rules`}
            </button>
          )}

          {validation.errors.length > 0 && (
            <button
              type="button"
              className="dmc-link-btn"
              onClick={() => setShowErrorsList((s) => !s)}
            >
              {showErrorsList ? 'Hide issues' : 'Review issues'}
            </button>
          )}
        </div>
      </div>

      {/* Configured Mandatory Fields & Allowed-Values Reference Panel */}
      {showRulesPanel && activeStageRules.length > 0 && (
        <div className="dmc-rules-panel" role="region" aria-label="Configured SAP field rules">
          <div className="dmc-rules-panel-head">
            <strong>Configured Stage Rules &amp; Allowed Values</strong>
            <span>All mandatory fields must match allowed SAP values to unlock the next step.</span>
          </div>
          <div className="dmc-rules-grid">
            {activeStageRules.map((rule) => (
              <div key={rule.sapField} className="dmc-rule-chip">
                <div className="dmc-rule-top">
                  <strong>{rule.sapField}*</strong>
                  <span>{rule.label}</span>
                </div>
                <div className="dmc-rule-meta">
                  {rule.allowedValues ? (
                    <span>Allowed: {rule.allowedValues.join(', ')}</span>
                  ) : (
                    <span>{rule.prepHint}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showErrorsList && validation.errors.length > 0 && (
        <ul className="dmc-error-list">
          {validation.errors.slice(0, 8).map((err, i) => (
            <li key={i}>{err}</li>
          ))}
          {validation.errors.length > 8 && (
            <li>+{validation.errors.length - 8} more validation issues…</li>
          )}
        </ul>
      )}

      {/* Targeted Select + Drag-and-Drop Plant Palette (Material Step 2) */}
      {!isPir && activeStep === 'step2' && (
        <div className="dmc-explosion-bar">
          <div className="dmc-explosion-top">
            <div className="dmc-explosion-title-group">
              <span className="dmc-explosion-label">
                Plants · Drag onto row OR select rows &amp; Apply
              </span>
              <label className="dmc-skip-existing-check">
                <input
                  type="checkbox"
                  checked={skipExistingPlants}
                  onChange={(e) => setSkipExistingPlants(e.target.checked)}
                />
                <span>Skip existing in SAP</span>
              </label>
              <button
                type="button"
                className="dmc-link-btn"
                onClick={() => setCustomPlantOpen((o) => !o)}
              >
                {customPlantOpen ? 'Cancel' : '+ Custom Plant'}
              </button>
            </div>

            <div className="dmc-explosion-actions">
              <button
                type="button"
                className="dmc-ghost-btn"
                disabled={palettePlants.length === 0}
                onClick={() =>
                  applyPlantsToMaterials(
                    targetMatsForApply,
                    palettePlants,
                    'add'
                  )
                }
              >
                + Add to{' '}
                {selectedMats.length > 0
                  ? `${selectedMats.length} Selected`
                  : 'All'}
              </button>
              <button
                type="button"
                className="dmc-primary-btn"
                disabled={palettePlants.length === 0}
                onClick={() =>
                  applyPlantsToMaterials(
                    targetMatsForApply,
                    palettePlants,
                    'replace'
                  )
                }
              >
                Set Plants for{' '}
                {selectedMats.length > 0
                  ? `${selectedMats.length} Selected`
                  : 'All'}
              </button>
            </div>
          </div>

          <div className="dmc-explosion-chips">
            {availablePlants.map((p) => {
              const selected = palettePlants.includes(p.code);
              return (
                <button
                  key={p.code}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', p.code);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className={`dmc-plant-chip dmc-plant-chip--draggable ${
                    selected ? 'is-selected' : ''
                  } ${p.isCustom ? 'is-custom' : ''}`}
                  onClick={() => handleTogglePalettePlant(p.code)}
                  title={`Click to select, or drag ${p.code} directly onto any material row below`}
                >
                  <span className="dmc-drag-grip" aria-hidden="true">
                    ⋮⋮
                  </span>
                  <strong>{p.code}</strong>
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {customPlantOpen && (
            <form
              className="dmc-custom-plant-guard"
              onSubmit={handleAddCustomPlant}
            >
              <span className="dmc-guard-warn">
                ⚠ Unconfigured SAP plants (T001W) will fail DMC simulation.
              </span>
              <div className="dmc-guard-controls">
                <input
                  type="text"
                  maxLength={4}
                  className="dmc-guard-input"
                  placeholder="4-char code (e.g. 5200)"
                  value={customPlantCode}
                  onChange={(e) => setCustomPlantCode(e.target.value)}
                />
                <label className="dmc-guard-check">
                  <input
                    type="checkbox"
                    checked={customPlantConfirmed}
                    onChange={(e) => setCustomPlantConfirmed(e.target.checked)}
                  />
                  <span>Confirmed in SAP T001W</span>
                </label>
                <button
                  type="submit"
                  className="dmc-ghost-btn"
                  disabled={!customCodeValid || !customPlantConfirmed}
                >
                  Add
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Stage 4: Final Done & Export Summary View */}
      {activeStep === 'step4' ? (
        <div className="dmc-done-stage">
          <div className="dmc-done-card">
            <div className="dmc-done-head">
              <span
                className={`dmc-done-badge ${
                  validation.readyToExport ? 'is-ready' : 'is-blocked'
                }`}
              >
                {validation.readyToExport ? '✓ Ready to Export' : '⚠ Checks Open'}
              </span>
              <h4>
                {isPir
                  ? 'PIR, Conditions & Quota DMC Workbook'
                  : 'Material Master DMC Workbook'}
              </h4>
            </div>

            <div className="dmc-done-sheets">
              {!isPir ? (
                <>
                  <div className="dmc-sheet-stat">
                    <span>Worksheet 1 · Basic_Data_MARA</span>
                    <strong>{uniqueMaterialRows.length} unique material(s)</strong>
                  </div>
                  <div className="dmc-sheet-stat">
                    <span>Worksheet 2 · Plant_MRP_MARC</span>
                    <strong>{rows.length} material × plant row(s)</strong>
                  </div>
                  <div className="dmc-sheet-stat">
                    <span>Worksheet 3 · Valuation_MBEW</span>
                    <strong>
                      {includeValuation
                        ? `${rows.length} row(s) included`
                        : 'Skipped (optional layer off)'}
                    </strong>
                  </div>
                  <div className="dmc-sheet-stat">
                    <span>Worksheet 4 · Classification_CLFMAS</span>
                    <strong>{uniqueMaterialRows.length} object class row(s)</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="dmc-sheet-stat">
                    <span>Worksheet 1 · PIR_Header_EINA_EINE</span>
                    <strong>{rows.length} PIR header(s)</strong>
                  </div>
                  <div className="dmc-sheet-stat">
                    <span>Worksheet 2 · Conditions_KONP / Scales_KONM</span>
                    <strong>{conditions.length} condition / scale row(s)</strong>
                  </div>
                  <div className="dmc-sheet-stat">
                    <span>Worksheet 3 · PIR_Classification</span>
                    <strong>{rows.length} class assignment(s)</strong>
                  </div>
                  <div className="dmc-sheet-stat">
                    <span>Worksheet 4 · Quota_Mixing_Ratio</span>
                    <strong>{rows.length} quota allocation(s)</strong>
                  </div>
                </>
              )}
            </div>

            <div className="dmc-done-actions">
              <button
                type="button"
                className={`dmc-export-btn dmc-export-btn--lg ${
                  validation.readyToExport ? 'is-ready' : 'is-locked'
                }`}
                disabled={!validation.readyToExport}
                onClick={onExportXml}
              >
                {validation.readyToExport
                  ? 'Download SAP DMC XML Workbook ↓'
                  : `Resolve ${validation.errors.length} Check(s) in Previous Steps`}
              </button>
            </div>
          </div>
        </div>
      ) : isPir && activeStep === 'step2' ? (
        /* PIR Step 2: Expanded Conditions & Price Scales Grid (KONP / KONM) */
        <div className="dmc-modal-table-wrap">
          <table className="dmc-xml-grid">
            <thead>
              <tr>
                <th>Check</th>
                <th>PRODUCT*</th>
                <th>SUPPLIER*</th>
                <th>WERKS*</th>
                <th>KSCHL* (Cond.)</th>
                <th>KSTBM* (Scale Qty)</th>
                <th>KBETR* (Rate)</th>
                <th>WAERS*</th>
                <th>DATAB* (From)</th>
                <th>DATBI* (To)</th>
                <th />
              </tr>
              <tr className="dmc-col-wrangle-row">
                <th className="dmc-wrangle-row-lbl" colSpan={4}>
                  Column Wrangle · Drag Down
                </th>
                <th>
                  <ColumnWrangleControl
                    fieldKey="condType"
                    options={dbOptions.condType}
                    allowCustom
                    placeholder="KSCHL..."
                    onApply={handleApplyColumnWrangle}
                  />
                </th>
                <th className="dmc-wrangle-muted">Ascending</th>
                <th className="dmc-wrangle-muted">Per tier</th>
                <th>
                  <ColumnWrangleControl
                    fieldKey="currency"
                    options={dbOptions.currency}
                    allowCustom={false}
                    onApply={handleApplyColumnWrangle}
                  />
                </th>
                <th className="dmc-wrangle-muted" colSpan={2}>
                  Validity window
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {conditions.map((c) => {
                const errs = validation.rowErrors[c.condUid] ?? [];
                return (
                  <tr
                    key={c.condUid}
                    className={errs.length > 0 ? 'has-row-error' : ''}
                  >
                    <td>
                      <span
                        className={`dmc-row-badge ${
                          errs.length === 0 ? 'is-ok' : 'is-req'
                        }`}
                        title={errs.join('\n') || 'Condition valid'}
                      >
                        {errs.length === 0 ? '✓' : `${errs.length}!`}
                      </span>
                    </td>
                    <td className="dmc-ref-cell">{c.material}</td>
                    <td className="dmc-ref-cell">{c.vendor}</td>
                    <td className="dmc-ref-desc">{c.plant || '—'}</td>
                    <td>
                      <select
                        className="dmc-cell-select dmc-cell-select--sm"
                        value={c.condType || ''}
                        onChange={(e) =>
                          updateConditionCell(
                            c.condUid,
                            'condType',
                            e.target.value
                          )
                        }
                      >
                        <option value="">—</option>
                        {CONDITION_TYPES.map((ct) => (
                          <option key={ct.code} value={ct.code}>
                            {ct.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="dmc-cell-input dmc-cell-input--xs"
                        value={c.scaleQty ?? 1}
                        onChange={(e) =>
                          updateConditionCell(
                            c.condUid,
                            'scaleQty',
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="dmc-cell-input dmc-cell-input--xs"
                        value={c.rate ?? ''}
                        placeholder="0.00"
                        onChange={(e) =>
                          updateConditionCell(c.condUid, 'rate', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="dmc-cell-select dmc-cell-select--xs"
                        value={c.currency || 'USD'}
                        onChange={(e) =>
                          updateConditionCell(
                            c.condUid,
                            'currency',
                            e.target.value
                          )
                        }
                      >
                        {CURRENCIES.map((cur) => (
                          <option key={cur} value={cur}>
                            {cur}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        className="dmc-cell-input dmc-cell-input--sm"
                        value={c.validFrom || '2026-01-01'}
                        onChange={(e) =>
                          updateConditionCell(
                            c.condUid,
                            'validFrom',
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="dmc-cell-input dmc-cell-input--sm"
                        value={c.validTo || '2026-12-31'}
                        onChange={(e) =>
                          updateConditionCell(
                            c.condUid,
                            'validTo',
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dmc-row-del-btn"
                        title="Add scale tier for this condition"
                        onClick={() => handleAddConditionRow(c)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="dmc-row-del-btn"
                        disabled={conditions.length <= 1}
                        title="Remove condition row"
                        onClick={() => handleRemoveConditionRow(c.condUid)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Material Steps 1–3 & PIR Steps 1, 3 Inline Grid */
        <div className="dmc-modal-table-wrap">
          <table className="dmc-xml-grid">
            <thead>
              <tr>
                {!isPir && activeStep === 'step2' && (
                  <th className="dmc-col-check">
                    <input
                      type="checkbox"
                      checked={allMatsSelected}
                      onChange={() =>
                        setSelectedMats(
                          allMatsSelected
                            ? []
                            : uniqueMaterialRows.map((m) => m.material)
                        )
                      }
                      aria-label="Select all materials for plant assignment"
                    />
                  </th>
                )}
                <th>Check</th>
                <th>PRODUCT*</th>
                {isPir ? <th>SUPPLIER*</th> : <th>PRODUCT_DESC*</th>}

                {!isPir && activeStep === 'step1' && (
                  <>
                    <th>MTART* (Type)</th>
                    <th>MEINS* (UoM)</th>
                  </>
                )}
                {!isPir && activeStep === 'step2' && (
                  <>
                    <th>WERKS* (Plant)</th>
                    <th>PROFIT_CTR*</th>
                    <th>DISMM* (MRP)</th>
                    <th>DISLS* (Lot)</th>
                    <th>BESKZ* (Proc)</th>
                    {includeValuation && (
                      <>
                        <th>BKLAS* (Val)</th>
                        <th>PRICE_CTRL*</th>
                        <th>STD_PRICE*</th>
                      </>
                    )}
                  </>
                )}
                {!isPir && activeStep === 'step3' && (
                  <>
                    <th>CLASS* (001)</th>
                    <th>CHAR: COLOR*</th>
                    <th>CHAR: STORAGE*</th>
                    <th>CHAR: REGION_LOCK*</th>
                  </>
                )}

                {isPir && activeStep === 'step1' && (
                  <>
                    <th>EKORG* (P.Org)</th>
                    <th>WERKS* (Plant)</th>
                    <th>WAERS*</th>
                    <th>REPOS*</th>
                  </>
                )}
                {isPir && activeStep === 'step3' && (
                  <>
                    <th>WERKS*</th>
                    <th>PIR_CLASS*</th>
                    <th>QUOTA %* (Sum=100)</th>
                    <th>VALID_TO*</th>
                  </>
                )}
                <th />
              </tr>

              {/* Column-Level Wrangle Row */}
              <tr className="dmc-col-wrangle-row">
                <th
                  className="dmc-wrangle-row-lbl"
                  colSpan={!isPir && activeStep === 'step2' ? 4 : 3}
                >
                  Column Wrangle · Drag Down
                </th>

                {!isPir && activeStep === 'step1' && (
                  <>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="matType"
                        options={dbOptions.matType}
                        allowCustom={false}
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="uom"
                        options={dbOptions.uom}
                        allowCustom
                        placeholder="Custom UoM..."
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                  </>
                )}

                {!isPir && activeStep === 'step2' && (
                  <>
                    <th className="dmc-wrangle-muted">Drag chip ↓</th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="profitCenter"
                        options={SAP_ACTIVE_PLANTS.map((p) => p.profitCenter)}
                        allowCustom
                        placeholder="PC-..."
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="mrpType"
                        options={dbOptions.mrpType}
                        allowCustom={false}
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="lotSize"
                        options={dbOptions.lotSize}
                        allowCustom={false}
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="procType"
                        options={dbOptions.procType}
                        allowCustom={false}
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    {includeValuation && (
                      <>
                        <th>
                          <ColumnWrangleControl
                            fieldKey="valuationClass"
                            options={dbOptions.valuationClass}
                            allowCustom={false}
                            onApply={handleApplyColumnWrangle}
                          />
                        </th>
                        <th>
                          <ColumnWrangleControl
                            fieldKey="priceCtrl"
                            options={dbOptions.priceCtrl}
                            allowCustom={false}
                            onApply={handleApplyColumnWrangle}
                          />
                        </th>
                        <th>
                          <ColumnWrangleControl
                            fieldKey="stdPrice"
                            options={[]}
                            allowCustom
                            placeholder="Std Price..."
                            onApply={handleApplyColumnWrangle}
                          />
                        </th>
                      </>
                    )}
                  </>
                )}

                {!isPir && activeStep === 'step3' && (
                  <>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="className"
                        options={dbOptions.className}
                        allowCustom
                        placeholder="Class..."
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="charColor"
                        options={dbOptions.charColor}
                        allowCustom
                        placeholder="Color..."
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="charStorage"
                        options={dbOptions.charStorage}
                        allowCustom
                        placeholder="Storage..."
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="charRegion"
                        options={dbOptions.charRegion}
                        allowCustom
                        placeholder="Region..."
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                  </>
                )}

                {isPir && activeStep === 'step1' && (
                  <>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="purchOrg"
                        options={dbOptions.purchOrg}
                        allowCustom={false}
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th className="dmc-wrangle-muted">Per-row</th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="currency"
                        options={dbOptions.currency}
                        allowCustom={false}
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th className="dmc-wrangle-muted">Required</th>
                  </>
                )}

                {isPir && activeStep === 'step3' && (
                  <>
                    <th className="dmc-wrangle-muted">Per-row</th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="pirClass"
                        options={dbOptions.pirClass}
                        allowCustom
                        placeholder="PIR Class..."
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th>
                      <ColumnWrangleControl
                        fieldKey="mixingRatio"
                        options={['100', '70', '50', '30']}
                        allowCustom
                        placeholder="Quota %..."
                        onApply={handleApplyColumnWrangle}
                      />
                    </th>
                    <th className="dmc-wrangle-muted">Valid To</th>
                  </>
                )}

                <th />
              </tr>
            </thead>

            <tbody>
              {displayRows.map((r) => {
                const errs = validation.rowErrors[r.rowUid] ?? [];
                const bklasExpected = r.matType
                  ? EXPECTED_BKLAS_BY_MTART[r.matType]
                  : null;
                const bklasMismatch =
                  includeValuation &&
                  Boolean(bklasExpected) &&
                  Boolean(r.valuationClass) &&
                  r.valuationClass !== bklasExpected;
                const isDescLocked =
                  Boolean(r.descriptionFromIntake) &&
                  !unlockedDescMats[r.material];
                const isMatChecked = selectedMats.includes(r.material);
                const isDropTarget =
                  !isPir &&
                  activeStep === 'step2' &&
                  dragOverMat === r.material;

                return (
                  <tr
                    key={r.rowUid}
                    className={`${errs.length > 0 ? 'has-row-error' : ''} ${
                      isMatChecked && activeStep === 'step2'
                        ? 'is-mat-selected'
                        : ''
                    } ${isDropTarget ? 'is-drop-target' : ''}`}
                    onDragOver={
                      !isPir && activeStep === 'step2'
                        ? (e) => {
                            e.preventDefault();
                            if (dragOverMat !== r.material) {
                              setDragOverMat(r.material);
                            }
                          }
                        : undefined
                    }
                    onDragLeave={
                      !isPir && activeStep === 'step2'
                        ? () => setDragOverMat(null)
                        : undefined
                    }
                    onDrop={
                      !isPir && activeStep === 'step2'
                        ? (e) => handleDropPlantOnRow(e, r.material)
                        : undefined
                    }
                  >
                    {!isPir && activeStep === 'step2' && (
                      <td className="dmc-col-check">
                        <input
                          type="checkbox"
                          checked={isMatChecked}
                          onChange={() => handleToggleSelectMat(r.material)}
                          aria-label={`Select ${r.material} for plant assignment`}
                        />
                      </td>
                    )}

                    <td>
                      <span
                        className={`dmc-row-badge ${
                          errs.length === 0 ? 'is-ok' : 'is-req'
                        }`}
                        title={errs.join('\n') || 'Row valid'}
                      >
                        {errs.length === 0 ? '✓' : `${errs.length}!`}
                      </span>
                    </td>

                    <td className="dmc-ref-cell">{r.material}</td>

                    {isPir ? (
                      <td className="dmc-ref-cell">{r.vendor}</td>
                    ) : (
                      <td>
                        {activeStep === 'step1' ? (
                          isDescLocked ? (
                            <div className="dmc-locked-field">
                              <span className="dmc-locked-text">
                                {r.description}
                              </span>
                              <span className="dmc-intake-pill">Intake</span>
                              <button
                                type="button"
                                className="dmc-unlock-btn"
                                onClick={() =>
                                  setUnlockedDescMats((prev) => ({
                                    ...prev,
                                    [r.material]: true,
                                  }))
                                }
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <input
                              type="text"
                              className="dmc-cell-input"
                              value={r.description}
                              placeholder="Required description..."
                              onChange={(e) =>
                                updateCell(
                                  r.rowUid,
                                  'description',
                                  e.target.value
                                )
                              }
                            />
                          )
                        ) : (
                          <span className="dmc-ref-desc">
                            {r.description || '—'}
                          </span>
                        )}
                      </td>
                    )}

                    {!isPir && activeStep === 'step1' && (
                      <>
                        <td>
                          <select
                            className={`dmc-cell-select ${
                              getCellErr(r.rowUid, 'matType') ? 'is-invalid' : ''
                            }`}
                            title={getCellErr(r.rowUid, 'matType') || 'MTART'}
                            value={r.matType}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'matType', e.target.value)
                            }
                          >
                            <option value="">Select...</option>
                            {Array.from(
                              new Set([
                                ...MATERIAL_TYPES,
                                ...(r.matType ? [r.matType] : []),
                              ])
                            ).map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className={`dmc-cell-select ${
                              getCellErr(r.rowUid, 'uom') ? 'is-invalid' : ''
                            }`}
                            title={getCellErr(r.rowUid, 'uom') || 'MEINS'}
                            value={r.uom}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'uom', e.target.value)
                            }
                          >
                            <option value="">Select...</option>
                            {Array.from(
                              new Set([
                                ...BASE_UOMS,
                                ...(r.uom ? [r.uom] : []),
                              ])
                            ).map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>
                      </>
                    )}

                    {!isPir && activeStep === 'step2' && (
                      <>
                        <td>
                          <select
                            className={`dmc-cell-select ${
                              getCellErr(r.rowUid, 'plant') ? 'is-invalid' : ''
                            }`}
                            title={getCellErr(r.rowUid, 'plant') || 'WERKS'}
                            value={r.plant}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'plant', e.target.value)
                            }
                          >
                            <option value="">Select...</option>
                            {availablePlants.map((p) => (
                              <option key={p.code} value={p.code}>
                                {p.code} — {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className={`dmc-cell-input dmc-cell-input--sm ${
                              getCellErr(r.rowUid, 'profitCenter')
                                ? 'is-invalid'
                                : ''
                            }`}
                            title={
                              getCellErr(r.rowUid, 'profitCenter') ||
                              'PROFIT_CTR'
                            }
                            value={r.profitCenter || ''}
                            placeholder="e.g. PC-US01"
                            onChange={(e) =>
                              updateCell(
                                r.rowUid,
                                'profitCenter',
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <select
                            className={`dmc-cell-select dmc-cell-select--xs ${
                              getCellErr(r.rowUid, 'mrpType')
                                ? 'is-invalid'
                                : ''
                            }`}
                            title={getCellErr(r.rowUid, 'mrpType') || 'DISMM'}
                            value={r.mrpType}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'mrpType', e.target.value)
                            }
                          >
                            <option value="">—</option>
                            {MRP_TYPES.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className={`dmc-cell-select dmc-cell-select--xs ${
                              getCellErr(r.rowUid, 'lotSize')
                                ? 'is-invalid'
                                : ''
                            }`}
                            title={getCellErr(r.rowUid, 'lotSize') || 'DISLS'}
                            value={r.lotSize || ''}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'lotSize', e.target.value)
                            }
                          >
                            <option value="">—</option>
                            {LOT_SIZES.map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className={`dmc-cell-select dmc-cell-select--sm ${
                              getCellErr(r.rowUid, 'procType')
                                ? 'is-invalid'
                                : ''
                            }`}
                            title={getCellErr(r.rowUid, 'procType') || 'BESKZ'}
                            value={r.procType || ''}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'procType', e.target.value)
                            }
                          >
                            <option value="">—</option>
                            {PROC_TYPES.map((p) => (
                              <option key={p.code} value={p.code}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        {includeValuation && (
                          <>
                            <td>
                              <select
                                className={`dmc-cell-select dmc-cell-select--xs ${
                                  bklasMismatch ? 'is-invalid' : ''
                                }`}
                                value={r.valuationClass}
                                onChange={(e) =>
                                  updateCell(
                                    r.rowUid,
                                    'valuationClass',
                                    e.target.value
                                  )
                                }
                              >
                                <option value="">—</option>
                                {VALUATION_CLASSES.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                className="dmc-cell-select dmc-cell-select--sm"
                                value={r.priceCtrl || ''}
                                onChange={(e) =>
                                  updateCell(
                                    r.rowUid,
                                    'priceCtrl',
                                    e.target.value
                                  )
                                }
                              >
                                <option value="">—</option>
                                {PRICE_CTRLS.map((pc) => (
                                  <option key={pc.code} value={pc.code}>
                                    {pc.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="dmc-cell-input dmc-cell-input--xs"
                                value={r.stdPrice ?? ''}
                                placeholder="0.00"
                                onChange={(e) =>
                                  updateCell(
                                    r.rowUid,
                                    'stdPrice',
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          </>
                        )}
                      </>
                    )}

                    {!isPir && activeStep === 'step3' && (
                      <>
                        <td>
                          <select
                            className="dmc-cell-select"
                            value={r.className}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'className', e.target.value)
                            }
                          >
                            <option value="">Select class...</option>
                            {Array.from(
                              new Set([
                                ...MATERIAL_CLASSES,
                                ...(r.className ? [r.className] : []),
                              ])
                            ).map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="dmc-cell-input"
                            value={r.charColor}
                            placeholder="Enter color..."
                            onChange={(e) =>
                              updateCell(r.rowUid, 'charColor', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="dmc-cell-input"
                            value={r.charStorage}
                            placeholder="Enter storage..."
                            onChange={(e) =>
                              updateCell(
                                r.rowUid,
                                'charStorage',
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="dmc-cell-input"
                            value={r.charRegion}
                            placeholder="Enter region lock..."
                            onChange={(e) =>
                              updateCell(r.rowUid, 'charRegion', e.target.value)
                            }
                          />
                        </td>
                      </>
                    )}

                    {isPir && activeStep === 'step1' && (
                      <>
                        <td>
                          <select
                            className="dmc-cell-select dmc-cell-select--xs"
                            value={r.purchOrg || ''}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'purchOrg', e.target.value)
                            }
                          >
                            <option value="">—</option>
                            {PURCH_ORGS.map((po) => (
                              <option key={po} value={po}>
                                {po}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="dmc-cell-select"
                            value={r.plant || ''}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'plant', e.target.value)
                            }
                          >
                            <option value="">Select...</option>
                            {availablePlants.map((p) => (
                              <option key={p.code} value={p.code}>
                                {p.code} — {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="dmc-cell-select dmc-cell-select--xs"
                            value={r.currency || 'USD'}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'currency', e.target.value)
                            }
                          >
                            {CURRENCIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="dmc-col-check">
                          <input
                            type="checkbox"
                            checked={Boolean(r.invoiceReceipt)}
                            onChange={(e) =>
                              updateCell(
                                r.rowUid,
                                'invoiceReceipt',
                                e.target.checked
                              )
                            }
                          />
                        </td>
                      </>
                    )}

                    {isPir && activeStep === 'step3' && (
                      <>
                        <td className="dmc-ref-desc">{r.plant || '—'}</td>
                        <td>
                          <select
                            className="dmc-cell-select"
                            value={r.pirClass || ''}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'pirClass', e.target.value)
                            }
                          >
                            <option value="">Select PIR class...</option>
                            {Array.from(
                              new Set([
                                ...PIR_CLASSES,
                                ...(r.pirClass ? [r.pirClass] : []),
                              ])
                            ).map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="dmc-cell-input dmc-cell-input--xs"
                            value={r.mixingRatio ?? ''}
                            placeholder="0–100"
                            onChange={(e) =>
                              updateCell(
                                r.rowUid,
                                'mixingRatio',
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="dmc-cell-input dmc-cell-input--sm"
                            value={r.validTo || '2026-12-31'}
                            onChange={(e) =>
                              updateCell(r.rowUid, 'validTo', e.target.value)
                            }
                          />
                        </td>
                      </>
                    )}

                    <td>
                      <button
                        type="button"
                        className="dmc-row-del-btn"
                        onClick={() => handleRemoveRow(r.rowUid)}
                        disabled={displayRows.length <= 1}
                        title="Remove row from batch"
                        aria-label={`Remove ${r.material}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
