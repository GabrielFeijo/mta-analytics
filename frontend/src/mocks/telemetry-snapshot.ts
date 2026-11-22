import {
  DashboardStats,
  EconomicSnapshot,
  FinesStats,
  HeatmapPoint,
  OverviewDayPoint,
  Player,
  PlayerActivityEvent,
  ResourcesStats,
  ServerStatus,
  Transaction,
} from '@/types/telemetry';

export const MOCK_SERVER_STATUS: ServerStatus = {
  online: true,
  playerCount: 34,
  maxPlayers: 128,
  serverName: 'Garage Night RP (Snapshot)',
  queueSize: 0,
  serverId: 'mta-server-key-1',
  updatedAt: Date.now(),
};

export const MOCK_ECONOMIC_SNAPSHOT: EconomicSnapshot = {
  totalMoney: 18450000,
  moneyInCirc: 5720000,
  dirtyMoney: 1290000,
  avgPlayerWealth: 124662,
  inflationRate: 1.8,
};

export const MOCK_PLAYERS: Player[] = [
  {
    id: 1,
    serial: '94B7F20E19C84A12D0F3847E6A51C9B2',
    lastUsername: 'Gabriel_Feijo',
    totalPlaytime: 4320,
    firstSeen: '2026-01-10T18:00:00Z',
    lastSeen: new Date().toISOString(),
    isBanned: false,
    riskScore: 0.08,
    money: 185000,
    bank: 2450000,
    dirtyMoney: 35000,
    level: 28,
    experience: 84200,
    job: 'Organizador Clandestino',
    playedTime: 4320,
    characterId: 101,
    thirst: 92,
    hunger: 88,
    premiumPoints: 1450,
    faction: 'Garage Night Crew',
  },
  {
    id: 2,
    serial: '7C13A88F04D92B61E5A0339C4F8D1E70',
    lastUsername: 'Lucas_Drift',
    totalPlaytime: 3180,
    firstSeen: '2026-01-14T20:15:00Z',
    lastSeen: new Date(Date.now() - 120000).toISOString(),
    isBanned: false,
    riskScore: 0.24,
    money: 94000,
    bank: 810000,
    dirtyMoney: 0,
    level: 21,
    experience: 51900,
    job: 'Mecânico Chefe',
    playedTime: 3180,
    characterId: 108,
    thirst: 76,
    hunger: 81,
    premiumPoints: 600,
    faction: 'Redline Customs',
  },
  {
    id: 3,
    serial: '3E91D47C82A05F19B6E2448A1D7C0F55',
    lastUsername: 'Vini_Apex',
    totalPlaytime: 2640,
    firstSeen: '2026-01-22T22:00:00Z',
    lastSeen: new Date(Date.now() - 240000).toISOString(),
    isBanned: false,
    riskScore: 0.68,
    money: 312000,
    bank: 420000,
    dirtyMoney: 190000,
    level: 19,
    experience: 43800,
    job: 'Piloto Clandestino',
    playedTime: 2640,
    characterId: 114,
    thirst: 64,
    hunger: 58,
    premiumPoints: 250,
    faction: 'Touge Syndicate',
  },
  {
    id: 4,
    serial: '5A08E22B91C47D30F8A6112E9B4C3D88',
    lastUsername: 'Kaio_Turbo',
    totalPlaytime: 1890,
    firstSeen: '2026-02-01T19:40:00Z',
    lastSeen: new Date(Date.now() - 310000).toISOString(),
    isBanned: false,
    riskScore: 0.15,
    money: 48500,
    bank: 690000,
    dirtyMoney: 0,
    level: 16,
    experience: 34100,
    job: 'Transporte de Valores',
    playedTime: 1890,
    characterId: 129,
    thirst: 85,
    hunger: 90,
    premiumPoints: 400,
    faction: 'Civil',
  },
  {
    id: 5,
    serial: '1F44C90A73E81B25D9C0664F2A8E5B19',
    lastUsername: 'Rafa_R34',
    totalPlaytime: 1540,
    firstSeen: '2026-02-04T21:10:00Z',
    lastSeen: new Date(Date.now() - 480000).toISOString(),
    isBanned: false,
    riskScore: 0.79,
    money: 520000,
    bank: 195000,
    dirtyMoney: 410000,
    level: 15,
    experience: 29800,
    job: 'Desempregado',
    playedTime: 1540,
    characterId: 142,
    thirst: 28,
    hunger: 24,
    premiumPoints: 0,
    faction: 'Docas Underground',
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 901,
    playerId: 1,
    type: 'EARN',
    amount: 45000,
    balance: 2450000,
    source: 'mta_racing',
    description: 'Prêmio 1º lugar — High Stakes: El Corona -> Santa Maria (Sujo)',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    player: { lastUsername: 'Gabriel_Feijo' },
  },
  {
    id: 902,
    playerId: 2,
    type: 'SPEND',
    amount: 15000,
    balance: 810000,
    source: 'mta_racing',
    description: 'Inscrição bateria #42 — Fuga das Docas: Willowfield',
    timestamp: new Date(Date.now() - 420000).toISOString(),
    player: { lastUsername: 'Lucas_Drift' },
  },
  {
    id: 903,
    playerId: 3,
    type: 'SPEND',
    amount: 285000,
    balance: 420000,
    source: 'spc_carshop',
    description: 'Aquisição Nissan GTR (Concessionária)',
    timestamp: new Date(Date.now() - 950000).toISOString(),
    player: { lastUsername: 'Vini_Apex' },
  },
  {
    id: 904,
    playerId: 5,
    type: 'SPEND',
    amount: 4800,
    balance: 195000,
    source: 'traffic_fine',
    description: 'Radar 198 km/h — Mulholland Intersection (Placa: R34-9981)',
    timestamp: new Date(Date.now() - 1500000).toISOString(),
    player: { lastUsername: 'Rafa_R34' },
  },
  {
    id: 905,
    playerId: 4,
    type: 'EARN',
    amount: 22500,
    balance: 690000,
    source: 'spc_employment',
    description: 'Pagamento de rota — Transporte de Valores',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    player: { lastUsername: 'Kaio_Turbo' },
  },
  {
    id: 906,
    playerId: 2,
    type: 'SPEND',
    amount: 6400,
    balance: 825000,
    source: 'spc_mechanic',
    description: 'Revisão de motor e troca de pneus slick',
    timestamp: new Date(Date.now() - 3100000).toISOString(),
    player: { lastUsername: 'Lucas_Drift' },
  },
];

interface MockHeatmapSeed {
  x: number;
  y: number;
  count: number;
  label: string;
}

const MOCK_HEATMAP_SEEDS: Record<string, MockHeatmapSeed[]> = {
  player_position: [
    { x: 1910, y: -1932, count: 48, label: 'El Corona / Grid Clandestino' },
    { x: 1480, y: -1740, count: 42, label: 'Pershing Square / DP Central' },
    { x: 2503, y: 1072, count: 39, label: 'The Strip / Las Venturas' },
    { x: 965, y: -1572, count: 37, label: 'Market & Rodeo Boulevard' },
    { x: -2075, y: 730, count: 33, label: 'San Fierro Hills / Chinatown' },
    { x: 2120, y: -1150, count: 31, label: 'Idlewood / East Los Santos' },
    { x: 2670, y: -1933, count: 27, label: 'Docas de Willowfield' },
    { x: -1800, y: -260, count: 24, label: 'Doherty Industrial SF' },
    { x: 2210, y: 42, count: 22, label: 'Palomino Creek Touge' },
    { x: -80, y: 1424, count: 18, label: 'Rota 69 / Bone County' },
  ],
  player_transaction: [
    { x: 1910, y: -1932, count: 4, label: 'El Corona / Grid Clandestino' },
    { x: 2670, y: -1933, count: 3, label: 'Docas de Willowfield' },
    { x: -2075, y: 730, count: 2, label: 'San Fierro Hills / Chinatown' },
    { x: 2210, y: 42, count: 1, label: 'Palomino Creek Touge' },
  ],
  fine_issued: [
    { x: 1412, y: -1380, count: 5, label: 'Mulholland Intersection / Radar' },
    { x: 965, y: -1572, count: 4, label: 'Market & Rodeo Boulevard' },
    { x: 2120, y: -1150, count: 3, label: 'Idlewood / Cruzamento Urbano' },
    { x: 1480, y: -1740, count: 2, label: 'Pershing Square / Semáforo' },
  ],
  player_wasted: [
    { x: 2120, y: -1150, count: 3, label: 'Idlewood / East Los Santos' },
    { x: 2670, y: -1933, count: 2, label: 'Docas de Willowfield' },
    { x: -1800, y: -260, count: 1, label: 'Doherty Industrial SF' },
  ],
  vehicle_purchase: [
    { x: 965, y: -1572, count: 2, label: 'Concessionária Market / Rodeo (LS)' },
    { x: -1956, y: 294, count: 1, label: 'Concessionária Doherty / Wang Cars (SF)' },
  ],
};

export function getMockHeatmapData(
  eventType: string,
  windowHours: number = 24,
): HeatmapPoint[] {
  const seeds = MOCK_HEATMAP_SEEDS[eventType] || MOCK_HEATMAP_SEEDS.player_position;
  const factor = windowHours <= 6 ? 0.35 : windowHours <= 24 ? 1 : 4.5;

  const scaled = seeds
    .map((seed) => ({
      ...seed,
      count: Math.round(seed.count * factor),
    }))
    .filter((seed) => seed.count > 0);

  if (scaled.length === 0) {
    return [];
  }

  const maxCount = Math.max(1, ...scaled.map((s) => s.count));
  const baseline = Math.max(5, maxCount);

  return scaled.map((seed) => ({
    x: seed.x,
    y: seed.y,
    count: seed.count,
    intensity: Math.round(Math.min(1, seed.count / baseline) * 1000) / 1000,
    label: seed.label,
  }));
}

export function getMockDashboardStats(): DashboardStats {
  return {
    totalPlayers: 148,
    onlinePlayers: 34,
    riskAlerts: 2,
    trends: {
      playerGrowth: '+8.4',
      onlineTrend: '+14%',
    },
    economicSnapshot: MOCK_ECONOMIC_SNAPSHOT,
    serverStatus: MOCK_SERVER_STATUS,
    recentEvents: [
      {
        id: '101',
        eventType: 'player_transaction',
        timestamp: new Date(Date.now() - 95000).toISOString(),
        positionX: 1910,
        positionY: -1932,
        data: { type: 'race_dirty_earn', amount: 45000, source_resource: 'mta_racing' },
        player: { lastUsername: 'Gabriel_Feijo', serial: '94B7F20E19C8' },
      },
      {
        id: '102',
        eventType: 'vehicle_purchase',
        timestamp: new Date(Date.now() - 320000).toISOString(),
        positionX: 965,
        positionY: -1572,
        data: { vehicleName: 'Nissan GTR', price: 285000, source_resource: 'spc_carshop' },
        player: { lastUsername: 'Vini_Apex', serial: '3E91D47C82A0' },
      },
      {
        id: '103',
        eventType: 'fine_issued',
        timestamp: new Date(Date.now() - 540000).toISOString(),
        positionX: 1412,
        positionY: -1380,
        data: { amount: 4800, plate: 'R34-9981', reason: 'Excesso de velocidade (198 km/h)' },
        player: { lastUsername: 'Rafa_R34', serial: '1F44C90A73E8' },
      },
      {
        id: '104',
        eventType: 'player_join',
        timestamp: new Date(Date.now() - 780000).toISOString(),
        positionX: 1480,
        positionY: -1740,
        data: { ip: '189.44.112.9' },
        player: { lastUsername: 'Lucas_Drift', serial: '7C13A88F04D9' },
      },
      {
        id: '105',
        eventType: 'player_transaction',
        timestamp: new Date(Date.now() - 1100000).toISOString(),
        positionX: 2503,
        positionY: 1072,
        data: { type: 'job_payout', amount: 22500, source_resource: 'spc_employment' },
        player: { lastUsername: 'Kaio_Turbo', serial: '5A08E22B91C4' },
      },
    ],
    timestamp: Date.now(),
  };
}

export const MOCK_OVERVIEW_DATA: OverviewDayPoint[] = [
  { name: '15/11', earn: 240000, spend: 185000, total: 55000 },
  { name: '16/11', earn: 310000, spend: 220000, total: 90000 },
  { name: '17/11', earn: 285000, spend: 260000, total: 25000 },
  { name: '18/11', earn: 420000, spend: 295000, total: 125000 },
  { name: '19/11', earn: 390000, spend: 340000, total: 50000 },
  { name: '20/11', earn: 510000, spend: 380000, total: 130000 },
  { name: '21/11', earn: 615000, spend: 430000, total: 185000 },
];

export function getMockPlayerActivity(): PlayerActivityEvent[] {
  return [
    {
      id: 'ev-1',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      eventType: 'player_transaction',
      positionX: 1910,
      positionY: -1932,
      data: { description: 'Inscrição / Prêmio de bateria clandestina (mta_racing)' },
    },
    {
      id: 'ev-2',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      eventType: 'vehicle_enter',
      positionX: 1898,
      positionY: -1930,
      data: { vehicleName: 'Nissan GTR', seat: 0 },
    },
    {
      id: 'ev-3',
      timestamp: new Date(Date.now() - 2900000).toISOString(),
      eventType: 'player_status_sync',
      positionX: 1480,
      positionY: -1740,
      data: { description: 'Sincronização automática de inventário e status vital' },
    },
  ];
}

export function getMockResourcesStats(): ResourcesStats {
  return {
    vehicleSales: [
      {
        id: 'vs-1',
        player: 'Vini_Apex',
        amount: 285000,
        vehicleName: 'Nissan GTR (R35)',
        timestamp: new Date(Date.now() - 950000).toISOString(),
      },
      {
        id: 'vs-2',
        player: 'Gabriel_Feijo',
        amount: 340000,
        vehicleName: 'Porsche 911 GT3 RS',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
      },
      {
        id: 'vs-3',
        player: 'Kaio_Turbo',
        amount: 145000,
        vehicleName: 'Mitsubishi Lancer Evo IX',
        timestamp: new Date(Date.now() - 12800000).toISOString(),
      },
    ],
    shopSales: [
      {
        id: 'ss-1',
        player: 'Lucas_Drift',
        amount: 6400,
        itemName: 'Kit Pneus Slick + Revisão Motor (spc_mechanic)',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'ss-2',
        player: 'Rafa_R34',
        amount: 5000,
        itemName: 'Chip Clandestino #372 (Docas LS)',
        timestamp: new Date(Date.now() - 4200000).toISOString(),
      },
      {
        id: 'ss-3',
        player: 'Vini_Apex',
        amount: 850,
        itemName: 'Abastecimento 52L Podium (spc_businessfuel)',
        timestamp: new Date(Date.now() - 7600000).toISOString(),
      },
    ],
    raceActivity: [
      {
        id: 'ra-1',
        player: 'Gabriel_Feijo',
        type: 'EARN',
        amount: 45000,
        currency: 'dirty',
        description: '1º Lugar — High Stakes: El Corona -> Orla Santa Maria',
        timestamp: new Date(Date.now() - 180000).toISOString(),
      },
      {
        id: 'ra-2',
        player: 'Lucas_Drift',
        type: 'SPEND',
        amount: 15000,
        currency: 'clean',
        description: 'Taxa de Grid — Fuga das Docas: Willowfield -> Palomino',
        timestamp: new Date(Date.now() - 420000).toISOString(),
      },
      {
        id: 'ra-3',
        player: 'Vini_Apex',
        type: 'EARN',
        amount: 30000,
        currency: 'dirty',
        description: '1º Lugar — San Fierro Hills: Queens & Chinatown',
        timestamp: new Date(Date.now() - 3900000).toISOString(),
      },
      {
        id: 'ra-4',
        player: 'Rafa_R34',
        type: 'SPEND',
        amount: 10000,
        currency: 'clean',
        description: 'Aposta Paralela em Lucas_Drift (Bateria #42)',
        timestamp: new Date(Date.now() - 4100000).toISOString(),
      },
    ],
    stats: {
      totalRevenue: 882250,
      vehicleRevenue: 770000,
      shopRevenue: 12250,
      raceVolume: 100000,
      totalTransactions: 10,
      vehicleCount: 3,
      shopCount: 3,
      raceCount: 4,
    },
  };
}

export function getMockFinesStats(): FinesStats {
  return {
    summary: {
      totalFines: 14,
      totalAmount: 58400,
    },
    recentFines: [
      {
        id: 'f-1',
        player: 'Rafa_R34',
        plate: 'R34-9981',
        reason: 'Excesso de velocidade (198 km/h em via de 80 km/h)',
        amount: 4800,
        timestamp: new Date(Date.now() - 1500000).toISOString(),
      },
      {
        id: 'f-2',
        player: 'Vini_Apex',
        plate: 'GTR-0372',
        reason: 'Racha clandestino e direção perigosa em Market',
        amount: 8500,
        timestamp: new Date(Date.now() - 3800000).toISOString(),
      },
      {
        id: 'f-3',
        player: 'Lucas_Drift',
        plate: 'SLV-1994',
        reason: 'Manobra de drift em cruzamento urbano (Idlewood)',
        amount: 3200,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'f-4',
        player: 'Kaio_Turbo',
        plate: 'EVO-7710',
        reason: 'Avanço de sinal vermelho em Pershing Square',
        amount: 1900,
        timestamp: new Date(Date.now() - 14400000).toISOString(),
      },
    ],
    topPlayers: [
      { username: 'Vini_Apex', count: 5, totalAmount: 24500 },
      { username: 'Rafa_R34', count: 4, totalAmount: 18200 },
      { username: 'Lucas_Drift', count: 3, totalAmount: 9800 },
      { username: 'Kaio_Turbo', count: 2, totalAmount: 5900 },
    ],
  };
}
