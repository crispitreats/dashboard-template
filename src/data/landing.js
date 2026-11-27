export const SLIDE_DURATION_MS = 6000;

export const HERO_SLIDES = [
  {
    id: 'slide-iphone-telemetry',
    eyebrow: 'NEW IN DATA',
    title: 'iPhone 16 Series Search Telemetry',
    subtitle:
      'Explore live columnar BigQuery feeds with multi-select filters, drag-and-drop pivots, and exportable charts.',
    ctaLabel: 'Open Direct Data',
    accent: '#2997FF',
    image: '/hero-iphone.jpg',
    imageAlt: 'iPhone 16 Pro showcase',
    target: {
      navId: 'iphone',
      modeId: 'data',
      groupId: 'dir-data-iphone',
      itemId: 'dir-data-iphone-pro',
    },
  },
  {
    id: 'slide-attribution',
    eyebrow: 'Q3 RELEASE',
    title: 'Indirect Partner Attribution',
    subtitle:
      'Compare Direct vs Indirect search conversion and carrier feed SLAs across Americas, Europe, and APAC.',
    ctaLabel: 'Explore Indirect',
    accent: '#34C759',
    image: '/hero-imac.jpg',
    imageAlt: 'iMac and MacBook Pro showcase',
    target: {
      navId: 'imac',
      modeId: 'analytics',
      groupId: 'ind-ana-attr',
      itemId: 'ind-ana-attr-first',
    },
  },
  {
    id: 'slide-outbound',
    eyebrow: 'ANNOUNCEMENT',
    title: 'Outbound API & Release Staging',
    subtitle:
      'Monitor webhook delivery health, sync throughput, and daily Parquet snapshots in one unified workspace.',
    ctaLabel: 'View Outbound',
    accent: '#BF5AF2',
    image: '/hero-studio.jpg',
    imageAlt: 'Mac Studio and Studio Display showcase',
    target: {
      navId: 'ipod',
      modeId: 'data',
      groupId: 'out-data-snap',
      itemId: 'out-data-snap-daily',
    },
  },
];

export const PROFILE_PILLS = [
  { id: 'iphone', code: 'Dir', fullName: 'Direct Channels' },
  { id: 'imac', code: 'Ind', fullName: 'Indirect & Partners' },
  { id: 'ipod', code: 'Out', fullName: 'Outbound & Exports' },
];

export const MODE_META = [
  { id: 'dashboards', label: 'Dashboards', badge: 'Built-in', color: '#AF52DE', tint: 'rgba(175, 82, 222, 0.12)' },
  { id: 'data', label: 'Data', badge: 'BigQuery', color: '#0071E3', tint: 'rgba(0, 113, 227, 0.11)' },
  { id: 'analytics', label: 'Analytics', badge: 'Dashboards', color: '#34C759', tint: 'rgba(52, 199, 89, 0.12)' },
  { id: 'prep', label: 'Workbench', badge: 'Pipelines', color: '#FF9500', tint: 'rgba(255, 149, 0, 0.13)' },
];

export const PROFILE_DASHBOARDS = {
  iphone: {
    heading: 'Direct Channels',
    tagline: 'Apple.com, Apple Store App, and first-party iOS & macOS search.',
    popularIds: {
      dashboards: 'dir-dash-exec-search',
      data: 'dir-data-iphone-pro',
      analytics: 'dir-ana-conv-web',
      prep: 'dir-prep-dmc-material',
    },
    updates: [
      {
        version: 'v2.6',
        date: 'Nov 25, 2026',
        tag: 'Data',
        title: 'Multi-select & Date Range Filters',
        text: 'Added schema-agnostic multi-select, numeric range, and date range filters across all Direct BigQuery tables.',
      },
      {
        version: 'v2.5',
        date: 'Nov 21, 2026',
        tag: 'Analytics',
        title: 'Store App vs Web Latency Split',
        text: 'P95 edge latency monitor now separates Apple.com Web from Apple Store App traffic.',
      },
      {
        version: 'v2.4',
        date: 'Nov 16, 2026',
        tag: 'Workbench',
        title: 'iPhone 16 Series SKU Classifier',
        text: 'Device Classifier enrichment updated with full iPhone 16, 16 Plus, 16 Pro, and 16 Pro Max storage tiers.',
      },
      {
        version: 'v2.3',
        date: 'Nov 10, 2026',
        tag: 'Data',
        title: 'Pivot Export & Clipboard Support',
        text: 'Enabled one-click TSV clipboard copy and PNG chart export across all Direct log tables.',
      },
      {
        version: 'v2.2',
        date: 'Nov 03, 2026',
        tag: 'Analytics',
        title: 'Retail Pickup Conversion Funnel',
        text: 'Added same-day Apple Store pickup attribution stage to the Direct Conversion funnel.',
      },
      {
        version: 'v2.1',
        date: 'Oct 27, 2026',
        tag: 'Workbench',
        title: 'Automated Schema Drift Alerts',
        text: 'QA Validator now flags upstream column type changes before BigQuery table ingestion.',
      },
    ],
  },
  imac: {
    heading: 'Indirect & Partners',
    tagline: 'Carrier portals, authorized resellers, and syndicated catalog feeds.',
    popularIds: {
      dashboards: 'ind-dash-partner-car',
      data: 'ind-data-partner-car',
      analytics: 'ind-ana-attr-multi',
      prep: 'ind-prep-harm-sku',
    },
    updates: [
      {
        version: 'v2.6',
        date: 'Nov 24, 2026',
        tag: 'Data',
        title: '15-Minute Carrier Feed Refresh',
        text: 'Reduced Carrier Portals ingestion latency to 15-minute incremental micro-batches.',
      },
      {
        version: 'v2.5',
        date: 'Nov 18, 2026',
        tag: 'Analytics',
        title: 'Q3 Tier 1 Partner Scorecards',
        text: 'Published Q3 regional partner benchmarks across Americas, Europe, and APAC.',
      },
      {
        version: 'v2.4',
        date: 'Nov 12, 2026',
        tag: 'Workbench',
        title: 'Bot Scrubbing Rules v2.4',
        text: 'Deployed updated anomaly and bot traffic filters across APAC reseller signals.',
      },
      {
        version: 'v2.3',
        date: 'Nov 06, 2026',
        tag: 'Data',
        title: 'APR Store Price Feed Coverage',
        text: 'Expanded Syndicated Index price feeds to include 140+ additional Authorized Reseller storefronts.',
      },
      {
        version: 'v2.2',
        date: 'Oct 30, 2026',
        tag: 'Analytics',
        title: 'Direct vs Indirect Overlap Matrix',
        text: 'Launched cross-channel overlap diagnostics to measure assisted partner search lift.',
      },
      {
        version: 'v2.1',
        date: 'Oct 22, 2026',
        tag: 'Workbench',
        title: 'FX Currency Normalization',
        text: 'Feed Harmonizer now normalizes 28 local currencies to daily USD reference rates.',
      },
    ],
  },
  ipod: {
    heading: 'Outbound & Exports',
    tagline: 'Scheduled Parquet snapshots, REST/GraphQL payloads, and webhook delivery.',
    popularIds: {
      dashboards: 'out-dash-ops-sla',
      data: 'out-data-snap-daily',
      analytics: 'out-ana-health-sla',
      prep: 'out-prep-stage-can',
    },
    updates: [
      {
        version: 'v2.6',
        date: 'Nov 25, 2026',
        tag: 'Data',
        title: 'ZSTD Parquet Compression',
        text: 'Upgraded Daily Parquet snapshot compression to ZSTD, reducing export size by 38%.',
      },
      {
        version: 'v2.5',
        date: 'Nov 19, 2026',
        tag: 'Analytics',
        title: 'Per-Team API Quota Alerts',
        text: 'Consumer Usage now surfaces real-time quota utilization thresholds for internal teams.',
      },
      {
        version: 'v2.4',
        date: 'Nov 13, 2026',
        tag: 'Workbench',
        title: 'Automated Canary Verification',
        text: 'Release Staging runs schema and payload parity checks automatically before Prod Promotion.',
      },
      {
        version: 'v2.3',
        date: 'Nov 07, 2026',
        tag: 'Data',
        title: 'Webhook Retry Queue Visibility',
        text: 'Added granular retry attempt logs and HTTP error codes to Outbound Webhook Logs.',
      },
      {
        version: 'v2.2',
        date: 'Oct 31, 2026',
        tag: 'Analytics',
        title: 'Consumer Lag Telemetry',
        text: 'Sync Throughput dashboard now tracks end-to-end consumer lag at 1-minute resolution.',
      },
      {
        version: 'v2.1',
        date: 'Oct 24, 2026',
        tag: 'Workbench',
        title: 'JSON & CSV Export Templates',
        text: 'Added reusable schema templates for downstream finance and merchandising exports.',
      },
    ],
  },
};
