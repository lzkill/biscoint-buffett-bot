export const Coins = ['BTC', 'ETH', 'BRL'] as const;
export type Coin = typeof Coins[number];

export const Pairs = ['BTC-BRL', 'ETH-BRL', 'BRL-BTC', 'BRL-ETH'] as const;
export type Pair = typeof Pairs[number];

export const Operations = ['buy', 'sell'] as const;
export type Operation = typeof Operations[number];

export const Indicators = ['macd', 'rsi', 'bollinger'] as const;
export type Indicator = typeof Indicators[number];

export const ProfitModes = ['dca', 'grid'] as const;
export type ProfitMode = typeof ProfitModes[number];

export const TradePositions = ['long', 'short'] as const;
export type TradePosition = typeof TradePositions[number];

export const TradeStatuses = ['open', 'closed'] as const;
export type TradeStatus = typeof TradeStatuses[number];

export const TradeTypes = ['entry', 'grid'] as const;
export type TradeType = typeof TradeTypes[number];
