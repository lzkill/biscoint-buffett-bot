import { Price } from '@bot/model/price.entity';
import { EMA, RSI } from 'trading-signals';
import { Advisor } from './advisor.interface';

export class RsiAdvisor implements Advisor {
  private buyRsi = new RSI(100, EMA);
  private sellRsi = new RSI(100, EMA);

  private timeframeCount = 1;
  private timeframeOffset = 0;

  update(price: Price) {
    if (price && this.timeframeCount % this.timeframeOffset == 0) {
      this.buyRsi.update(price.buyEfPrice);
      this.sellRsi.update(price.sellEfPrice);
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
    return this.buyRsi.isStable && this.sellRsi.isStable;
  }
}
