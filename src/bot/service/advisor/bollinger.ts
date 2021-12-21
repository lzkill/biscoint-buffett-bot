import { Price } from '@bot/model/price.entity';
import { BollingerBands } from 'trading-signals';
import { Advisor } from './advisor.interface';

export class BollingerAdvisor implements Advisor {
  private buyBollinger = new BollingerBands(90, 2);
  private sellBollinger = new BollingerBands(90, 2);

  private timeframeCount = 1;
  private timeframeOffset = 0;

  update(price: Price) {
    if (price && this.timeframeCount % this.timeframeOffset == 0) {
      this.buyBollinger.update(price.buyEfPrice);
      this.sellBollinger.update(price.sellEfPrice);
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
    return this.buyBollinger.isStable && this.sellBollinger.isStable;
  }
}
