// Schema-driven columnar dataset contract designed to map 1:1 to a GCP BigQuery table response:
// { id, gcpTable, columns: [{ key, label, type: 'string' | 'number' | 'date', format? }], rows: [...] }

export const IPHONE_BASE_COLUMNS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'quarter', label: 'Quarter', type: 'string' },
  { key: 'model', label: 'Model', type: 'string' },
  { key: 'region', label: 'Region', type: 'string' },
  { key: 'channel', label: 'Channel', type: 'string' },
  { key: 'storage', label: 'Storage', type: 'string' },
  { key: 'searches', label: 'Searches', type: 'number', format: 'integer' },
  { key: 'clicks', label: 'Clicks', type: 'number', format: 'integer' },
  { key: 'conversions', label: 'Orders', type: 'number', format: 'integer' },
  { key: 'revenue', label: 'Revenue ($)', type: 'number', format: 'currency' },
];

export const IPHONE_BASE_ROWS = [
  { date: '2026-01-12', quarter: 'Q1', model: 'iPhone 16 Pro Max', region: 'Americas', channel: 'Web', storage: '256GB', searches: 48200, clicks: 19400, conversions: 2840, revenue: 3405160 },
  { date: '2026-01-19', quarter: 'Q1', model: 'iPhone 16 Pro Max', region: 'Europe', channel: 'Store App', storage: '512GB', searches: 31900, clicks: 13200, conversions: 1910, revenue: 2672090 },
  { date: '2026-01-26', quarter: 'Q1', model: 'iPhone 16 Pro Max', region: 'APAC', channel: 'Web', storage: '256GB', searches: 41600, clicks: 17100, conversions: 2490, revenue: 2985510 },
  { date: '2026-02-04', quarter: 'Q1', model: 'iPhone 16 Pro', region: 'Americas', channel: 'Store App', storage: '256GB', searches: 52400, clicks: 21800, conversions: 3320, revenue: 3648680 },
  { date: '2026-02-11', quarter: 'Q1', model: 'iPhone 16 Pro', region: 'Europe', channel: 'Web', storage: '128GB', searches: 29800, clicks: 11900, conversions: 1640, revenue: 1638360 },
  { date: '2026-02-18', quarter: 'Q1', model: 'iPhone 16 Pro', region: 'APAC', channel: 'Store App', storage: '512GB', searches: 36500, clicks: 15100, conversions: 2190, revenue: 2844810 },
  { date: '2026-03-03', quarter: 'Q1', model: 'iPhone 16', region: 'Americas', channel: 'Web', storage: '128GB', searches: 61200, clicks: 24100, conversions: 3890, revenue: 3108110 },
  { date: '2026-03-10', quarter: 'Q1', model: 'iPhone 16', region: 'Europe', channel: 'Store App', storage: '256GB', searches: 34700, clicks: 13900, conversions: 2120, revenue: 1905880 },
  { date: '2026-03-18', quarter: 'Q1', model: 'iPhone 16 Plus', region: 'APAC', channel: 'Web', storage: '256GB', searches: 22900, clicks: 8900, conversions: 1210, revenue: 1208790 },
  { date: '2026-03-25', quarter: 'Q1', model: 'iPhone SE', region: 'Americas', channel: 'Web', storage: '128GB', searches: 27400, clicks: 9800, conversions: 1580, revenue: 756820 },

  { date: '2026-04-06', quarter: 'Q2', model: 'iPhone 16 Pro Max', region: 'Americas', channel: 'Store App', storage: '512GB', searches: 51300, clicks: 21200, conversions: 3120, revenue: 4364880 },
  { date: '2026-04-14', quarter: 'Q2', model: 'iPhone 16 Pro Max', region: 'Europe', channel: 'Web', storage: '256GB', searches: 34200, clicks: 14100, conversions: 2040, revenue: 2445960 },
  { date: '2026-04-22', quarter: 'Q2', model: 'iPhone 16 Pro Max', region: 'APAC', channel: 'Store App', storage: '1TB', searches: 26800, clicks: 11400, conversions: 1590, revenue: 2542410 },
  { date: '2026-05-05', quarter: 'Q2', model: 'iPhone 16 Pro', region: 'Americas', channel: 'Web', storage: '256GB', searches: 54900, clicks: 22900, conversions: 3490, revenue: 3835510 },
  { date: '2026-05-12', quarter: 'Q2', model: 'iPhone 16 Pro', region: 'Europe', channel: 'Store App', storage: '256GB', searches: 33100, clicks: 13600, conversions: 1950, revenue: 2143050 },
  { date: '2026-05-20', quarter: 'Q2', model: 'iPhone 16 Pro', region: 'APAC', channel: 'Web', storage: '128GB', searches: 39200, clicks: 16200, conversions: 2380, revenue: 2377620 },
  { date: '2026-06-02', quarter: 'Q2', model: 'iPhone 16', region: 'Americas', channel: 'Store App', storage: '256GB', searches: 64800, clicks: 26400, conversions: 4210, revenue: 3784790 },
  { date: '2026-06-09', quarter: 'Q2', model: 'iPhone 16', region: 'APAC', channel: 'Web', storage: '128GB', searches: 43500, clicks: 17300, conversions: 2670, revenue: 2133330 },
  { date: '2026-06-17', quarter: 'Q2', model: 'iPhone 16 Plus', region: 'Americas', channel: 'Web', storage: '128GB', searches: 25100, clicks: 9700, conversions: 1390, revenue: 1249610 },
  { date: '2026-06-24', quarter: 'Q2', model: 'iPhone SE', region: 'Europe', channel: 'Web', storage: '128GB', searches: 19600, clicks: 7100, conversions: 1090, revenue: 522110 },

  { date: '2026-07-08', quarter: 'Q3', model: 'iPhone 16 Pro Max', region: 'Americas', channel: 'Web', storage: '1TB', searches: 44100, clicks: 18500, conversions: 2650, revenue: 4237350 },
  { date: '2026-07-21', quarter: 'Q3', model: 'iPhone 16 Pro', region: 'Americas', channel: 'Store App', storage: '512GB', searches: 49700, clicks: 20900, conversions: 3180, revenue: 4130820 },
  { date: '2026-08-05', quarter: 'Q3', model: 'iPhone 16', region: 'Europe', channel: 'Web', storage: '128GB', searches: 38900, clicks: 15200, conversions: 2340, revenue: 1869660 },
  { date: '2026-08-19', quarter: 'Q3', model: 'iPhone 16 Plus', region: 'Europe', channel: 'Store App', storage: '256GB', searches: 21400, clicks: 8400, conversions: 1180, revenue: 1178820 },
  { date: '2026-09-09', quarter: 'Q3', model: 'iPhone SE', region: 'APAC', channel: 'Store App', storage: '256GB', searches: 24200, clicks: 8900, conversions: 1410, revenue: 745890 },
];

export function getDatasetForProduct(productId, productName, categoryTitle) {
  const slug = (productId || 'iphone_16_series').replace(/-/g, '_');
  const datasetNamespace = (categoryTitle || 'all').toLowerCase();

  return {
    id: productId || 'default',
    name: productName || 'iPhone Search Index',
    gcpTable: `apple-isearch.${datasetNamespace}_data.${slug}`,
    columns: IPHONE_BASE_COLUMNS,
    rows: IPHONE_BASE_ROWS,
    defaultPivot: {
      rowField: 'model',
      colField: 'region',
      valueField: 'searches',
      agg: 'SUM',
    },
  };
}
