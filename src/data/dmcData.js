// Realistic SAP S/4HANA Migration Cockpit (DMC) master data, validation rules & multi-sheet XML exporter

export const SAP_ACTIVE_PLANTS = [
  { code: '1000', name: 'Cupertino HQ', region: 'Americas', profitCenter: 'PC-US01' },
  { code: '1010', name: 'Austin Manufacturing', region: 'Americas', profitCenter: 'PC-US02' },
  { code: '1020', name: 'Elk Grove Hub', region: 'Americas', profitCenter: 'PC-US03' },
  { code: '1050', name: 'Rialto Distribution', region: 'Americas', profitCenter: 'PC-US04' },
  { code: '2100', name: 'Cork EMEA Operations', region: 'Europe', profitCenter: 'PC-EU01' },
  { code: '2200', name: 'Munich Silicon Lab', region: 'Europe', profitCenter: 'PC-EU02' },
  { code: '2300', name: 'Prague Logistics', region: 'Europe', profitCenter: 'PC-EU03' },
  { code: '3000', name: 'Zhengzhou Assembly', region: 'APAC', profitCenter: 'PC-AP01' },
  { code: '3100', name: 'Shenzhen Supply Hub', region: 'APAC', profitCenter: 'PC-AP02' },
  { code: '3200', name: 'Chennai Assembly', region: 'APAC', profitCenter: 'PC-AP03' },
  { code: '4000', name: 'Singapore APAC Hub', region: 'APAC', profitCenter: 'PC-AP04' },
  { code: '4100', name: 'Tokyo Distribution', region: 'APAC', profitCenter: 'PC-AP05' },
];

export const MATERIAL_TYPES = ['FERT', 'HALB', 'ROH', 'HAWA'];
export const BASE_UOMS = ['EA', 'PC', 'KG', 'SET'];
export const VALUATION_CLASSES = ['7920', '7900', '3000', '3100'];
export const MRP_TYPES = ['PD', 'ND', 'VB', 'X0'];
export const LOT_SIZES = ['EX', 'FX', 'MB', 'HB'];
export const PROC_TYPES = [
  { code: 'F', label: 'F — External' },
  { code: 'E', label: 'E — In-House' },
  { code: 'X', label: 'X — Both' },
];
export const PRICE_CTRLS = [
  { code: 'S', label: 'S — Standard' },
  { code: 'V', label: 'V — Moving Avg' },
];
export const PURCH_ORGS = ['PO01', 'PO02', 'PO03'];
export const CURRENCIES = ['USD', 'EUR', 'JPY', 'CNY'];
export const MATERIAL_CLASSES = [
  'Z_APPLE_IPHONE',
  'Z_APPLE_MAC',
  'Z_APPLE_ACCESSORY',
  'Z_APPLE_SILICON',
];
export const PIR_CLASSES = ['Z_PIR_TIER1', 'Z_PIR_TIER2', 'Z_PIR_SILICON'];

// SAP Cross-Field Rule: Material Type (MTART) -> Valid Valuation Class (BKLAS)
export const EXPECTED_BKLAS_BY_MTART = {
  FERT: '7920',
  HALB: '7900',
  ROH: '3000',
  HAWA: '3100',
};

/**
 * Centralized SAP DMC Field Governance & Allowed-Value Rules (Admin-Configurable).
 * Drives both per-stage "Prepare Data" guidance and strict forward-navigation blocking.
 */
export const SAP_DMC_FIELD_RULES = {
  material: {
    step1: [
      {
        key: 'description',
        sapField: 'PRODUCT_DESC',
        label: 'Material Description',
        required: true,
        ruleType: 'nonEmpty',
        prepHint: 'Max 40 chars (MAKT-MAKTX)',
      },
      {
        key: 'matType',
        sapField: 'MTART',
        label: 'Material Type',
        required: true,
        allowedValues: MATERIAL_TYPES,
        prepHint: 'Must match SAP T134 config',
      },
      {
        key: 'uom',
        sapField: 'MEINS',
        label: 'Base UoM',
        required: true,
        allowedValues: BASE_UOMS,
        prepHint: 'ISO Base Unit (T006)',
      },
    ],
    step2: [
      {
        key: 'plant',
        sapField: 'WERKS',
        label: 'Plant',
        required: true,
        ruleType: 'sapPlant',
        prepHint: 'Active SAP Plant (T001W)',
      },
      {
        key: 'profitCenter',
        sapField: 'PROFIT_CTR',
        label: 'Profit Center',
        required: true,
        ruleType: 'nonEmpty',
        prepHint: 'Assigned per Plant (CEPC)',
      },
      {
        key: 'mrpType',
        sapField: 'DISMM',
        label: 'MRP Type',
        required: true,
        allowedValues: MRP_TYPES,
        prepHint: 'Planning strategy (T438A)',
      },
      {
        key: 'lotSize',
        sapField: 'DISLS',
        label: 'Lot Size',
        required: true,
        allowedValues: LOT_SIZES,
        prepHint: 'Lot-sizing procedure (T439A)',
      },
      {
        key: 'procType',
        sapField: 'BESKZ',
        label: 'Procurement Type',
        required: true,
        allowedValues: PROC_TYPES.map((p) => p.code),
        prepHint: 'F (External), E (In-House), X (Both)',
      },
    ],
    step2Valuation: [
      {
        key: 'valuationClass',
        sapField: 'BKLAS',
        label: 'Valuation Class',
        required: true,
        allowedValues: VALUATION_CLASSES,
        prepHint: 'Must match MTART mapping',
      },
      {
        key: 'priceCtrl',
        sapField: 'PRICE_CTRL',
        label: 'Price Control',
        required: true,
        allowedValues: PRICE_CTRLS.map((p) => p.code),
        prepHint: 'S (Standard) or V (Moving Avg)',
      },
      {
        key: 'stdPrice',
        sapField: 'STD_PRICE',
        label: 'Standard Price',
        required: true,
        ruleType: 'positiveNumber',
        prepHint: 'Must be > 0',
      },
    ],
    step3: [
      {
        key: 'className',
        sapField: 'CLASS',
        label: 'Material Class (001)',
        required: true,
        allowedValues: MATERIAL_CLASSES,
        prepHint: 'Configured SAP Class (KLAH)',
      },
      {
        key: 'charColor',
        sapField: 'CHAR_COLOR',
        label: 'Color',
        required: true,
        ruleType: 'nonEmpty',
        prepHint: 'Mandatory characteristic',
      },
      {
        key: 'charStorage',
        sapField: 'CHAR_STORAGE',
        label: 'Storage',
        required: true,
        ruleType: 'nonEmpty',
        prepHint: 'Mandatory characteristic (or N/A)',
      },
      {
        key: 'charRegion',
        sapField: 'CHAR_REGION_LOCK',
        label: 'Region Lock',
        required: true,
        ruleType: 'nonEmpty',
        prepHint: 'Mandatory characteristic',
      },
    ],
  },
  pir: {
    step1: [
      {
        key: 'purchOrg',
        sapField: 'EKORG',
        label: 'Purchasing Org',
        required: true,
        allowedValues: PURCH_ORGS,
        prepHint: 'Configured SAP Purch Org (T024E)',
      },
      {
        key: 'plant',
        sapField: 'WERKS',
        label: 'Plant',
        required: true,
        ruleType: 'sapPlant',
        prepHint: 'Material must already exist in this Plant',
      },
      {
        key: 'currency',
        sapField: 'WAERS',
        label: 'Currency',
        required: true,
        allowedValues: CURRENCIES,
        prepHint: 'ISO Currency (TCURC)',
      },
      {
        key: 'invoiceReceipt',
        sapField: 'REPOS',
        label: 'Invoice Receipt',
        required: true,
        ruleType: 'truthy',
        prepHint: 'Must be checked or SAP forces Net Price = 0',
      },
    ],
    step2: [
      {
        key: 'condType',
        sapField: 'KSCHL',
        label: 'Condition Type',
        required: true,
        allowedValues: ['PB00', 'FRA1', 'RA01', 'ZSUR'],
        prepHint: 'Valid pricing condition (T685)',
      },
      {
        key: 'scaleQty',
        sapField: 'KSTBM',
        label: 'Scale Qty',
        required: true,
        ruleType: 'positiveNumber',
        prepHint: 'Strictly unique per validity window',
      },
      {
        key: 'rate',
        sapField: 'KBETR',
        label: 'Condition Rate',
        required: true,
        ruleType: 'positiveNumber',
        prepHint: 'Must be > 0',
      },
      {
        key: 'currency',
        sapField: 'WAERS',
        label: 'Currency',
        required: true,
        allowedValues: CURRENCIES,
        prepHint: 'ISO Currency (TCURC)',
      },
    ],
    step3: [
      {
        key: 'pirClass',
        sapField: 'PIR_CLASS',
        label: 'PIR Class (001)',
        required: true,
        allowedValues: PIR_CLASSES,
        prepHint: 'Configured PIR Class',
      },
      {
        key: 'mixingRatio',
        sapField: 'QUOTA_PCT',
        label: 'Mixing Ratio (Quota %)',
        required: true,
        ruleType: 'quotaPct',
        prepHint: '1–100%, must sum to 100% per Material @ Plant',
      },
    ],
  },
};

export function checkFieldRule(rule, value) {
  const str = String(value ?? '').trim();
  if (rule.ruleType === 'truthy') {
    return value ? null : `${rule.sapField} (${rule.label}) is mandatory.`;
  }
  if (rule.required && !str) {
    return `${rule.sapField} (${rule.label}) is mandatory.`;
  }
  if (!str) return null;

  if (rule.allowedValues && !rule.allowedValues.includes(str)) {
    return `${rule.sapField} "${str}" is not allowed (valid: ${rule.allowedValues.join(', ')}).`;
  }
  if (rule.ruleType === 'positiveNumber' && !(Number(value) > 0)) {
    return `${rule.sapField} must be > 0.`;
  }
  if (rule.ruleType === 'quotaPct') {
    const n = Number(value);
    if (!(n > 0 && n <= 100)) return `${rule.sapField} must be between 1 and 100.`;
  }
  return null;
}

export const SAMPLE_MATERIAL_PASTE = `MAT-16001
MAT-16002
MAT-16003
MAT-16004
MAT-16005
MAT-16006
MAT-16007
MAT-16008`;

export const SAMPLE_PIR_PASTE = `MAT-16001, VND-9001
MAT-16002, VND-9001
MAT-16003, VND-9002
MAT-16004, VND-9003
MAT-16005, VND-9002`;

export const CONDITION_TYPES = [
  { code: 'PB00', label: 'PB00 — Gross Price' },
  { code: 'FRA1', label: 'FRA1 — Freight %' },
  { code: 'RA01', label: 'RA01 — Discount %' },
  { code: 'ZSUR', label: 'ZSUR — Tariff Surcharge' },
];

// Excel-ready TSV sample tables for Smart Grid Intake (paste directly from Excel/Sheets)
export const SAMPLE_MATERIAL_GRID_TSV = [
  'Material\tRef Material\tTarget Plants\tDescription\tColor\tStorage',
  'MAT-16001\t\t1000, 2100\t\t\t',
  'MAT-16002\t\t2100, 4000\t\t\t',
  'MAT-16003\tMAT-16001\t2100\t\tUltramarine\t128GB',
  'MAT-16004\tMAT-16001\t1000, 2100\tiPhone 16 Pro 1TB Black Titanium\tBlack Titanium\t1TB',
  'MAT-16005\t\t2200, 3000\t\t\t',
  'MAT-16006\tMAT-16005\t1010, 3000\tA18 Pro Dev Test Wafer\tN/A\tN/A',
  'MAT-16007\t\t2100, 4000\t\tStar Fruit\tN/A',
  'MAT-16008\t\t1000, 2100\t\t\t',
].join('\n');

export const SAMPLE_PIR_GRID_TSV = [
  'Material\tVendor\tTarget Plant\tPurch Org\tCond Type\tScale Qty\tNet Price\tValid From\tValid To\tMixing Ratio',
  'MAT-16001\tVND-9001\t3000\tPO01\tPB00\t1\t412.50\t2026-01-01\t2026-12-31\t70',
  'MAT-16001\tVND-9001\t3000\tPO01\tPB00\t500\t398.00\t2026-01-01\t2026-12-31\t70',
  'MAT-16001\tVND-9001\t3000\tPO01\tFRA1\t1\t12.50\t2026-01-01\t2026-12-31\t70',
  'MAT-16002\tVND-9001\t3000\tPO01\tPB00\t1\t468.00\t2026-01-01\t2026-12-31\t100',
  'MAT-16003\tVND-9002\t3100\tPO01\tPB00\t1\t342.00\t2026-01-01\t2026-12-31\t100',
  'MAT-16004\tVND-9003\t3000\tPO01\tPB00\t1\t395.00\t2026-01-01\t2026-12-31\t100',
  'MAT-16005\tVND-9002\t3000\tPO02\tPB00\t1\t128.40\t2026-01-01\t2026-12-31\t100',
  'MAT-16005\tVND-9002\t3000\tPO02\tPB00\t1000\t118.00\t2026-01-01\t2026-12-31\t100',
].join('\n');

export const MATERIAL_INTAKE_FIELDS = [
  { key: 'material', label: 'PRODUCT* (Material #)' },
  { key: 'refMaterial', label: 'REF_MATERIAL (Copy Baseline)' },
  { key: 'targetPlants', label: 'TARGET_PLANT (Scope / Explode)' },
  { key: 'description', label: 'PRODUCT_DESC' },
  { key: 'matType', label: 'MTART (Type)' },
  { key: 'uom', label: 'MEINS (UoM)' },
  { key: 'stdPrice', label: 'STD_PRICE' },
  { key: 'className', label: 'CLASS (001)' },
  { key: 'charColor', label: 'CHAR: COLOR' },
  { key: 'charStorage', label: 'CHAR: STORAGE' },
  { key: 'charRegion', label: 'CHAR: REGION_LOCK' },
  { key: 'ignore', label: '— Ignore Column —' },
];

export const PIR_INTAKE_FIELDS = [
  { key: 'material', label: 'PRODUCT* (Material #)' },
  { key: 'vendor', label: 'SUPPLIER* (Vendor #)' },
  { key: 'targetPlants', label: 'WERKS (Target Plant)' },
  { key: 'purchOrg', label: 'EKORG (Purch Org)' },
  { key: 'condType', label: 'KSCHL (Condition Type)' },
  { key: 'scaleQty', label: 'KSTBM (Scale Qty)' },
  { key: 'netPrice', label: 'KBETR (Rate / Net Price)' },
  { key: 'currency', label: 'WAERS (Currency)' },
  { key: 'validFrom', label: 'DATAB (Valid From)' },
  { key: 'validTo', label: 'DATBI (Valid To)' },
  { key: 'pirClass', label: 'PIR_CLASS' },
  { key: 'mixingRatio', label: 'QUOTA % (Mixing Ratio)' },
  { key: 'ignore', label: '— Ignore Column —' },
];

export function detectPirIntakeGrain(mappings = []) {
  const mapped = new Set(mappings);
  if (mapped.has('scaleQty')) return 'scale';
  if (mapped.has('condType') || mapped.has('validFrom') || mapped.has('validTo')) {
    return 'condType';
  }
  return 'pir';
}

function guessColumnMapping(headerText, colIdx, grain) {
  const h = String(headerText ?? '').trim().toLowerCase();
  if (h.includes('ref')) return 'refMaterial';
  if (h.includes('vendor') || h.includes('supplier')) return 'vendor';
  if (h.includes('plant') || h.includes('werks')) return 'targetPlants';
  if (h.includes('desc')) return 'description';
  if (h.includes('cond') || h.includes('kschl')) return 'condType';
  if (h.includes('scale') || h.includes('kstbm') || h.includes('qty')) return 'scaleQty';
  if (h.includes('from') || h.includes('datab')) return 'validFrom';
  if (h.includes('valid to') || h.includes('datbi') || h === 'to') return 'validTo';
  if (h.includes('type') || h.includes('mtart')) return 'matType';
  if (h.includes('uom') || h.includes('meins')) return 'uom';
  if (h.includes('purch') || h.includes('ekorg')) return 'purchOrg';
  if (h.includes('price') || h.includes('netpr') || h.includes('kbetr') || h.includes('rate')) {
    return grain === 'pir' ? 'netPrice' : 'stdPrice';
  }
  if (h.includes('curr') || h.includes('waers')) return 'currency';
  if (h.includes('quota') || h.includes('ratio') || h.includes('mix')) {
    return 'mixingRatio';
  }
  if (h.includes('class')) return grain === 'pir' ? 'pirClass' : 'className';
  if (h.includes('color')) return 'charColor';
  if (h.includes('storage')) return 'charStorage';
  if (h.includes('region') || h.includes('lock')) return 'charRegion';
  if (h.includes('mat') || h.includes('prod')) return 'material';

  if (colIdx === 0) return 'material';
  if (colIdx === 1 && grain === 'pir') return 'vendor';
  return 'ignore';
}

export function parseTabularPaste(rawText, grain) {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  if (!lines.length) {
    return { headers: [], mappings: [], rows: [] };
  }

  const hasTabs = lines.some((l) => l.includes('\t'));
  const splitLine = (line) =>
    hasTabs
      ? line.split('\t').map((c) => c.trim())
      : line.split(',').map((c) => c.trim());

  const firstCells = splitLine(lines[0]);
  const looksLikeHeader = firstCells.some((c) =>
    /^(mat|prod|ref|plant|werks|desc|vendor|supp|price|color|storage|quota|ratio|purch|type|uom)/i.test(
      c
    )
  );

  const colCount = Math.max(
    ...lines.map((l) => splitLine(l).length),
    firstCells.length
  );

  const headers = looksLikeHeader
    ? Array.from({ length: colCount }, (_, i) => firstCells[i] || `Col ${i + 1}`)
    : Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);

  const dataLines = looksLikeHeader ? lines.slice(1) : lines;
  const rows = dataLines.map((line) => {
    const cells = splitLine(line);
    return Array.from({ length: colCount }, (_, i) => cells[i] ?? '');
  });

  const mappings = headers.map((h, i) => guessColumnMapping(h, i, grain));
  return { headers, mappings, rows };
}

export function buildRecordsFromIntake(grain, parsedRows, mappings) {
  const seen = new Set();
  const pirMap = new Map();
  const records = [];
  const detectedPirGrain = grain === 'pir' ? detectPirIntakeGrain(mappings) : null;

  for (const cells of parsedRows) {
    const intake = {};
    mappings.forEach((fieldKey, idx) => {
      if (!fieldKey || fieldKey === 'ignore') return;
      const val = (cells[idx] ?? '').trim();
      if (val) intake[fieldKey] = val;
    });

    const matCode = (intake.material || '').toUpperCase();
    if (!matCode) continue;

    const requestedPlants = intake.targetPlants
      ? Array.from(
          new Set(
            intake.targetPlants
              .split(/[,;/\s]+/)
              .map((p) => p.trim().toUpperCase())
              .filter(Boolean)
          )
        )
      : [];

    if (grain === 'pir') {
      const vendorCode = (intake.vendor || '').toUpperCase();
      if (!vendorCode) continue;
      const key = `${matCode}|${vendorCode}`;

      const condRow = {
        condUid: `${key}__${intake.condType || 'PB00'}__${intake.scaleQty || '1'}__${intake.validFrom || '2026-01-01'}__${Math.random().toString(36).slice(2, 6)}`,
        plant: requestedPlants[0] || '',
        condType: (intake.condType || 'PB00').toUpperCase(),
        scaleQty: Number(intake.scaleQty) || 1,
        rate: intake.netPrice !== undefined ? Number(intake.netPrice) : '',
        currency: (intake.currency || 'USD').toUpperCase(),
        validFrom: intake.validFrom || '2026-01-01',
        validTo: intake.validTo || '2026-12-31',
      };

      if (pirMap.has(key)) {
        const existing = pirMap.get(key);
        existing.pastedConditions.push(condRow);
        for (const p of requestedPlants) {
          if (!existing.requestedPlants.includes(p)) {
            existing.requestedPlants.push(p);
          }
        }
        continue;
      }

      const dbRec = SAP_PIR_DB[key];
      const base = dbRec
        ? { ...dbRec, conditions: [...(dbRec.conditions ?? [])] }
        : {
            key,
            material: matCode,
            vendor: vendorCode,
            vendorName: 'Unregistered Vendor Link',
            exists: false,
            purchOrg: '',
            plants: [],
            netPrice: 0,
            currency: 'USD',
            invoiceReceipt: true,
            pirClass: '',
            mixingRatio: 0,
            conditions: [],
          };

      const record = {
        ...base,
        requestedPlants,
        intakeData: intake,
        intakeGrain: detectedPirGrain,
        pastedConditions: [condRow],
        intakeFieldCount: Object.keys(intake).filter(
          (k) => k !== 'material' && k !== 'vendor'
        ).length,
      };
      pirMap.set(key, record);
      records.push(record);
    } else {
      if (seen.has(matCode)) continue;
      seen.add(matCode);

      const dbRec = SAP_MATERIAL_DB[matCode];
      const base = dbRec
        ? { ...dbRec, characteristics: { ...dbRec.characteristics } }
        : {
            material: matCode,
            exists: false,
            description: '',
            matType: '',
            uom: '',
            industrySector: 'M',
            matGroup: '',
            plants: [],
            classType: '',
            className: '',
            characteristics: { COLOR: '', STORAGE: '', REGION_LOCK: '' },
          };

      const refCode = (intake.refMaterial || '').toUpperCase();
      const refDbRec = refCode && SAP_MATERIAL_DB[refCode]?.exists ? SAP_MATERIAL_DB[refCode] : null;

      records.push({
        ...base,
        requestedPlants,
        refMaterial: refDbRec ? refCode : refCode || '',
        refBaseline: refDbRec,
        intakeData: intake,
        intakeFieldCount: Object.keys(intake).filter((k) => k !== 'material')
          .length,
      });
    }
  }

  return records;
}

// Simulated SAP Database (MARA / MARC / MBEW / CLFMAS)
export const SAP_MATERIAL_DB = {
  'MAT-16001': {
    material: 'MAT-16001',
    exists: true,
    description: 'iPhone 16 Pro 256GB Natural Titanium',
    matType: 'FERT',
    uom: 'EA',
    industrySector: 'M',
    matGroup: 'MG-IPHONE',
    plants: ['1000', '2100', '3000', '4000'],
    classType: '001',
    className: 'Z_APPLE_IPHONE',
    characteristics: {
      COLOR: 'Natural Titanium',
      STORAGE: '256GB',
      REGION_LOCK: 'Unlocked',
    },
  },
  'MAT-16002': {
    material: 'MAT-16002',
    exists: true,
    description: 'iPhone 16 Pro Max 512GB Desert Titanium',
    matType: 'FERT',
    uom: 'EA',
    industrySector: 'M',
    matGroup: 'MG-IPHONE',
    plants: ['1000', '3000'],
    classType: '001',
    className: 'Z_APPLE_IPHONE',
    characteristics: {
      COLOR: 'Desert Titanium',
      STORAGE: '512GB',
      REGION_LOCK: '',
    },
  },
  'MAT-16003': {
    material: 'MAT-16003',
    exists: true,
    description: 'iPhone 16 128GB Ultramarine',
    matType: 'FERT',
    uom: 'EA',
    industrySector: 'M',
    matGroup: 'MG-IPHONE',
    plants: ['1000'],
    classType: '',
    className: '',
    characteristics: { COLOR: '', STORAGE: '', REGION_LOCK: '' },
  },
  'MAT-16004': {
    material: 'MAT-16004',
    exists: false,
    description: '',
    matType: '',
    uom: '',
    industrySector: 'M',
    matGroup: '',
    plants: [],
    classType: '',
    className: '',
    characteristics: { COLOR: '', STORAGE: '', REGION_LOCK: '' },
  },
  'MAT-16005': {
    material: 'MAT-16005',
    exists: true,
    description: 'A18 Pro SoC Wafer Sub-Assembly',
    matType: 'HALB',
    uom: 'PC',
    industrySector: 'M',
    matGroup: 'MG-SILICON',
    plants: ['1010', '2200', '3000'],
    classType: '001',
    className: 'Z_APPLE_SILICON',
    characteristics: { COLOR: 'N/A', STORAGE: 'N/A', REGION_LOCK: 'Global' },
  },
  'MAT-16006': {
    material: 'MAT-16006',
    exists: false,
    description: '',
    matType: '',
    uom: '',
    industrySector: 'M',
    matGroup: '',
    plants: [],
    classType: '',
    className: '',
    characteristics: { COLOR: '', STORAGE: '', REGION_LOCK: '' },
  },
  'MAT-16007': {
    material: 'MAT-16007',
    exists: true,
    description: 'MagSafe Silicone Case — Star Fruit',
    matType: 'HAWA',
    uom: 'EA',
    industrySector: 'M',
    matGroup: 'MG-ACC',
    plants: ['1000', '2100'],
    classType: '001',
    className: 'Z_APPLE_ACCESSORY',
    characteristics: { COLOR: 'Star Fruit', STORAGE: '', REGION_LOCK: '' },
  },
  'MAT-16008': {
    material: 'MAT-16008',
    exists: true,
    description: 'USB-C Woven Charge Cable 2m',
    matType: 'HAWA',
    uom: 'EA',
    industrySector: 'M',
    matGroup: 'MG-ACC',
    plants: ['1000', '2100', '3000', '4000', '4100'],
    classType: '001',
    className: 'Z_APPLE_ACCESSORY',
    characteristics: { COLOR: 'White', STORAGE: 'N/A', REGION_LOCK: 'Global' },
  },
};

// Simulated SAP PIR Database (EINA / EINE / KONP / KONM / PUR_QTA)
export const SAP_PIR_DB = {
  'MAT-16001|VND-9001': {
    key: 'MAT-16001|VND-9001',
    material: 'MAT-16001',
    vendor: 'VND-9001',
    vendorName: 'Foxconn Precision',
    exists: true,
    purchOrg: 'PO01',
    plants: ['3000', '3100'],
    netPrice: 412.5,
    currency: 'USD',
    invoiceReceipt: true,
    pirClass: 'Z_PIR_TIER1',
    mixingRatio: 70,
    conditions: [
      { condType: 'PB00', scaleQty: 1, rate: 412.5, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' },
      { condType: 'PB00', scaleQty: 500, rate: 405.0, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' },
    ],
  },
  'MAT-16002|VND-9001': {
    key: 'MAT-16002|VND-9001',
    material: 'MAT-16002',
    vendor: 'VND-9001',
    vendorName: 'Foxconn Precision',
    exists: true,
    purchOrg: 'PO01',
    plants: ['3000'],
    netPrice: 468.0,
    currency: 'USD',
    invoiceReceipt: true,
    pirClass: '',
    mixingRatio: 0,
    conditions: [
      { condType: 'PB00', scaleQty: 1, rate: 468.0, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' },
    ],
  },
  'MAT-16003|VND-9002': {
    key: 'MAT-16003|VND-9002',
    material: 'MAT-16003',
    vendor: 'VND-9002',
    vendorName: 'Pegatron Corp',
    exists: true,
    purchOrg: 'PO01',
    plants: ['3100', '3200'],
    netPrice: 342.0,
    currency: 'USD',
    invoiceReceipt: true,
    pirClass: 'Z_PIR_TIER1',
    mixingRatio: 100,
    conditions: [
      { condType: 'PB00', scaleQty: 1, rate: 342.0, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' },
    ],
  },
  'MAT-16004|VND-9003': {
    key: 'MAT-16004|VND-9003',
    material: 'MAT-16004',
    vendor: 'VND-9003',
    vendorName: 'Luxshare ICT',
    exists: false,
    purchOrg: '',
    plants: [],
    netPrice: 0,
    currency: 'USD',
    invoiceReceipt: true,
    pirClass: '',
    mixingRatio: 0,
    conditions: [],
  },
  'MAT-16005|VND-9002': {
    key: 'MAT-16005|VND-9002',
    material: 'MAT-16005',
    vendor: 'VND-9002',
    vendorName: 'Pegatron Corp',
    exists: true,
    purchOrg: 'PO02',
    plants: ['3000'],
    netPrice: 128.4,
    currency: 'USD',
    invoiceReceipt: true,
    pirClass: 'Z_PIR_SILICON',
    mixingRatio: 100,
    conditions: [
      { condType: 'PB00', scaleQty: 1, rate: 128.4, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-12-31' },
    ],
  },
};

export function lookupMaterialRecords(rawInput) {
  const tokens = Array.from(
    new Set(
      rawInput
        .split(/[\n,;]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    )
  );

  return tokens.map((code) => {
    const found = SAP_MATERIAL_DB[code];
    if (found) return { ...found, characteristics: { ...found.characteristics } };
    return {
      material: code,
      exists: false,
      description: '',
      matType: '',
      uom: '',
      industrySector: 'M',
      matGroup: '',
      plants: [],
      classType: '',
      className: '',
      characteristics: { COLOR: '', STORAGE: '', REGION_LOCK: '' },
    };
  });
}

export function lookupPirRecords(rawInput) {
  const lines = rawInput
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const seen = new Set();
  const out = [];

  for (const line of lines) {
    const parts = line.split(/[,;\t\s]+/).map((p) => p.trim().toUpperCase());
    if (parts.length < 2) continue;
    const [material, vendor] = parts;
    const key = `${material}|${vendor}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const found = SAP_PIR_DB[key];
    if (found) {
      out.push({ ...found });
    } else {
      out.push({
        key,
        material,
        vendor,
        vendorName: 'Unregistered Vendor Link',
        exists: false,
        purchOrg: '',
        plants: [],
        netPrice: 0,
        currency: 'USD',
        invoiceReceipt: true,
        pirClass: '',
        mixingRatio: 0,
      });
    }
  }

  return out;
}

export function getCharCompletion(characteristics) {
  const entries = Object.values(characteristics ?? {});
  const total = entries.length || 3;
  const filled = entries.filter((v) => String(v ?? '').trim().length > 0).length;
  return { filled, total };
}

export function getPlantScopeStatus(existingPlants, targetPlants) {
  if (!targetPlants || targetPlants.length === 0) {
    return {
      state: existingPlants.length > 0 ? 'neutral' : 'missing',
      label: `${existingPlants.length} / 50`,
      missing: [],
    };
  }
  const existingSet = new Set(existingPlants);
  const matched = targetPlants.filter((p) => existingSet.has(p));
  const missing = targetPlants.filter((p) => !existingSet.has(p));

  if (matched.length === targetPlants.length) {
    return {
      state: 'complete',
      label: `${matched.length}/${targetPlants.length} ✓`,
      missing: [],
    };
  }
  if (matched.length > 0) {
    return {
      state: 'partial',
      label: `${matched.length}/${targetPlants.length} · -${missing[0]}`,
      missing,
    };
  }
  return {
    state: 'missing',
    label: `0/${targetPlants.length} Missing`,
    missing,
  };
}

/**
 * Checks upstream SAP Material Master (MARA / MARC) prerequisites for a PIR row.
 * A PIR cannot be created in SAP DMC if the Material does not exist or is not extended to the target Plant.
 */
export function getPirMaterialPrerequisite(materialCode, targetPlants = []) {
  const matRec = SAP_MATERIAL_DB[materialCode];
  if (!matRec || !matRec.exists) {
    return {
      status: 'MAT_MISSING',
      missingPlants: targetPlants,
      label: 'Create Material First',
      detail: `${materialCode} does not exist in SAP MARA yet.`,
    };
  }

  const effectiveTargets = targetPlants.filter(Boolean);
  if (effectiveTargets.length > 0) {
    const existingSet = new Set(matRec.plants ?? []);
    const missingPlants = effectiveTargets.filter((p) => !existingSet.has(p));
    if (missingPlants.length > 0) {
      return {
        status: 'PLANT_MISSING',
        missingPlants,
        label: `Extend Mat. → ${missingPlants.join(', ')}`,
        detail: `${materialCode} exists in SAP (${matRec.plants.join(', ')}), but is not extended to Plant ${missingPlants.join(', ')}.`,
      };
    }
  }

  return {
    status: 'READY',
    missingPlants: [],
    label: 'Mat. Ready ✓',
    detail: `${materialCode} exists in SAP MARA & target Plant MARC.`,
  };
}

/**
 * Extracts distinct non-empty values already present in the SAP DB for column-level drag-down pickers.
 */
export function getDbFieldOptions(fieldKey) {
  const dbMaterials = Object.values(SAP_MATERIAL_DB).filter((m) => m.exists);
  const dbPirs = Object.values(SAP_PIR_DB).filter((p) => p.exists);
  const uniq = (arr) => Array.from(new Set(arr.filter((v) => String(v ?? '').trim().length > 0)));

  switch (fieldKey) {
    case 'matType':
      return uniq([...dbMaterials.map((m) => m.matType), ...MATERIAL_TYPES]);
    case 'uom':
      return uniq([...dbMaterials.map((m) => m.uom), ...BASE_UOMS]);
    case 'mrpType':
      return MRP_TYPES;
    case 'lotSize':
      return LOT_SIZES;
    case 'procType':
      return PROC_TYPES.map((p) => p.code);
    case 'valuationClass':
      return VALUATION_CLASSES;
    case 'priceCtrl':
      return PRICE_CTRLS.map((p) => p.code);
    case 'className':
      return uniq([...dbMaterials.map((m) => m.className), ...MATERIAL_CLASSES]);
    case 'charColor':
      return uniq(dbMaterials.map((m) => m.characteristics?.COLOR));
    case 'charStorage':
      return uniq(dbMaterials.map((m) => m.characteristics?.STORAGE));
    case 'charRegion':
      return uniq(dbMaterials.map((m) => m.characteristics?.REGION_LOCK));
    case 'purchOrg':
      return uniq([...dbPirs.map((p) => p.purchOrg), ...PURCH_ORGS]);
    case 'currency':
      return uniq([...dbPirs.map((p) => p.currency), ...CURRENCIES]);
    case 'pirClass':
      return uniq([...dbPirs.map((p) => p.pirClass), ...PIR_CLASSES]);
    default:
      return [];
  }
}

/**
 * Strict SAP S/4HANA DMC Validator — prevents wrong data from being mass-extended or exported.
 */
export function validateDmcOrder(order) {
  const errors = [];
  const stepErrors = { step1: [], step2: [], step3: [] };
  const cellErrors = {};
  if (!order || !order.rows.length) {
    return {
      step1Done: false,
      step2Done: false,
      step3Done: false,
      stepErrors,
      cellErrors,
      pct: 0,
      errors: ['Order has no rows.'],
      rowErrors: {},
      readyToExport: false,
    };
  }

  const rowErrors = {};
  const addErr = (uid, stepKey, msg, fieldKey = null) => {
    errors.push(msg);
    if (stepErrors[stepKey]) stepErrors[stepKey].push(msg);
    if (!rowErrors[uid]) rowErrors[uid] = [];
    rowErrors[uid].push(msg);
    if (fieldKey) {
      cellErrors[`${uid}::${fieldKey}`] = msg;
    }
  };

  let step1Ok = true;
  let step2Ok = true;
  let step3Ok = true;

  if (order.grain === 'pir') {
    const rules = SAP_DMC_FIELD_RULES.pir;
    const quotaByMatPlant = {};

    for (const r of order.rows) {
      const prereq = getPirMaterialPrerequisite(r.material, r.plant ? [r.plant] : []);
      if (prereq.status !== 'READY') {
        step1Ok = false;
        addErr(
          r.rowUid,
          'step1',
          `${r.material}/${r.vendor}: Upstream Prerequisite — ${prereq.detail}`,
          'plant'
        );
      }

      for (const rule of rules.step1) {
        const msg = checkFieldRule(rule, r[rule.key]);
        if (msg) {
          step1Ok = false;
          addErr(r.rowUid, 'step1', `${r.material}/${r.vendor}: ${msg}`, rule.key);
        }
      }

      for (const rule of rules.step3) {
        const msg = checkFieldRule(rule, r[rule.key]);
        if (msg) {
          step3Ok = false;
          addErr(r.rowUid, 'step3', `${r.material}/${r.vendor}: ${msg}`, rule.key);
        }
      }

      const ratio = Number(r.mixingRatio);
      if (ratio > 0 && ratio <= 100) {
        const groupKey = `${r.material} @ ${r.plant || 'UNSET'}`;
        quotaByMatPlant[groupKey] = (quotaByMatPlant[groupKey] || 0) + ratio;
      }
    }

    // Step 2: Condition Types & Scale Prices
    const condList = order.conditions ?? [];
    if (condList.length === 0) {
      step2Ok = false;
      const msg = 'No Condition / Price rows staged. Add at least one PB00 condition.';
      errors.push(msg);
      stepErrors.step2.push(msg);
    } else {
      const scalesByCondGroup = {};
      for (const c of condList) {
        for (const rule of rules.step2) {
          const msg = checkFieldRule(rule, c[rule.key]);
          if (msg) {
            step2Ok = false;
            addErr(c.condUid, 'step2', `${c.material}/${c.vendor}: ${msg}`, rule.key);
          }
        }
        if (c.validFrom && c.validTo && c.validFrom > c.validTo) {
          step2Ok = false;
          addErr(
            c.condUid,
            'step2',
            `${c.material}/${c.vendor} (${c.condType}): Valid From must be ≤ Valid To.`,
            'validTo'
          );
        }
        const gKey = `${c.material}|${c.vendor}|${c.condType}|${c.validFrom}|${c.validTo}`;
        if (!scalesByCondGroup[gKey]) scalesByCondGroup[gKey] = [];
        scalesByCondGroup[gKey].push(Number(c.scaleQty) || 0);
      }

      for (const [gKey, qtys] of Object.entries(scalesByCondGroup)) {
        if (new Set(qtys).size !== qtys.length) {
          step2Ok = false;
          const [mat, vnd, kschl] = gKey.split('|');
          const msg = `${mat}/${vnd} (${kschl}): Duplicate Scale Qty in same validity window.`;
          errors.push(msg);
          stepErrors.step2.push(msg);
        }
      }
    }

    for (const [groupKey, sum] of Object.entries(quotaByMatPlant)) {
      if (sum !== 100) {
        step3Ok = false;
        const msg = `Quota Mixing Ratio for ${groupKey} totals ${sum}% (must equal 100%).`;
        errors.push(msg);
        stepErrors.step3.push(msg);
      }
    }
  } else {
    const rules = SAP_DMC_FIELD_RULES.material;
    const includeValuation = Boolean(order.includeValuation);
    const seenMatPlant = new Set();
    const checkedBaseMaterials = new Set();
    const checkedClassMaterials = new Set();

    for (const r of order.rows) {
      // Step 1: Base Data (MARA) — checked once per unique material
      if (!checkedBaseMaterials.has(r.material)) {
        checkedBaseMaterials.add(r.material);
        for (const rule of rules.step1) {
          const msg = checkFieldRule(rule, r[rule.key]);
          if (msg) {
            step1Ok = false;
            addErr(r.rowUid, 'step1', `${r.material}: ${msg}`, rule.key);
          }
        }
      }

      // Step 2: Plant & MRP (MARC)
      for (const rule of rules.step2) {
        const msg = checkFieldRule(rule, r[rule.key]);
        if (msg) {
          step2Ok = false;
          addErr(
            r.rowUid,
            'step2',
            `${r.material} (${r.plant || 'No Plant'}): ${msg}`,
            rule.key
          );
        }
      }

      // Optional Valuation Layer (MBEW)
      if (includeValuation) {
        for (const rule of rules.step2Valuation) {
          const msg = checkFieldRule(rule, r[rule.key]);
          if (msg) {
            step2Ok = false;
            addErr(
              r.rowUid,
              'step2',
              `${r.material} (${r.plant || 'No Plant'}): ${msg}`,
              rule.key
            );
          }
        }

        if (r.matType && r.valuationClass) {
          const expected = EXPECTED_BKLAS_BY_MTART[r.matType];
          if (expected && r.valuationClass !== expected) {
            step2Ok = false;
            addErr(
              r.rowUid,
              'step2',
              `${r.material}: BKLAS ${r.valuationClass} invalid for ${r.matType} (SAP requires ${expected}).`,
              'valuationClass'
            );
          }
        }
      }

      // Duplicate Plant Key Guard
      if (r.plant) {
        const mpKey = `${r.material}|${r.plant}`;
        if (seenMatPlant.has(mpKey)) {
          step2Ok = false;
          addErr(
            r.rowUid,
            'step2',
            `${r.material} @ ${r.plant}: Duplicate Material + Plant row in batch.`,
            'plant'
          );
        }
        seenMatPlant.add(mpKey);
      }

      // Step 3: Classification & Characteristics (CLFMAS)
      if (!checkedClassMaterials.has(r.material)) {
        checkedClassMaterials.add(r.material);
        for (const rule of rules.step3) {
          const msg = checkFieldRule(rule, r[rule.key]);
          if (msg) {
            step3Ok = false;
            addErr(r.rowUid, 'step3', `${r.material}: ${msg}`, rule.key);
          }
        }
      }
    }
  }

  const doneCount = [step1Ok, step2Ok, step3Ok].filter(Boolean).length;
  return {
    step1Done: step1Ok,
    step2Done: step2Ok,
    step3Done: step3Ok,
    stepErrors,
    cellErrors,
    pct: Math.round((doneCount / 3) * 100),
    errors,
    rowErrors,
    readyToExport: step1Ok && step2Ok && step3Ok && errors.length === 0,
  };
}

/**
 * Generates an authentic multi-worksheet SAP DMC SpreadsheetML XML workbook.
 */
export function buildDmcXml(order) {
  const esc = (val) =>
    String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const xmlRow = (cells) =>
    `      <Row>\n${cells
      .map(
        (c) =>
          `        <Cell><Data ss:Type="${
            typeof c === 'number' ? 'Number' : 'String'
          }">${esc(c)}</Data></Cell>`
      )
      .join('\n')}\n      </Row>`;

  if (order.grain === 'pir') {
    const condList = order.conditions ?? [];
    const hasScales = condList.some((c) => Number(c.scaleQty) > 1);

    const pirSheet = [
      xmlRow(['PRODUCT', 'SUPPLIER', 'EKORG', 'WERKS', 'REPOS']),
      ...order.rows.map((r) =>
        xmlRow([
          r.material,
          r.vendor,
          r.purchOrg,
          r.plant,
          r.invoiceReceipt ? 'X' : '',
        ])
      ),
    ].join('\n');

    const condSheet = [
      xmlRow([
        'PRODUCT',
        'SUPPLIER',
        'WERKS',
        'KSCHL',
        'DATAB',
        'DATBI',
        'KBETR',
        'WAERS',
      ]),
      ...condList
        .filter((c) => Number(c.scaleQty) <= 1)
        .map((c) =>
          xmlRow([
            c.material,
            c.vendor,
            c.plant,
            c.condType,
            c.validFrom,
            c.validTo,
            Number(c.rate),
            c.currency,
          ])
        ),
    ].join('\n');

    const scaleBlock = hasScales
      ? `  <Worksheet ss:Name="Condition_Scales_KONM">
    <Table>
${[
  xmlRow([
    'PRODUCT',
    'SUPPLIER',
    'WERKS',
    'KSCHL',
    'KSTBM_SCALE_QTY',
    'KBETR_RATE',
    'WAERS',
    'DATAB',
    'DATBI',
  ]),
  ...condList.map((c) =>
    xmlRow([
      c.material,
      c.vendor,
      c.plant,
      c.condType,
      Number(c.scaleQty) || 1,
      Number(c.rate),
      c.currency,
      c.validFrom,
      c.validTo,
    ])
  ),
].join('\n')}
    </Table>
  </Worksheet>\n`
      : '';

    const clfSheet = [
      xmlRow(['OBJECT', 'CLASS_TYPE', 'CLASS', 'STATUS']),
      ...order.rows.map((r) =>
        xmlRow([`${r.material}_${r.vendor}`, '001', r.pirClass, '1'])
      ),
    ].join('\n');

    const quotaSheet = [
      xmlRow(['PRODUCT', 'WERKS', 'SUPPLIER', 'QUOTA_PCT', 'VALID_TO']),
      ...order.rows.map((r) =>
        xmlRow([
          r.material,
          r.plant,
          r.vendor,
          Number(r.mixingRatio),
          r.validTo || '2026-12-31',
        ])
      ),
    ].join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="PIR_Header_EINA_EINE">
    <Table>
${pirSheet}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Conditions_KONP">
    <Table>
${condSheet}
    </Table>
  </Worksheet>
${scaleBlock}  <Worksheet ss:Name="PIR_Classification">
    <Table>
${clfSheet}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Quota_Mixing_Ratio">
    <Table>
${quotaSheet}
    </Table>
  </Worksheet>
</Workbook>`;
  }

  // Material Grain: Multi-worksheet SAP S/4HANA Product + Plant/MRP + Optional Valuation + Classification
  const uniqueMaterialRows = [];
  const seenMats = new Set();
  for (const r of order.rows) {
    if (!seenMats.has(r.material)) {
      seenMats.add(r.material);
      uniqueMaterialRows.push(r);
    }
  }

  const basicSheet = [
    xmlRow(['PRODUCT', 'PRODUCT_DESC', 'MTART', 'MEINS', 'MBRSH']),
    ...uniqueMaterialRows.map((r) =>
      xmlRow([r.material, r.description, r.matType, r.uom, 'M'])
    ),
  ].join('\n');

  const plantMrpSheet = [
    xmlRow([
      'PRODUCT',
      'WERKS',
      'PROFIT_CTR',
      'DISMM',
      'DISLS',
      'BESKZ',
    ]),
    ...order.rows.map((r) =>
      xmlRow([
        r.material,
        r.plant,
        r.profitCenter,
        r.mrpType,
        r.lotSize,
        r.procType,
      ])
    ),
  ].join('\n');

  const valuationBlock = order.includeValuation
    ? `  <Worksheet ss:Name="Valuation_MBEW">
    <Table>
${[
  xmlRow(['PRODUCT', 'VAL_AREA', 'BKLAS', 'PRICE_CTRL', 'STD_PRICE']),
  ...order.rows.map((r) =>
    xmlRow([
      r.material,
      r.plant,
      r.valuationClass,
      r.priceCtrl,
      Number(r.stdPrice),
    ])
  ),
].join('\n')}
    </Table>
  </Worksheet>\n`
    : '';

  const classSheet = [
    xmlRow([
      'OBJECT',
      'CLASS_TYPE',
      'CLASS',
      'CHAR_COLOR',
      'CHAR_STORAGE',
      'CHAR_REGION_LOCK',
    ]),
    ...uniqueMaterialRows.map((r) =>
      xmlRow([
        r.material,
        '001',
        r.className,
        r.charColor,
        r.charStorage,
        r.charRegion,
      ])
    ),
  ].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Basic_Data_MARA">
    <Table>
${basicSheet}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Plant_MRP_MARC">
    <Table>
${plantMrpSheet}
    </Table>
  </Worksheet>
${valuationBlock}  <Worksheet ss:Name="Classification_CLFMAS">
    <Table>
${classSheet}
    </Table>
  </Worksheet>
</Workbook>`;
}
