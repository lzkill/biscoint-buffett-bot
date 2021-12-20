import { AppConfigService } from '@config/config.service';
import { Injectable, Logger } from '@nestjs/common';
import { SimplePapertrailLogger } from 'simple-papertrail-logger';

@Injectable()
export class PapertrailService {
  // The only place where Nextjs Logger is allowed
  private logger = new Logger(this.constructor.name);

  private papertrail: SimplePapertrailLogger;

  constructor(private config: AppConfigService) {
    this.papertrail = new SimplePapertrailLogger({
      papertrailToken: config.papertrail.token,
      logIdentifier: config.bot.name,
    });
  }

  async sendMessage(message: any) {
    try {
      if (this.canLog()) {
        this.papertrail.addMessage(message);
        return this.papertrail.sendMessages(false);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private canLog() {
    return this.config.papertrail.logEnabled && this.config.papertrail.token;
  }
}
