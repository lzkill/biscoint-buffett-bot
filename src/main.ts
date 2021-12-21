import { BiscointService } from '@bot/service/biscoint.service';
import { TelegramService } from '@bot/service/telegram.service';
import { TradeService } from '@bot/service/trade.service';
import { AppConfigService } from '@config/config.service';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import loaders from './loader';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await loaders(app);

  const config = app.get(AppConfigService);
  await app.listen(config.app.port);

  const telegram = app.get(TelegramService);
  await telegram.init();

  const biscoint = app.get(BiscointService);
  await biscoint.init();

  const tradeService = app.get(TradeService);
  await tradeService.startTrading();
}

bootstrap();
