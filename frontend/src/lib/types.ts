export interface Player {
    id: number;
    serial: string;
    lastUsername?: string;
    totalPlaytime: number;
    firstSeen: string;
    lastSeen: string;
    isBanned: boolean;
    riskScore: number;
    money: number;
    bank: number;
    level: number;
    experience: number;
    job?: string;
    playedTime: number;
    characterId?: number;
    thirst: number;
    hunger: number;
    premiumPoints: number;
    faction?: string;
    sessions?: PlayerSession[];
    transactions?: Transaction[];
}

export interface PlayerSession {
    id: number;
    playerId: number;
    loginAt: string;
    logoutAt?: string;
    ip?: string;
    positionX?: number;
    positionY?: number;
    positionZ?: number;
}

export interface Transaction {
    id: number;
    playerId: number;
    type: 'EARN' | 'SPEND' | 'TRANSFER_IN' | 'TRANSFER_OUT';
    amount: number;
    balance: number;
    source: string;
    description?: string;
    timestamp: string;
    metadata?: any;
}
