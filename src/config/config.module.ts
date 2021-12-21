import { AppConfigService } from '@config/config.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
