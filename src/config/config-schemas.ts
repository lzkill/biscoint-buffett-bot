import {
  Coin,
  Coins,
  Indicator,
  Indicators,
  Pair,
  Pairs,
  ProfitMode,
  ProfitModes,
  TradePosition,
  TradePositions,
} from '@bot/model';
import * as joi from 'joi';

export const positiveDecimalSchema = joi.number().positive();
export const positiveIntegerSchema = joi.number().positive().precision(0);

export const appSchema = joi.object({
  port: positiveIntegerSchema.default(5000),
});

export const biscointSchema = joi.object({
  apiKey: joi.string().required(),
  apiSecret: joi.string().required(),
  apiUrl: joi.string().default('https://api.biscoint.io/'),
  apiTimeout: positiveIntegerSchema.default(30000),
});

const signalSchema = joi
  .string()
  .valid(...Indicators)
  .insensitive();
export const strategySchema = joi.object({
  name: joi.string().required(),
  pair: joi
    .string()
    .valid(...Pairs)
    .insensitive()
    .required(),
  position: joi
    .string()
    .valid(...TradePositions)
    .insensitive()
    .required(),
  takeProfit: positiveDecimalSchema.required(),
  profitMode: joi
    .string()
    .valid(...ProfitModes)
    .insensitive()
    .required(),
  profitCoin: joi
    .string()
    .valid(...Coins)
    .insensitive()
    .required(),
  closeOnSignal: joi.boolean().default(false),
  entry: {
    volume: positiveDecimalSchema.required(),
    limitPrice: positiveDecimalSchema.empty(0),
    signal: joi.array().items(signalSchema),
    maxSpread: positiveDecimalSchema.empty(0),
  },
  grid: {
    volume: positiveDecimalSchema.required(),
    volumeScale: positiveDecimalSchema.default(1),
    stepSize: positiveDecimalSchema.required(),
    stepScale: positiveDecimalSchema.default(1),
    trades: positiveIntegerSchema.allow(0).required(),
  },
  dryRun: joi.boolean().default(false),
});

const uniqueNamesArraySchema = joi.array().unique((a, b) => a.name === b.name);
export const botSchema = joi.object({
  name: joi.string().required(),
  initPrices: positiveIntegerSchema.allow(0).default(1000),
  portfolio: uniqueNamesArraySchema.items(strategySchema.required()),
  hideKnownErrors: joi.boolean().default(true),
  tradeEnabled: joi.boolean().default(true),
});

export const telegramSchema = joi.object({
  token: joi.string().empty(''),
  chatId: joi.string().empty(''),
  chatEnabled: joi.boolean().default(false),
});

export const papertrailSchema = joi.object({
  token: joi.string().empty(''),
  logEnabled: joi.boolean().default(false),
});

export interface App {
  port: number;
}

export interface Biscoint {
  apiKey: string;
  apiSecret: string;
  apiUrl: string;
  apiTimeout: number;
}

export interface Bot {
  name: string;
  initPrices: number;
  portfolio: Strategy[];
  hideKnownErrors: boolean;
  tradeEnabled: boolean;
}

export interface Strategy {
  name: string;
  pair: Pair;
  position: TradePosition;
  takeProfit: number;
  profitMode: ProfitMode;
  profitCoin: Coin;
  closeOnSignal: boolean;
  entry: {
    volume: number;
    limitPrice?: number;
    signal?: Indicator[];
    maxSpread?: number;
  };
  grid: {
    volume: number;
    volumeScale: number;
    stepSize: number;
    stepScale: number;
    trades: number;
  };
  dryRun: boolean;
}

export interface Telegram {
  token?: string;
  chatId?: string;
  chatEnabled: boolean;
}

export interface Papertrail {
  token?: string;
  logEnabled: boolean;
}
