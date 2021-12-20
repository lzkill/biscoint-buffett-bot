import { AppConfigService } from '@config/config.service';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AppLoggerService {
  private logger = new Logger('Bot');

  constructor(
    private config: AppConfigService,
    private emitter: EventEmitter2,
  ) {}

  error(message: any, context?: string) {
    // 5103: Offer expired or not found
    // 5108: Offer unavailable at this moment
    // 5111: Offer not available anymore
    // 5112: Insufficient funds
    // 5113: Offer amount is off limits
    const isHiddenBiscointError =
      message.code == 5103 ||
      message.code == 5108 ||
      message.code == 5111 ||
      message.code == 5112 ||
      message.code == 5113;

    const shouldHideError =
      isHiddenBiscointError && this.config.bot.hideKnownErrors;

    if (!shouldHideError) {
      if (context) this.logger.error(message, null, context);
      else this.logger.error(message);
      this.emitter.emit('trade.error', message);
    }
  }

  log(message: any, context?: string) {
    if (context) this.logger.log(message, context);
    else this.logger.log(message);
  }
}
