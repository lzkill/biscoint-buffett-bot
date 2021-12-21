import { AppConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';
import { EventListener } from './event-listener';
import { AppLoggerService } from './logger.service';
import { PapertrailService } from './papertrail.service';

@Module({
  imports: [AppConfigModule],
  providers: [AppLoggerService, PapertrailService, EventListener],
  exports: [AppLoggerService],
})
export class AppLoggerModule {}
