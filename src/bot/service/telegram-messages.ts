import { Trade } from '@bot/model';
import { stringify } from '@shared/helper';
import { IBalanceResult } from 'biscoint-api-node/dist/typings/biscoint';

const emoji = require('node-emoji');
const humanizeDuration = require('humanize-duration');

interface FractionDigits {
  [symbol: string]: number;
}

const coinDigits: FractionDigits = {
  BRL: 2,
  BTC: 8,
  ETH: 8,
};

export function formatWelcomeMessage() {
  const prefix = `${emoji.get(':dollar:')} `;
  return `${prefix}Welcome to the ${bold('Biscoint Buffett Bot')}!`;
}

export function formatHelpMessage() {
  const prefix = emoji.get(':bulb:');
  return `${prefix}${bold('Available commands:')}

  - /bbb_start nothing really useful
  - /bbb_get_balance get the current balance
  - /bbb_get_config get the bot config
  - /bbb_get_trades get the open trades
  - /bbb_set_chat_on enable the trade chat
  - /bbb_set_chat_off disable the trade chat
  - /bbb_set_trade_on enable the trading algorithm
  - /bbb_set_trade_off disable the trading algorithm
  - /bbb_clear_trades discards all open trades
  - /bbb_refresh_balance refresh with broker info
  - /bbb_ping pong back
  - /bbb_help show this message`;
}

export function formatTradeTurnedOnMessage() {
  const message = `Trade turned ${bold('on')}`;
  return formatGeneralInfoMessage(message);
}

export function formatTradeTurnedOffMessage() {
  const message = `Trade turned ${bold('off')}`;
  return formatGeneralInfoMessage(message);
}

export function formatChatTurnedOnMessage() {
  const message = `Trade chat turned ${bold('on')}`;
  return formatGeneralInfoMessage(message);
}

export function formatChatTurnedOffMessage() {
  const message = `Trade chat turned ${bold('off')}`;
  return formatGeneralInfoMessage(message);
}

export function formatTradesClearedMessage(cleared: number) {
  if (!cleared) return formatNoOpenTradesMessage();
  const message = `Open trades cleared: ${cleared}`;
  return formatGeneralInfoMessage(message);
}

export function formatNoOpenTradesMessage() {
  const message = 'There are no open trades';
  return formatGeneralInfoMessage(message);
}

export function formatPingMessage() {
  const message = 'Pong';
  return formatGeneralInfoMessage(message);
}

export function formatGeneralInfoMessage(message: string) {
  const prefix = emoji.get(':grey_exclamation:');
  return `${prefix}${message}`;
}

export function formatTradeOpenedMessage(trade: Trade) {
  const prefix = `${emoji.get(':white_circle:')} `;

  let title = `Trade #${trade.id} opened:`;
  title = trade.dryRun ? `[Simulation] ${title}` : title;

  const operation = trade.position === 'long' ? 'buy' : 'sell';

  return `${prefix}${bold(title)}${'\n'}
  ${bold('Strategy:')} ${trade.strategy}
  ${bold('Position:')} ${trade.position}
  ${bold('Operation:')} ${operation}
  ${bold('Type:')} ${trade.type}
  ${bold('Base:')} ${trade.baseAmount} ${trade.base}
  ${bold('Quote:')} ${trade.quoteAmount} ${trade.quote}
  ${bold('EfPrice:')} ${trade.efPrice}
  ${bold('Open offer:')} ${trade.offerId}`;
}

export function formatTradeClosedMessage(trade: Trade) {
  const profit = trade.profit();

  let prefix: string;
  let profitTitle: string;
  if (profit.perc < 0) {
    prefix =
      trade.profitMode === 'dca'
        ? `${emoji.get(':large_yellow_circle:')} `
        : `${emoji.get(':red_circle:')} `;
    profitTitle = 'Loss:';
  } else {
    prefix = `${emoji.get(':large_green_circle:')} `;
    profitTitle = 'Profit:';
  }

  let title = `Trade #${trade.id} closed:`;
  title = trade.dryRun ? `[Simulation] ${title}` : title;

  const operation = trade.position === 'long' ? 'sell' : 'buy';
  const profitAbs = profit.abs.toFixed(coinDigits[profit.coin]);
  const profitPerc = profit.perc.toFixed(2);
  const createdAt = new Date(trade.createdAt).getTime();
  const closedAt = new Date(trade.closedAt).getTime();
  const duration = humanizeDuration(closedAt - createdAt, { largest: 2 });

  return `${prefix}${bold(title)}${'\n'}
  ${bold('Strategy:')} ${trade.strategy}
  ${bold('Position:')} ${trade.position}
  ${bold('Operation:')} ${operation}
  ${bold('Type:')} ${trade.type}
  ${bold('Base:')} ${trade.closeBaseAmount} ${trade.base}
  ${bold('Quote:')} ${trade.closeQuoteAmount} ${trade.quote}
  ${bold('EfPrice:')} ${trade.closeEfPrice}
  ${bold(profitTitle)} ${profitAbs} ${profit.coin} (${profitPerc}%)
  ${bold('Profit mode:')} ${trade.profitMode}
  ${bold('Duration:')} ${duration}
  ${bold('Open offer:')} ${strike(trade.offerId)}
  ${bold('Close offer:')} ${trade.closeOfferId}`;
}

export function formatTradeBalancedMessage(balance: IBalanceResult) {
  const prefix = `${emoji.get(':blue_circle:')} `;
  const title = `Trade balanced:`;
  return `${prefix}${bold(title)}${'\n'}
  ${stringify(balance)}`;
}

export function formatBalanceRefreshedMessage(balance: IBalanceResult) {
  const prefix = `${emoji.get(':grey_exclamation:')} `;
  const title = `Balance refreshed:`;
  return `${prefix}${bold(title)}${'\n'}
  ${stringify(balance)}`;
}

function bold(text: string) {
  return `<b>${text}</b>`;
}

function strike(text: string) {
  return `<strike>${text}</strike>`;
}
