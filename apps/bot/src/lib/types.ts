export interface PlayerStats {
  strategicIq: number;
  militaryKnowledge: number;
  diplomaticSkill: number;
  economicAcumen: number;
  leadership: number;
  loyalty: number;
  religiousKnowledge: number;
  financeSkill: number;
  intelligenceOps: number;
  propagandaSkill: number;
  totalScore: number;
  warBonds: number;
  commandPoints: number;
  reputation: number;
  nation?: string;
  role?: string;
}

export interface PlayerWallet {
  warBonds: number;
  commandPoints: number;
  totalDeposited: number;
  totalWithdrawn: number;
  pendingWithdrawal: number;
}

export interface Player {
  userId: string;
  telegramId: string;      // ← added — used across all routes
  email: string;
  username: string | null;
  firstName: string;
  lastName?: string;
  currentRole: string | null;
  currentNation: string | null;
  currentFaction: string | null;
  ideology: string | null;
  role?: string;
  nationId?: string;
  stats: PlayerStats;
  wallet: PlayerWallet;
  reputation: number;
  achievements: string[];
  referralCode: string;
  referredBy: string | null;
  hoursPlayed: number;
  isNPC: boolean;
  npcPersonality?: string;
  kycVerified?: boolean;
  joinedAt?: number;
  createdAt: any;
  lastActive: any;
  referralCount?: number;
  referralCpEarned?: number;
}

export interface Nation {
  id: string;
  name: string;
  flag: string;
  capital: string;
  continent: string;
  gdp: number;
  militaryBudget: number;
  population: number;
  ideology: string;
  governmentType: string;
  stability: number;
  morale: number;
  militaryStrength: number;
  nuclearWeapons: number;
  alliances: string[];
  atWarWith: string[];
  sanctionedBy: string[];
  playerCount: number;
  territories: string[];
  occupiedBy: string | null;
  occupationLevel: 'none' | 'occupied' | 'annexed' | 'puppet';
  resistanceMeter: number;
  treasury: { warBonds: number; commandPoints: number; };
  stockPrice: number;
  updatedAt: any;
}

export interface RoleApplication {
  playerId: string;
  roleName: string;
  nationId: string;
  ideology: string;
  statement: string;
  aiScore: number;
  aiDecision: 'accepted' | 'rejected' | 'waitlisted';
  aiReason: string;
  alternativeRole: string | null;
  status: string;
  createdAt: any;
}

export interface WorldEvent {
  id?: string;
  type: 'military' | 'economic' | 'diplomatic' | 'election' | 'disaster' | 'religious' | 'revolution' | 'nuclear' | 'pandemic' | 'space' | 'conquest' | 'resistance' | 'war' | 'politics';
  title: string;
  description: string;
  affectedNations: string[];
  timestamp?: number;
  fromNews: boolean;
  expiresAt: any;
  effects?: {
    stability_change?: number;
    gdp_modifier?: number;
    military_change?: number;
    resistance_change?: number;
    global_oil_change?: number;
  };
  createdAt?: any;
}

export interface War {
  id?: string;
  aggressor: string;
  defender: string;
  aggressorName?: string;
  defenderName?: string;
  coalitionAggressor: string[];
  coalitionDefender: string[];
  status: 'active' | 'ceasefire' | 'ended' | 'peace';
  currentRound: number;
  warScore: number;
  startedAt: any;
  endedAt?: number;
  winner?: string | null;
  aggressorScore: number;
  defenderScore: number;
  casualties: { aggressor: number; defender: number; };
  warCrimes: boolean;
  nuclearUsed: boolean;
  peaceProposedBy?: string;
  peaceProposedAt?: number;
}

export interface CryptoTransaction {
  playerId: string;
  type: 'deposit' | 'withdrawal' | 'DEPOSIT';
  crypto?: 'TON' | 'USDT_TRC20';
  currency?: 'TON' | 'USDT_TRC20';
  cryptoAmount?: number;
  amount?: number;
  wrbAmount?: number;
  wrbCredited?: number;
  usdEquivalent?: number;
  txHash: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  createdAt?: any;
  confirmedAt?: any | null;
  timestamp?: number;
}

export interface NPCDecision {
  nationId: string;
  role: string;
  decision: string;
  reasoning: string;
  target?: string;
  timestamp: any;
}

export interface Territory {
  id: string;
  name: string;
  controlledBy: string | null;
  contestedBy: string[];
  resourceType: string;
  resourceBonus: string;
  strategicValue: number;
  extractionEfficiency: number;
  sabotaged: boolean;
}

export interface SpyMission {
  agentId: string;
  targetNation: string;
  missionType: string;
  status: 'active' | 'success' | 'failed' | 'intercepted';
  startedAt: any;
  completesAt: any;
  reward?: any;
}

export interface Election {
  nationId: string;
  candidates: string[];
  votes: Record<string, number>;
  status: 'active' | 'completed';
  startedAt: any;
  endsAt: any;
  winnerId: string | null;
  isCoupAttempted: boolean;
}

export interface Stock {
  companyId: string;
  name: string;
  price: number;
  priceHistory: number[];
  sector: string;
  nationId: string;
  affectedBy: string[];
  lastUpdated: any;
}

export interface MarketListing {
  id?: string;
  sellerId: string;
  itemId: string;
  itemName: string;
  currency: 'WRB' | 'CP';
  price: number;
  status: 'active' | 'sold' | 'expired';
  createdAt: any;
  expiresAt: any;
}
