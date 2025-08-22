import { Request } from 'express';
import { ObjectId } from 'mongodb';

// Auth related types
export interface User {
  _id: ObjectId;
  username: string;
  password: string;
  createdAt: Date;
  active: boolean;
}

export interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user: JWTPayload;
}

// Market related types
export interface Market {
  _id: ObjectId;
  id?: string;
  question: string;
  slug?: string;
  description?: string;
  outcomes?: string[];
  outcomePrices?: string[];
  clobRewards?: {
    rewardsDailyRate: string;
  }[];
  rewardsMinSize?: string;
  rewardsMaxSpread?: string;
  spread?: string;
  endDate?: Date | string | number;
  volumeNum?: number;
  liquidityNum?: number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  monitored?: boolean;
}

export interface FormattedMarket {
  id: string;
  question: string;
  reward: string;
  minSize: string;
  maxSpread: string;
  spread: string;
  endDate: string;
  volume: string;
  liquidity: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  monitored: boolean;
  slug: string;
  description: string;
  outcomes: string[];
  outcomePrices: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search: string;
    status: string;
    sortBy: string;
    sortOrder: string;
  };
}

// Query parameters
export interface MarketsQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: 'all' | 'active' | 'closed' | 'archived';
  sortBy?: 'reward' | 'volume' | 'liquidity' | 'minSize' | 'maxSpread' | 'endDate' | 'question';
  sortOrder?: 'asc' | 'desc';
}

export interface TopMarketsQueryParams {
  limit?: string;
}

// Environment variables
export interface ServerConfig {
  PORT: number;
  MONGO_URI: string;
  MONGO_DB: string;
  MONGO_COLLECTION: string;
  USERS_COLLECTION: string;
  JWT_SECRET: string;
  SESSION_SECRET: string;
  FRONTEND_URL: string;
  NODE_ENV: string;
}