import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PapertrailService } from './papertrail.service';

@Injectable()
export class EventListener {
  constructor(private papertrail: PapertrailService) {}

  @OnEvent('trade.error', { async: true })
  async handleTradeErrorEvent(message: any) {
    const formatted = this.formatPapertrailMessage(message);
    await this.papertrail.sendMessage(formatted);
  }

  private formatPapertrailMessage(message: any) {
    return JSON.stringify(message);
  }
}
