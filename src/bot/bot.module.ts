import { AppConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggerModule } from 'src/logger/logger.module';
import { Trade } from './model';
import { Price } from './model/price.entity';
import { AdviseService } from './service/advise.service';
import { BalanceService } from './service/balance.service';
import { BiscointService } from './service/biscoint.service';
import { DatabaseService } from './service/database.service';
import { EventListener } from './service/event-listener';
import { TelegramService } from './service/telegram.service';
import { TradeService } from './service/trade.service';

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    TypeOrmModule.forFeature([Trade, Price]),
  ],
  providers: [
    BiscointService,
    DatabaseService,
    TelegramService,
    TradeService,
    BalanceService,
    AdviseService,
    EventListener,
  ],
  controllers: [],
})
export class BotModule {}
