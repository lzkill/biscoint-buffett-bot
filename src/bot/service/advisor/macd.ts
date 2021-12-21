import { Price } from '@bot/model/price.entity';
import { EMA, MACD } from 'trading-signals';
import { Advisor } from './advisor.interface';

export class MacdAdvisor implements Advisor {
  private buyMacd = new MACD({
    indicator: EMA,
    longInterval: 26,
    shortInterval: 12,
    signalInterval: 9,
  });
  private sellMacd = new MACD({
    indicator: EMA,
    longInterval: 26,
    shortInterval: 12,
    signalInterval: 9,
  });

  private timeframeCount = 1;
  private timeframeOffset = 0;

  update(price: Price) {
    if (price && this.timeframeCount % this.timeframeOffset == 0) {
      this.buyMacd.update(price.buyEfPrice);
      this.sellMacd.update(price.sellEfPrice);
    }

    this.timeframeCount += 1;
  }

  shouldBuy(): boolean {
    throw new Error('Method not implemented.');
  }

  shouldSell(): boolean {
    throw new Error('Method not implemented.');
  }

  isCalibrated(): boolean {
    return this.buyMacd.isStable && this.sellMacd.isStable;
  }
}
