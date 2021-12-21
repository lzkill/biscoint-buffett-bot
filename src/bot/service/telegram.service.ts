import { AppConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { stringify } from '@shared/helper';
import Bottleneck from 'bottleneck';
import { AppLoggerService } from 'src/logger/logger.service';
import { Telegraf } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { BalanceService } from './balance.service';
import { DatabaseService } from './database.service';
import {
  formatBalanceRefreshedMessage,
  formatChatTurnedOffMessage,
  formatChatTurnedOnMessage,
  formatHelpMessage,
  formatNoOpenTradesMessage,
  formatPingMessage,
  formatTradesClearedMessage,
  formatTradeTurnedOffMessage,
  formatTradeTurnedOnMessage,
  formatWelcomeMessage,
} from './telegram-messages';

@Injectable()
export class TelegramService {
  private bot: Telegraf;
  private limiter: Bottleneck;

  constructor(
    private config: AppConfigService,
    private logger: AppLoggerService,
    private balance: BalanceService,
    private database: DatabaseService,
  ) {
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 100,
    });

    if (this.config.telegram.token) {
      this.bot = new Telegraf(this.config.telegram.token);
    }
  }

  async init() {
    if (this.config.telegram.token) {
      this.bot.command('bbb_start', async (ctx) => {
        try {
          const message = formatWelcomeMessage();
          await this.sendMessage(message, ctx.chat.id).then(() => {
            return this.sendMessage(formatHelpMessage(), ctx.chat.id);
          });
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_get_balance', async (ctx) => {
        try {
          const message = stringify(this.balance.getFullBalance());
          await this.sendMessage(message, ctx.chat.id, false);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_get_config', async (ctx) => {
        try {
          const message = stringify(this.config.bot);
          await this.sendMessage(message, ctx.chat.id, false);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_get_trades', async (ctx) => {
        try {
          const trades = await this.database.findOpenTrades();
          if (!trades.length) {
            const message = formatNoOpenTradesMessage();
            await this.sendMessage(message, ctx.chat.id);
          } else {
            for (const trade of trades) {
              await this.sendMessage(stringify(trade), ctx.chat.id, false);
            }
          }
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_set_chat_on', async (ctx) => {
        try {
          this.config.telegram.chatEnabled = true;
          const message = formatChatTurnedOnMessage();
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_set_chat_off', async (ctx) => {
        try {
          this.config.telegram.chatEnabled = false;
          const message = formatChatTurnedOffMessage();
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_set_trade_on', async (ctx) => {
        try {
          this.config.bot.tradeEnabled = true;
          const message = formatTradeTurnedOnMessage();
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_set_trade_off', async (ctx) => {
        try {
          this.config.bot.tradeEnabled = false;
          const message = formatTradeTurnedOffMessage();
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_clear_trades', async (ctx) => {
        try {
          const result = await this.database.deleteAllOpenTrades();
          const deleted = result.affected;
          const message = formatTradesClearedMessage(deleted);
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_refresh_balance', async (ctx) => {
        try {
          const balance = await this.balance.refresh();
          const message = formatBalanceRefreshedMessage(balance);
          await this.sendMessage(message, ctx.chat.id, false);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_ping', async (ctx) => {
        try {
          const message = formatPingMessage();
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bbb_help', async (ctx) => {
        try {
          const message = formatHelpMessage();
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      try {
        this.bot.launch();
        this.logger.log(`Telegram bot launched`);
      } catch (e) {
        this.logger.error(e);
      }
    }
  }

  async sendMessage(message: string, chatId?: any, removeWhiteSpaces = true) {
    try {
      if (this.canChat() && this.config.telegram.chatEnabled) {
        let formatted = message.trim();
        if (removeWhiteSpaces) formatted = this.removeWhiteSpaces(formatted);
        return await this.limiter.schedule(() =>
          this.bot.telegram.sendMessage(
            chatId ? chatId : this.config.telegram.chatId,
            formatted,
            {
              parse_mode: 'HTML',
            },
          ),
        );
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  async pinMessage(message: Message.TextMessage) {
    try {
      return this.bot.telegram.pinChatMessage(
        message.chat.id,
        message.message_id,
        { disable_notification: true },
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  async unpinMessage(messageId: number, chatId?: any) {
    try {
      return this.bot.telegram.unpinChatMessage(
        chatId ? chatId : this.config.telegram.chatId,
        messageId,
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  private canChat() {
    return this.config.telegram.chatId;
  }

  private removeWhiteSpaces(multiline: string) {
    return multiline
      .split(/\r?\n/)
      .map((row) => row.trim().split(/\s+/).join(' '))
      .join('\n');
  }
}
