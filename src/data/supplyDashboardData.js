// Dummy Apple Supply Chain Planning data for Dir -> Dashboards Control Tower
// All views filter deterministically by component family ('all' | 'silicon' | 'display' | 'enclosure' | 'battery')

export const COMPONENT_FAMILIES = [
  { id: 'all', label: 'All Parts' },
  { id: 'silicon', label: 'A18 Silicon' },
  { id: 'display', label: 'OLED Displays' },
  { id: 'enclosure', label: 'Titanium Enclosures' },
  { id: 'battery', label: 'Battery Packs' },
];

// Accurately projected (Equirectangular 1000x440: x = (lon+180)/360*1000, y = (85-lat)/145*440)
export const MAP_NODES = [
  // Tier-1 Suppliers (Blue)
  { id: 'hsinchu', name: 'Hsinchu (TSMC)', role: 'supplier', x: 836, y: 183, region: 'APAC' },
  { id: 'seoul', name: 'Seoul (OLED)', role: 'supplier', x: 853, y: 144, region: 'APAC' },
  { id: 'osaka', name: 'Osaka (Sensors)', role: 'supplier', x: 876, y: 153, region: 'APAC' },
  // Assembly Hubs (Purple)
  { id: 'zhengzhou', name: 'Zhengzhou Hub', role: 'assembly', x: 816, y: 152, region: 'APAC' },
  { id: 'shenzhen', name: 'Shenzhen Hub', role: 'assembly', x: 817, y: 189, region: 'APAC' },
  { id: 'chennai', name: 'Chennai Assembly', role: 'assembly', x: 723, y: 218, region: 'APAC' },
  // End Markets (Green)
  { id: 'cupertino', name: 'Cupertino / US', role: 'market', x: 161, y: 145, region: 'Americas' },
  { id: 'cork', name: 'Cork / EMEA', role: 'market', x: 476, y: 100, region: 'EMEA' },
  { id: 'singapore', name: 'Singapore / SEA', role: 'market', x: 788, y: 254, region: 'APAC' },
  { id: 'tokyo', name: 'Tokyo / JP', role: 'market', x: 888, y: 150, region: 'APAC' },
];

export const MAP_LANES = [
  // Suppliers -> Assembly
  { id: 'l1', from: 'hsinchu', to: 'zhengzhou', family: 'silicon', part: 'A18 Pro SoC', volumeK: 1420, transitDays: 2.1, status: 'ok', arc: -18 },
  { id: 'l2', from: 'hsinchu', to: 'chennai', family: 'silicon', part: 'A18 Base SoC', volumeK: 680, transitDays: 4.5, status: 'watch', arc: 28 },
  { id: 'l3', from: 'seoul', to: 'zhengzhou', family: 'display', part: 'LTPO OLED 6.3"', volumeK: 1180, transitDays: 2.4, status: 'ok', arc: -16 },
  { id: 'l4', from: 'osaka', to: 'shenzhen', family: 'enclosure', part: 'Optical & Actuators', volumeK: 920, transitDays: 3.0, status: 'ok', arc: 22 },
  { id: 'l5', from: 'shenzhen', to: 'zhengzhou', family: 'battery', part: 'Stacked Li-Ion Cell', volumeK: 1050, transitDays: 1.8, status: 'ok', arc: -14 },
  // Assembly -> End Markets
  { id: 'l6', from: 'zhengzhou', to: 'cupertino', family: 'all', part: 'iPhone 16 Pro (Air)', volumeK: 1840, transitDays: 3.2, status: 'ok', arc: -92 },
  { id: 'l7', from: 'zhengzhou', to: 'cork', family: 'all', part: 'EMEA Direct Cargo', volumeK: 1290, transitDays: 4.8, status: 'watch', arc: -56 },
  { id: 'l8', from: 'chennai', to: 'cork', family: 'display', part: 'EMEA Secondary Lane', volumeK: 540, transitDays: 5.4, status: 'ok', arc: -36 },
  { id: 'l9', from: 'shenzhen', to: 'singapore', family: 'battery', part: 'SEA Distribution', volumeK: 610, transitDays: 2.0, status: 'ok', arc: 14 },
  { id: 'l10', from: 'zhengzhou', to: 'tokyo', family: 'enclosure', part: 'JP Express Air', volumeK: 490, transitDays: 1.6, status: 'ok', arc: -24 },
];

export const DASHBOARD_DATA_BY_FAMILY = {
  all: {
    kpis: [
      { id: 'fill', label: 'Global Fill Rate', value: '96.8%', delta: '+1.4% vs plan', tone: 'good' },
      { id: 'transit', label: 'In-Transit Volume', value: '4.82M', delta: '10 active lanes', tone: 'blue' },
      { id: 'dos', label: 'Days of Supply', value: '19.4d', delta: 'Target 18–22d', tone: 'good' },
      { id: 'otif', label: 'Supplier OTIF', value: '94.2%', delta: '2 lanes watch', tone: 'warn' },
    ],
    weeklyPlan: [
      { week: 'W41', supply: 820, demand: 790, buffer: 18.2 },
      { week: 'W42', supply: 865, demand: 840, buffer: 18.8 },
      { week: 'W43', supply: 910, demand: 895, buffer: 19.0 },
      { week: 'W44', supply: 940, demand: 960, buffer: 18.4 },
      { week: 'W45', supply: 1020, demand: 985, buffer: 19.4 },
      { week: 'W46', supply: 1080, demand: 1040, buffer: 20.1 },
      { week: 'W47', supply: 1140, demand: 1110, buffer: 20.8 },
      { week: 'W48', supply: 1090, demand: 1060, buffer: 21.2 },
    ],
    sourcingMix: [
      { label: 'Taiwan', value: 34, color: '#0071E3' },
      { label: 'China', value: 29, color: '#AF52DE' },
      { label: 'S. Korea', value: 18, color: '#5AC8FA' },
      { label: 'India', value: 12, color: '#34C759' },
      { label: 'Japan', value: 7, color: '#FF9500' },
    ],
    plantCapacity: [
      { name: 'Zhengzhou (3000)', util: 92, target: 90, units: '1.84M/wk' },
      { name: 'Chennai (3200)', util: 86, target: 85, units: '0.78M/wk' },
      { name: 'Shenzhen (3100)', util: 79, target: 85, units: '1.12M/wk' },
      { name: 'Cork EMEA (2100)', util: 74, target: 85, units: '0.64M/wk' },
      { name: 'Cupertino DC (1000)', util: 68, target: 85, units: '0.91M/wk' },
    ],
  },
  silicon: {
    kpis: [
      { id: 'fill', label: 'Global Fill Rate', value: '95.1%', delta: '-0.6% tight wafer', tone: 'warn' },
      { id: 'transit', label: 'In-Transit Volume', value: '2.10M', delta: 'Hsinchu → Hubs', tone: 'blue' },
      { id: 'dos', label: 'Days of Supply', value: '16.8d', delta: 'Below 18d floor', tone: 'warn' },
      { id: 'otif', label: 'Supplier OTIF', value: '96.4%', delta: '1 lane watch', tone: 'good' },
    ],
    weeklyPlan: [
      { week: 'W41', supply: 310, demand: 300, buffer: 17.5 },
      { week: 'W42', supply: 325, demand: 320, buffer: 17.2 },
      { week: 'W43', supply: 340, demand: 350, buffer: 16.6 },
      { week: 'W44', supply: 355, demand: 365, buffer: 16.1 },
      { week: 'W45', supply: 380, demand: 375, buffer: 16.8 },
      { week: 'W46', supply: 410, demand: 395, buffer: 17.4 },
      { week: 'W47', supply: 430, demand: 415, buffer: 18.1 },
      { week: 'W48', supply: 425, demand: 405, buffer: 18.8 },
    ],
    sourcingMix: [
      { label: 'Taiwan', value: 78, color: '#0071E3' },
      { label: 'Japan', value: 11, color: '#FF9500' },
      { label: 'S. Korea', value: 7, color: '#5AC8FA' },
      { label: 'US Fab', value: 4, color: '#34C759' },
    ],
    plantCapacity: [
      { name: 'Hsinchu Fab 18', util: 96, target: 90, units: '2.10M/wk' },
      { name: 'Zhengzhou (3000)', util: 91, target: 90, units: '1.42M/wk' },
      { name: 'Chennai (3200)', util: 84, target: 85, units: '0.68M/wk' },
      { name: 'Munich Lab (2200)', util: 62, target: 80, units: '0.12M/wk' },
      { name: 'Austin Fab (1010)', util: 58, target: 80, units: '0.18M/wk' },
    ],
  },
  display: {
    kpis: [
      { id: 'fill', label: 'Global Fill Rate', value: '97.9%', delta: '+2.1% vs plan', tone: 'good' },
      { id: 'transit', label: 'In-Transit Volume', value: '1.72M', delta: 'Seoul → Hubs', tone: 'blue' },
      { id: 'dos', label: 'Days of Supply', value: '21.2d', delta: 'Target 18–22d', tone: 'good' },
      { id: 'otif', label: 'Supplier OTIF', value: '95.8%', delta: 'All lanes green', tone: 'good' },
    ],
    weeklyPlan: [
      { week: 'W41', supply: 240, demand: 230, buffer: 20.1 },
      { week: 'W42', supply: 255, demand: 245, buffer: 20.5 },
      { week: 'W43', supply: 270, demand: 260, buffer: 20.9 },
      { week: 'W44', supply: 280, demand: 275, buffer: 21.0 },
      { week: 'W45', supply: 295, demand: 285, buffer: 21.2 },
      { week: 'W46', supply: 310, demand: 300, buffer: 21.6 },
      { week: 'W47', supply: 325, demand: 310, buffer: 22.0 },
      { week: 'W48', supply: 315, demand: 305, buffer: 22.2 },
    ],
    sourcingMix: [
      { label: 'S. Korea', value: 64, color: '#5AC8FA' },
      { label: 'China', value: 26, color: '#AF52DE' },
      { label: 'Japan', value: 10, color: '#FF9500' },
    ],
    plantCapacity: [
      { name: 'Seoul OLED Line', util: 88, target: 90, units: '1.18M/wk' },
      { name: 'Zhengzhou (3000)', util: 85, target: 90, units: '1.05M/wk' },
      { name: 'Chennai (3200)', util: 77, target: 85, units: '0.54M/wk' },
      { name: 'Cork EMEA (2100)', util: 71, target: 85, units: '0.42M/wk' },
      { name: 'Cupertino DC (1000)', util: 66, target: 85, units: '0.60M/wk' },
    ],
  },
  enclosure: {
    kpis: [
      { id: 'fill', label: 'Global Fill Rate', value: '98.4%', delta: '+1.9% vs plan', tone: 'good' },
      { id: 'transit', label: 'In-Transit Volume', value: '1.41M', delta: 'Osaka/SZ → Hubs', tone: 'blue' },
      { id: 'dos', label: 'Days of Supply', value: '22.6d', delta: 'Healthy buffer', tone: 'good' },
      { id: 'otif', label: 'Supplier OTIF', value: '97.1%', delta: 'Zero delays', tone: 'good' },
    ],
    weeklyPlan: [
      { week: 'W41', supply: 190, demand: 180, buffer: 21.2 },
      { week: 'W42', supply: 205, demand: 195, buffer: 21.6 },
      { week: 'W43', supply: 215, demand: 205, buffer: 22.0 },
      { week: 'W44', supply: 220, demand: 215, buffer: 22.1 },
      { week: 'W45', supply: 235, demand: 225, buffer: 22.6 },
      { week: 'W46', supply: 245, demand: 235, buffer: 22.9 },
      { week: 'W47', supply: 260, demand: 250, buffer: 23.2 },
      { week: 'W48', supply: 250, demand: 240, buffer: 23.4 },
    ],
    sourcingMix: [
      { label: 'China', value: 48, color: '#AF52DE' },
      { label: 'Japan', value: 28, color: '#FF9500' },
      { label: 'India', value: 16, color: '#34C759' },
      { label: 'Taiwan', value: 8, color: '#0071E3' },
    ],
    plantCapacity: [
      { name: 'Shenzhen CNC (3100)', util: 84, target: 90, units: '0.92M/wk' },
      { name: 'Zhengzhou (3000)', util: 81, target: 90, units: '0.74M/wk' },
      { name: 'Tokyo Dist (4100)', util: 73, target: 85, units: '0.49M/wk' },
      { name: 'Chennai (3200)', util: 69, target: 85, units: '0.35M/wk' },
      { name: 'Cork EMEA (2100)', util: 64, target: 85, units: '0.38M/wk' },
    ],
  },
  battery: {
    kpis: [
      { id: 'fill', label: 'Global Fill Rate', value: '96.2%', delta: '+0.8% vs plan', tone: 'good' },
      { id: 'transit', label: 'In-Transit Volume', value: '1.66M', delta: 'SZ → ZG / SEA', tone: 'blue' },
      { id: 'dos', label: 'Days of Supply', value: '18.9d', delta: 'Target 18–22d', tone: 'good' },
      { id: 'otif', label: 'Supplier OTIF', value: '93.5%', delta: 'DG air check', tone: 'warn' },
    ],
    weeklyPlan: [
      { week: 'W41', supply: 210, demand: 205, buffer: 18.0 },
      { week: 'W42', supply: 220, demand: 215, buffer: 18.3 },
      { week: 'W43', supply: 230, demand: 225, buffer: 18.6 },
      { week: 'W44', supply: 235, demand: 240, buffer: 18.4 },
      { week: 'W45', supply: 250, demand: 242, buffer: 18.9 },
      { week: 'W46', supply: 265, demand: 255, buffer: 19.3 },
      { week: 'W47', supply: 275, demand: 265, buffer: 19.7 },
      { week: 'W48', supply: 270, demand: 260, buffer: 20.0 },
    ],
    sourcingMix: [
      { label: 'China', value: 58, color: '#AF52DE' },
      { label: 'India', value: 24, color: '#34C759' },
      { label: 'S. Korea', value: 12, color: '#5AC8FA' },
      { label: 'Japan', value: 6, color: '#FF9500' },
    ],
    plantCapacity: [
      { name: 'Shenzhen Cell (3100)', util: 89, target: 90, units: '1.05M/wk' },
      { name: 'Zhengzhou (3000)', util: 83, target: 90, units: '0.88M/wk' },
      { name: 'Singapore Hub (4000)', util: 76, target: 85, units: '0.61M/wk' },
      { name: 'Chennai (3200)', util: 72, target: 85, units: '0.44M/wk' },
      { name: 'Cupertino DC (1000)', util: 65, target: 85, units: '0.52M/wk' },
    ],
  },
};

export function generateDeterministicSummary(familyId, familyLabel, data, activeLanes) {
  const fill = data.kpis.find((k) => k.id === 'fill');
  const dos = data.kpis.find((k) => k.id === 'dos');
  const otif = data.kpis.find((k) => k.id === 'otif');
  const topBottleneck = [...data.plantCapacity].sort((a, b) => b.util - a.util)[0];
  const watchLanes = activeLanes.filter((l) => l.status === 'watch');
  const topSource = [...data.sourcingMix].sort((a, b) => b.value - a.value)[0];
  const peakWeek = [...data.weeklyPlan].sort((a, b) => b.demand - a.demand)[0];

  const lines = [
    `Executive Supply Chain Brief — ${familyLabel} (W41–W48)`,
    `• Service & Buffer: Fill Rate at ${fill?.value} (${fill?.delta}); Days of Supply at ${dos?.value} (${dos?.delta}); Supplier OTIF at ${otif?.value}.`,
    `• Bottleneck Watch: ${topBottleneck.name} running at ${topBottleneck.util}% utilization (${topBottleneck.units}) against ${topBottleneck.target}% threshold.`,
    `• Sourcing Concentration: ${topSource.label} accounts for ${topSource.value}% of allocated supply; peak demand hits in ${peakWeek.week} (${peakWeek.demand}K units vs ${peakWeek.supply}K supply).`,
    watchLanes.length > 0
      ? `• Active Lane Alerts (${watchLanes.length}): ${watchLanes.map((l) => `${l.part} (${l.transitDays}d transit)`).join(', ')} — recommend air-capacity pre-booking.`
      : `• Lane Health: All ${activeLanes.length} active transit lanes operating within SLA.`,
  ];
  return lines.join('\n');
}
