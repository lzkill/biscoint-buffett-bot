import { Trade } from '@bot/model';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IBalanceResult } from 'biscoint-api-node/dist/typings/biscoint';
import {
  formatTradeBalancedMessage,
  formatTradeClosedMessage,
  formatTradeOpenedMessage,
} from './telegram-messages';
import { TelegramService } from './telegram.service';

@Injectable()
export class EventListener {
  constructor(private telegram: TelegramService) {}

  @OnEvent('trade.opened', { async: true })
  async handleTradeOpenedEvent(trade: Trade) {
    const message = formatTradeOpenedMessage(trade);
    await this.telegram.sendMessage(message);
  }

  @OnEvent('trade.closed', { async: true })
  async handleTradeClosedEvent(trade: Trade) {
    const message = formatTradeClosedMessage(trade);
    await this.telegram.sendMessage(message);
  }

  @OnEvent('trade.balanced', { async: true })
  async handleTradeBalancedEvent(balance: IBalanceResult) {
    const message = formatTradeBalancedMessage(balance);
    await this.telegram.sendMessage(message);
  }
}
