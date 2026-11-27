export const SIDEBAR_MODES = [
  {
    id: 'dashboards',
    label: 'Dashboards',
    description: 'Built-in KPI boards & live monitors',
  },
  {
    id: 'data',
    label: 'Data',
    description: 'BigQuery tables, filters, pivots & charts',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Funnels, query trends & benchmarks',
  },
  {
    id: 'prep',
    label: 'Workbench',
    description: 'Data prep templates & SAP DMC tools',
  },
];

export const PRODUCT_CATALOG = {
  home: {
    title: 'All',
    modes: {
      dashboards: [
        {
          id: 'all-dash-exec',
          name: 'Executive Overview',
          items: [
            { id: 'all-dash-exec-pulse', name: 'iSearch Global Pulse' },
            { id: 'all-dash-exec-score', name: 'Quarterly Scorecard' },
          ],
        },
      ],
      data: [
        {
          id: 'all-data-iphone',
          name: 'iPhone Search Index',
          items: [
            { id: 'all-data-iphone-16', name: 'iPhone 16 Series' },
            { id: 'all-data-iphone-15', name: 'iPhone 15 Series' },
            { id: 'all-data-iphone-se', name: 'iPhone SE' },
          ],
        },
        {
          id: 'all-data-imac',
          name: 'iMac Catalog Feed',
          items: [
            { id: 'all-data-imac-m4', name: 'iMac 24" M4' },
            { id: 'all-data-imac-pro', name: 'Mac Studio & Pro' },
          ],
        },
        {
          id: 'all-data-ipod',
          name: 'iPod Legacy Archive',
          items: [
            { id: 'all-data-ipod-touch', name: 'iPod touch' },
            { id: 'all-data-ipod-classic', name: 'iPod classic' },
          ],
        },
        {
          id: 'all-data-global',
          name: 'Global Query Store',
          items: [
            { id: 'all-data-global-raw', name: 'Raw Query Stream' },
            { id: 'all-data-global-norm', name: 'Normalized Index' },
          ],
        },
      ],
      analytics: [
        {
          id: 'all-ana-overview',
          name: 'Search Overview',
          items: [
            { id: 'all-ana-overview-kpi', name: 'Executive KPIs' },
            { id: 'all-ana-overview-vol', name: 'Daily Volume' },
          ],
        },
        {
          id: 'all-ana-trends',
          name: 'Query Trends',
          items: [
            { id: 'all-ana-trends-top', name: 'Top Rising Terms' },
            { id: 'all-ana-trends-reg', name: 'Regional Breakdown' },
          ],
        },
        {
          id: 'all-ana-ctr',
          name: 'Click-Through Rate',
          items: [
            { id: 'all-ana-ctr-rank', name: 'Position CTR' },
            { id: 'all-ana-ctr-conv', name: 'Search-to-Bag' },
          ],
        },
        {
          id: 'all-ana-zero',
          name: 'Zero-Result Audit',
          items: [
            { id: 'all-ana-zero-miss', name: 'Unmatched Terms' },
            { id: 'all-ana-zero-typo', name: 'Spelling Fallbacks' },
          ],
        },
      ],
      prep: [
        {
          id: 'all-prep-schema',
          name: 'Schema Mapper',
          items: [
            { id: 'all-prep-schema-sku', name: 'SKU Attributes' },
            { id: 'all-prep-schema-loc', name: 'Locale Fields' },
          ],
        },
        {
          id: 'all-prep-token',
          name: 'Token Normalizer',
          items: [
            { id: 'all-prep-token-syn', name: 'Synonym Rules' },
            { id: 'all-prep-token-stop', name: 'Stopword Lists' },
          ],
        },
        {
          id: 'all-prep-dedup',
          name: 'Dedup Pipeline',
          items: [
            { id: 'all-prep-dedup-exact', name: 'Exact Match Rules' },
            { id: 'all-prep-dedup-fuzzy', name: 'Fuzzy Merge' },
          ],
        },
      ],
    },
  },
  iphone: {
    title: 'Dir',
    modes: {
      dashboards: [
        {
          id: 'dir-dash-exec',
          name: 'Executive Pulse',
          items: [
            { id: 'dir-dash-exec-search', name: 'Direct Search Exec' },
            { id: 'dir-dash-exec-launch', name: 'Launch Week Monitor' },
          ],
        },
        {
          id: 'dir-dash-store',
          name: 'Storefront Health',
          items: [
            { id: 'dir-dash-store-web', name: 'Apple.com Live' },
            { id: 'dir-dash-store-app', name: 'Store App Pulse' },
          ],
        },
      ],
      data: [
        {
          id: 'dir-data-iphone',
          name: 'iPhone Direct Logs',
          items: [
            { id: 'dir-data-iphone-pro', name: 'iPhone 16 Pro' },
            { id: 'dir-data-iphone-std', name: 'iPhone 16' },
            { id: 'dir-data-iphone-acc', name: 'iPhone Accessories' },
          ],
        },
        {
          id: 'dir-data-store',
          name: 'Storefront Direct',
          items: [
            { id: 'dir-data-store-web', name: 'Apple.com Web' },
            { id: 'dir-data-store-app', name: 'Apple Store App' },
          ],
        },
        {
          id: 'dir-data-appstore',
          name: 'App Store Direct',
          items: [
            { id: 'dir-data-appstore-ios', name: 'iOS Search Logs' },
            { id: 'dir-data-appstore-mac', name: 'macOS Search Logs' },
          ],
        },
      ],
      analytics: [
        {
          id: 'dir-ana-conv',
          name: 'Direct Conversion',
          items: [
            { id: 'dir-ana-conv-web', name: 'Web Checkout' },
            { id: 'dir-ana-conv-retail', name: 'Retail Pickup' },
          ],
        },
        {
          id: 'dir-ana-funnel',
          name: 'Direct Funnel',
          items: [
            { id: 'dir-ana-funnel-drop', name: 'Drop-Off Stages' },
            { id: 'dir-ana-funnel-path', name: 'Query-to-PDP' },
          ],
        },
        {
          id: 'dir-ana-latency',
          name: 'Latency Monitor',
          items: [
            { id: 'dir-ana-latency-p95', name: 'P95 Response' },
            { id: 'dir-ana-latency-edge', name: 'Edge Cache Hit' },
          ],
        },
      ],
      prep: [
        {
          id: 'dir-prep-dmc',
          name: 'SAP DMC Prep',
          items: [
            { id: 'dir-prep-dmc-material', name: 'Material Master' },
            { id: 'dir-prep-dmc-pir', name: 'PIR & Quota' },
          ],
        },
        {
          id: 'dir-prep-ingest',
          name: 'Direct Ingestion',
          items: [
            { id: 'dir-prep-ingest-kafka', name: 'Live Stream' },
            { id: 'dir-prep-ingest-back', name: 'Backfill Jobs' },
          ],
        },
        {
          id: 'dir-prep-enrich',
          name: 'Field Enricher',
          items: [
            { id: 'dir-prep-enrich-geo', name: 'Geo Tagging' },
            { id: 'dir-prep-enrich-dev', name: 'Device Classifier' },
          ],
        },
        {
          id: 'dir-prep-qa',
          name: 'QA Validator',
          items: [
            { id: 'dir-prep-qa-null', name: 'Null Checks' },
            { id: 'dir-prep-qa-drift', name: 'Schema Drift' },
          ],
        },
      ],
    },
  },
  imac: {
    title: 'Ind',
    modes: {
      dashboards: [
        {
          id: 'ind-dash-partner',
          name: 'Partner Overview',
          items: [
            { id: 'ind-dash-partner-car', name: 'Carrier Performance' },
            { id: 'ind-dash-partner-res', name: 'Global Reseller Pulse' },
          ],
        },
        {
          id: 'ind-dash-mix',
          name: 'Channel Mix',
          items: [
            { id: 'ind-dash-mix-comp', name: 'Direct vs Indirect' },
            { id: 'ind-dash-mix-health', name: 'Regional Feed Health' },
          ],
        },
      ],
      data: [
        {
          id: 'ind-data-partner',
          name: 'Partner Feeds',
          items: [
            { id: 'ind-data-partner-car', name: 'Carrier Portals' },
            { id: 'ind-data-partner-ret', name: 'Retail Partners' },
          ],
        },
        {
          id: 'ind-data-reseller',
          name: 'Reseller Signals',
          items: [
            { id: 'ind-data-reseller-apr', name: 'APR Stores' },
            { id: 'ind-data-reseller-edu', name: 'Education Resellers' },
          ],
        },
        {
          id: 'ind-data-syndicated',
          name: 'Syndicated Index',
          items: [
            { id: 'ind-data-synd-cat', name: 'Catalog Sync' },
            { id: 'ind-data-synd-price', name: 'Price Feeds' },
          ],
        },
      ],
      analytics: [
        {
          id: 'ind-ana-attr',
          name: 'Attribution Mix',
          items: [
            { id: 'ind-ana-attr-first', name: 'First Touch' },
            { id: 'ind-ana-attr-multi', name: 'Multi-Touch' },
          ],
        },
        {
          id: 'ind-ana-overlap',
          name: 'Channel Overlap',
          items: [
            { id: 'ind-ana-overlap-dir', name: 'Direct vs Indirect' },
            { id: 'ind-ana-overlap-cross', name: 'Cross-Partner' },
          ],
        },
        {
          id: 'ind-ana-bench',
          name: 'Partner Benchmark',
          items: [
            { id: 'ind-ana-bench-tier', name: 'Tier 1 Scorecards' },
            { id: 'ind-ana-bench-sla', name: 'Feed SLA' },
          ],
        },
      ],
      prep: [
        {
          id: 'ind-prep-harm',
          name: 'Feed Harmonizer',
          items: [
            { id: 'ind-prep-harm-cur', name: 'Currency Norm' },
            { id: 'ind-prep-harm-sku', name: 'SKU Matching' },
          ],
        },
        {
          id: 'ind-prep-map',
          name: 'Partner Mapping',
          items: [
            { id: 'ind-prep-map-id', name: 'Partner IDs' },
            { id: 'ind-prep-map-geo', name: 'Region Codes' },
          ],
        },
        {
          id: 'ind-prep-anom',
          name: 'Anomaly Filter',
          items: [
            { id: 'ind-prep-anom-spike', name: 'Spike Guards' },
            { id: 'ind-prep-anom-bot', name: 'Bot Scrubbing' },
          ],
        },
      ],
    },
  },
  ipod: {
    title: 'Out',
    modes: {
      dashboards: [
        {
          id: 'out-dash-ops',
          name: 'Operations',
          items: [
            { id: 'out-dash-ops-sla', name: 'Delivery SLA Board' },
            { id: 'out-dash-ops-pipe', name: 'Export Pipeline Status' },
          ],
        },
        {
          id: 'out-dash-cons',
          name: 'Consumption',
          items: [
            { id: 'out-dash-cons-team', name: 'Team Usage Board' },
            { id: 'out-dash-cons-api', name: 'API Health Summary' },
          ],
        },
      ],
      data: [
        {
          id: 'out-data-snap',
          name: 'Export Snapshots',
          items: [
            { id: 'out-data-snap-daily', name: 'Daily Parquet' },
            { id: 'out-data-snap-week', name: 'Weekly Rollup' },
          ],
        },
        {
          id: 'out-data-api',
          name: 'API Payloads',
          items: [
            { id: 'out-data-api-rest', name: 'REST Responses' },
            { id: 'out-data-api-gql', name: 'GraphQL Traces' },
          ],
        },
        {
          id: 'out-data-hook',
          name: 'Webhook Logs',
          items: [
            { id: 'out-data-hook-ok', name: 'Delivered Events' },
            { id: 'out-data-hook-retry', name: 'Retry Queue' },
          ],
        },
      ],
      analytics: [
        {
          id: 'out-ana-health',
          name: 'Delivery Health',
          items: [
            { id: 'out-ana-health-sla', name: 'Success Rate' },
            { id: 'out-ana-health-err', name: 'Error Breakdown' },
          ],
        },
        {
          id: 'out-ana-sync',
          name: 'Sync Throughput',
          items: [
            { id: 'out-ana-sync-rps', name: 'Records / Sec' },
            { id: 'out-ana-sync-lag', name: 'Consumer Lag' },
          ],
        },
        {
          id: 'out-ana-usage',
          name: 'Consumer Usage',
          items: [
            { id: 'out-ana-usage-team', name: 'By Internal Team' },
            { id: 'out-ana-usage-quota', name: 'API Quotas' },
          ],
        },
      ],
      prep: [
        {
          id: 'out-prep-batch',
          name: 'Batch Packaging',
          items: [
            { id: 'out-prep-batch-part', name: 'Partition Rules' },
            { id: 'out-prep-batch-comp', name: 'Compression' },
          ],
        },
        {
          id: 'out-prep-fmt',
          name: 'Export Formatter',
          items: [
            { id: 'out-prep-fmt-json', name: 'JSON Schemas' },
            { id: 'out-prep-fmt-csv', name: 'CSV Templates' },
          ],
        },
        {
          id: 'out-prep-stage',
          name: 'Release Staging',
          items: [
            { id: 'out-prep-stage-can', name: 'Canary Targets' },
            { id: 'out-prep-stage-prod', name: 'Prod Promotion' },
          ],
        },
      ],
    },
  },
};

export function isPrimaryCategory(navId) {
  return Boolean(PRODUCT_CATALOG[navId]);
}

export function isSidebarCategory(navId) {
  return navId !== 'home' && Boolean(PRODUCT_CATALOG[navId]);
}

export function getDefaultSelection(navId, modeId) {
  const firstGroup = PRODUCT_CATALOG[navId]?.modes?.[modeId]?.[0];
  const firstItem = firstGroup?.items?.[0];
  return {
    groupId: firstGroup?.id ?? null,
    itemId: firstItem?.id ?? null,
  };
}

export function findProductSelection(navId, modeId, itemId) {
  const groups = PRODUCT_CATALOG[navId]?.modes?.[modeId] ?? [];
  for (const group of groups) {
    const item = group.items.find((entry) => entry.id === itemId);
    if (item) {
      return { group, item };
    }
  }
  const fallbackGroup = groups[0] ?? null;
  const fallbackItem = fallbackGroup?.items?.[0] ?? null;
  return { group: fallbackGroup, item: fallbackItem };
}
