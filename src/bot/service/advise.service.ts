import { Coin, Indicator, Indicators } from '@bot/model';
import { Price } from '@bot/model/price.entity';
import { Strategy } from '@config/config-schemas';
import { AppConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { baseCoin } from '@shared/helper';
import MultikeyMap from 'multikey-map';
import { Advisor } from './advisor/advisor.interface';
import { BollingerAdvisor } from './advisor/bollinger';
import { MacdAdvisor } from './advisor/macd';
import { RsiAdvisor } from './advisor/rsi';

@Injectable()
export class AdviseService {
  private advisors = new MultikeyMap<[Coin, Indicator], Advisor | undefined>();

  constructor(private config: AppConfigService) {
    this.initAdvisors();
  }

  private initAdvisors() {
    for (const strategy of this.config.bot.portfolio) {
      const base = baseCoin(strategy.pair);
      if (strategy.entry.signal) {
        for (const indicator of strategy.entry.signal) {
          if (indicator === 'macd')
            this.advisors.set([base, indicator], new MacdAdvisor());
          if (indicator === 'rsi')
            this.advisors.set([base, indicator], new RsiAdvisor());
          if (indicator === 'bollinger')
            this.advisors.set(
              [base, indicator],
              new BollingerAdvisor(),
            );
        }
      }
    }
  }

  update(coin: Coin, price: Price | Price[]) {
    for (const indicator of Indicators) {
      const advisor = this.advisors.get([coin, indicator]);
      if (advisor) {
        if (Array.isArray(price))
          for (const _price of price) {
            advisor.update(_price);
          }
        else advisor.update(price);
      }
    }
  }

  shouldBuy(strategy: Strategy): boolean {
    const base = baseCoin(strategy.pair);
    let shouldBuy = true;
    if (strategy.entry.signal) {
      for (const indicator of strategy.entry.signal) {
        const advisor = this.advisors.get([base, indicator]);
        shouldBuy &&= advisor.shouldBuy();
      }
    }
    return shouldBuy;
  }

  shouldSell(strategy: Strategy): boolean {
    const base = baseCoin(strategy.pair);
    let shouldSell = true;
    if (strategy.entry.signal) {
      for (const indicator of strategy.entry.signal) {
        const advisor = this.advisors.get([base, indicator]);
        shouldSell &&= advisor.shouldSell();
      }
    }
    return shouldSell;
  }

  isCalibrated(strategy: Strategy): boolean {
    const base = baseCoin(strategy.pair);
    let isCalibrated = true;
    if (strategy.entry.signal) {
      for (const indicator of strategy.entry.signal) {
        const advisor = this.advisors.get([base, indicator]);
        isCalibrated &&= advisor.isCalibrated();
      }
    }
    return isCalibrated;
  }
}
