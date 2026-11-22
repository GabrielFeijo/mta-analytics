export type UserRole = 'ADMIN' | 'MODERATOR' | 'VIEWER';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface ServerStatus {
  online: boolean;
  playerCount: number;
  maxPlayers: number;
  serverName: string | null;
  queueSize: number;
  serverId?: string;
  updatedAt: number | null;
}

export interface EconomicSnapshot {
  totalMoney: number;
  moneyInCirc: number;
  dirtyMoney?: number;
  avgPlayerWealth: number;
  inflationRate: number;
  timestamp?: string | Date;
}

export interface RecentEvent {
  id: string | number;
  eventType: string;
  timestamp: string;
  positionX?: number | null;
  positionY?: number | null;
  positionZ?: number | null;
  playerName?: string;
  data?: Record<string, unknown>;
  player?: {
    lastUsername?: string | null;
    serial?: string;
  } | null;
}

export interface DashboardStats {
  totalPlayers: number;
  onlinePlayers: number;
  riskAlerts: number;
  recentEvents: RecentEvent[];
  economicSnapshot: EconomicSnapshot;
  serverStatus?: ServerStatus;
  trends: {
    playerGrowth: string;
    onlineTrend: string;
  };
  timestamp: number;
}

export interface OverviewDayPoint {
  name: string;
  earn: number;
  spend: number;
  total: number;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  count: number;
  label?: string;
}

export type TransactionType =
  | 'EARN'
  | 'SPEND'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADMIN_ADD'
  | 'ADMIN_REMOVE';

export interface Transaction {
  id: number | string;
  playerId?: number;
  type: TransactionType;
  amount: number;
  balance: number;
  source: string;
  description?: string | null;
  timestamp: string;
  metadata?: Record<string, unknown> | null;
  player?: {
    id?: number;
    lastUsername?: string | null;
    serial?: string;
  } | null;
}

export interface PlayerSession {
  id: number;
  playerId: number;
  loginAt: string;
  logoutAt?: string | null;
  duration?: number | null;
  ip?: string | null;
}

export interface Player {
  id: number;
  serial: string;
  lastUsername?: string | null;
  totalPlaytime: number;
  firstSeen?: string;
  lastSeen: string;
  isBanned?: boolean;
  riskScore: number;
  money: number;
  bank: number;
  dirtyMoney?: number;
  level: number;
  experience?: number;
  job?: string | null;
  playedTime: number;
  characterId?: number | null;
  thirst?: number;
  hunger?: number;
  premiumPoints?: number;
  faction?: string | null;
  sessions?: PlayerSession[];
  transactions?: Transaction[];
}

export interface PlayerActivityEvent {
  id: string | number;
  timestamp: string;
  eventType: string;
  positionX?: number | null;
  positionY?: number | null;
  positionZ?: number | null;
  data?: Record<string, unknown>;
}

export interface VehicleSaleItem {
  id: string;
  player: string;
  amount: number;
  vehicleName: string;
  timestamp: string;
}

export interface ShopSaleItem {
  id: string;
  player: string;
  amount: number;
  itemName: string;
  timestamp: string;
}

export interface RaceActivityItem {
  id: string;
  player: string;
  type: TransactionType;
  amount: number;
  currency: 'dirty' | 'clean';
  description: string;
  timestamp: string;
}

export interface ResourcesStats {
  vehicleSales: VehicleSaleItem[];
  shopSales: ShopSaleItem[];
  raceActivity: RaceActivityItem[];
  stats: {
    totalRevenue: number;
    vehicleRevenue: number;
    shopRevenue: number;
    raceVolume: number;
    totalTransactions: number;
    vehicleCount: number;
    shopCount: number;
    raceCount: number;
  };
}

export interface FineRecord {
  id: string;
  player: string;
  amount: number;
  reason: string;
  plate: string;
  timestamp: string;
}

export interface TopFinedPlayer {
  username: string;
  totalAmount: number;
  count: number;
}

export interface FinesStats {
  recentFines: FineRecord[];
  topPlayers: TopFinedPlayer[];
  summary: {
    totalFines: number;
    totalAmount: number;
  };
}
