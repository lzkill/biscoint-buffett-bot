import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { baseCoin } from '@shared/helper';
import { App, Biscoint, Bot, Papertrail, Telegram } from './config-schemas';

@Injectable()
export class AppConfigService {
  app: App;
  biscoint: Biscoint;
  bot: Bot;
  telegram: Telegram;
  papertrail: Papertrail;

  constructor(private config: ConfigService) {
    this.app = config.get<App>('app');
    this.biscoint = config.get<Biscoint>('biscoint');
    this.bot = config.get<Bot>('bot');
    this.telegram = config.get<Telegram>('telegram');
    this.papertrail = config.get<Papertrail>('papertrail');

    // TODO Tratar case das configs
  }

  coins() {
    const coins = this.bot.portfolio.map((strategy) => baseCoin(strategy.pair));
    return [...new Set(coins)];
  }
}
