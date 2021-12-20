export const BOT_BASE_TIMEFRAME_MS = process.env.BOT_BASE_TIMEFRAME_MS
  ? parseInt(process.env.BOT_BASE_TIMEFRAME_MS)
  : 60000;

export const BOT_QUOTE_AMOUNT_REF = 1000;
export const BOT_MIN_BUY_VOLUME_BRL = 50;
export const BOT_MIN_SELL_VOLUME_BTC = 0.0001;
export const BOT_MIN_SELL_VOLUME_ETH = 0.001;
