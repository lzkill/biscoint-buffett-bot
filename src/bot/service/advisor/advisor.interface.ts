import { Price } from '@bot/model/price.entity';

export interface Advisor {
  update(price: Price): void;
  shouldBuy(): boolean;
  shouldSell(): boolean;
  isCalibrated(): boolean;
}
