import { Coin, ProfitMode, Trade, TradeMapper, TradeType } from '@bot/model';
import { Price } from '@bot/model/price.entity';
import { Strategy } from '@config/config-schemas';
import { AppConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { baseCoin, percent, terminate } from '@shared/helper';
import { IOfferResult } from 'biscoint-api-node/dist/typings/biscoint';
import * as _ from 'lodash';
import {
  BOT_BASE_TIMEFRAME_MS,
  BOT_MIN_BUY_VOLUME_BRL,
  BOT_MIN_SELL_VOLUME_BTC,
  BOT_MIN_SELL_VOLUME_ETH,
  BOT_QUOTE_AMOUNT_REF,
} from 'src/app.constants';
import { AppLoggerService } from '../../logger/logger.service';
import { AdviseService } from './advise.service';
import { BalanceService } from './balance.service';
import { BiscointService } from './biscoint.service';
import { DatabaseService } from './database.service';

@Injectable()
export class TradeService {
  private coins: Coin[];
  private cycleCount = 1;

  constructor(
    private config: AppConfigService,
    private logger: AppLoggerService,
    private balance: BalanceService,
    private biscoint: BiscointService,
    private database: DatabaseService,
    private advisor: AdviseService,
    private emitter: EventEmitter2,
  ) {
    this.coins = this.config.coins();
  }

  async startTrading() {
    if (this.config.bot.initPrices) this.initPortfolio();

    await this.refreshBalance();

    this.logger.log(
      `Trading started on ${BOT_BASE_TIMEFRAME_MS}ms base timeframe`,
    );
    await this.tradeCycle();
  }

  private async refreshBalance() {
    try {
      await this.balance.refresh();
    } catch (e) {
      this.logger.error(e);
      terminate();
    }
  }

  private async initPortfolio() {
    try {
      for (const coin of this.coins) {
        const prices = await this.database.findPriceHistory(
          coin,
          this.config.bot.initPrices,
        );
        this.advisor.update(coin, prices);
      }
    } catch (e) {
      this.logger.error(e);
      terminate();
    }
  }

  async tradeCycle() {
    try {
      const startedAt = Date.now();
      const prices = await this.getCurrentPrices();
      this.updateAdvisor(prices);

      if (this.config.bot.tradeEnabled) await this.runPortfolio(prices);

      const finishedAt = Date.now();
      const elapsedMs = finishedAt - startedAt;

      this.logger.log(
        `${this.config.bot.tradeEnabled ? 'Trade' : 'Update'} cycle #${
          this.cycleCount
        } took ${elapsedMs.toFixed(2)}ms`,
      );

      await this.savePrices(prices);

      this.cycleCount += 1;

      const timeoutMs = Math.max(BOT_BASE_TIMEFRAME_MS - elapsedMs, 0);
      setTimeout(this.tradeCycle.bind(this), timeoutMs);
    } catch (e) {
      this.logger.error(e);
    }
  }

  private async getCurrentPrices(): Promise<Price[]> {
    const prices: Price[] = [];
    for (const coin of this.coins) {
      try {
        const buyPrice = await this.biscoint.efPrice(
          coin,
          'buy',
          BOT_QUOTE_AMOUNT_REF,
        );
        const sellPrice = await this.biscoint.efPrice(
          coin,
          'sell',
          BOT_QUOTE_AMOUNT_REF,
        );

        if (buyPrice && sellPrice) {
          const price = this.createPrice(coin, buyPrice, sellPrice);
          prices.push(price);
        }
      } catch (e) {
        this.logger.error(e);
      }
    }

    return prices;
  }

  private createPrice(base: Coin, buyEfPrice: string, sellEfPrice: string) {
    const price = new Price();
    price.base = base;
    price.buyEfPrice = buyEfPrice;
    price.sellEfPrice = sellEfPrice;
    price.quoteAmountRef = BOT_QUOTE_AMOUNT_REF.toString();
    price.timestamp = new Date();
    return price;
  }

  private updateAdvisor(prices: Price[]) {
    try {
      for (const coin of this.coins) {
        const price = _.find(prices, function (p) {
          return p.base === coin;
        });
        this.advisor.update(coin, price);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  async runPortfolio(prices: Price[]) {
    for (const strategy of _.shuffle(this.config.bot.portfolio)) {
      const price: Price = _.find(prices, function (p) {
        return p.base === baseCoin(strategy.pair);
      });

      if (price) this.runStrategy(strategy, price);
    }
  }

  private async runStrategy(strategy: Strategy, price: Price) {
    try {
      await this.checkTakeProfit(strategy, price);

      const lastOpenTrade = await this.database.findLastOpenTradeByStrategy(
        strategy,
      );
      if (!lastOpenTrade) this.checkEntryTrade(strategy, price);
      else this.checkGridTrade(strategy, price, lastOpenTrade);
    } catch (e) {
      this.logger.error(e);
    }
  }

  private async checkTakeProfit(strategy: Strategy, price: Price) {
    try {
      let openTrades = await this.database.findOpenTradesByStrategy(strategy);
      if (openTrades.length) {
        const refPrice = this.getRefPrice(strategy, price, true);

        const breakEvenPrice = this.getBreakEvenPrice(openTrades);

        const spreadToBreakEven =
          strategy.position === 'long'
            ? percent(breakEvenPrice, refPrice)
            : percent(refPrice, breakEvenPrice);

        const shouldCloseTrade = this.shouldCloseTrade(strategy);

        openTrades = _.orderBy(openTrades, ['createdAt'], ['desc']);
        for (const trade of openTrades) {
          let spread: number;
          if (strategy.profitMode === 'grid') {
            spread =
              strategy.position === 'long'
                ? percent(+trade.efPrice, refPrice)
                : percent(refPrice, +trade.efPrice);
          } else spread = spreadToBreakEven;

          if (shouldCloseTrade && spread >= strategy.takeProfit) {
            const volume =
              strategy.profitCoin === 'BRL'
                ? +trade.baseAmount
                : +trade.quoteAmount;
            const volumeCoin =
              strategy.profitCoin === 'BRL' ? baseCoin(strategy.pair) : 'BRL';

            const offer =
              strategy.position === 'long'
                ? await this.sell(strategy, volume, volumeCoin, refPrice)
                : await this.buy(strategy, volume, volumeCoin, refPrice);
            if (offer) {
              await this.closeTrade(trade, offer, strategy.profitMode);
              this.updateVolume(strategy, trade);
              await this.checkTradeBalanced();
            } else break;
          }
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private getBreakEvenPrice(trades: Trade[]) {
    const totalQuoteAmount = trades
      .map((trade) => +trade.quoteAmount)
      .reduce((a, b) => a + b);
    const totalBaseAmount = trades
      .map((trade) => +trade.baseAmount)
      .reduce((a, b) => a + b);
    return totalQuoteAmount / totalBaseAmount;
  }

  private shouldCloseTrade(strategy: Strategy) {
    let isAdvisorSignaling = true;
    if (strategy.closeOnSignal)
      isAdvisorSignaling =
        strategy.position === 'long'
          ? this.advisor.shouldSell(strategy)
          : this.advisor.shouldBuy(strategy);
    return isAdvisorSignaling;
  }

  private async checkEntryTrade(strategy: Strategy, price: Price) {
    const refPrice = this.getRefPrice(strategy, price);

    let isLimitPriceSafe = true;
    if (strategy.entry.limitPrice)
      isLimitPriceSafe =
        strategy.position === 'long'
          ? refPrice <= strategy.entry.limitPrice
          : refPrice >= strategy.entry.limitPrice;

    const isAdvisorSignaling =
      strategy.position === 'long'
        ? this.advisor.shouldBuy(strategy)
        : this.advisor.shouldSell(strategy);

    let isSpreadSafe = true;
    if (strategy.entry.maxSpread)
      isSpreadSafe =
        percent(+price.sellEfPrice, +price.buyEfPrice) <=
        strategy.entry.maxSpread;

    if (isLimitPriceSafe && isAdvisorSignaling && isSpreadSafe) {
      let volume = strategy.entry.volume / 100;
      volume *= +this.balance.getCoinBalance(strategy.profitCoin);
      this.openTrade(strategy, 'entry', volume, refPrice);
    }
  }

  private async checkGridTrade(
    strategy: Strategy,
    price: Price,
    lastOpenTrade: Trade,
  ) {
    try {
      const refPrice = this.getRefPrice(strategy, price);
      const lastOpenTradePrice = +lastOpenTrade.efPrice;

      const spread =
        strategy.position === 'long'
          ? percent(refPrice, lastOpenTradePrice)
          : percent(lastOpenTradePrice, refPrice);

      const numberOfGridTrades = (
        await this.database.findOpenGridTradesByStrategy(strategy)
      ).length;

      const stepScale = (1 + strategy.grid.stepScale / 100) ** numberOfGridTrades;
      const stepSize = strategy.grid.stepSize * stepScale;
      if (spread >= stepSize && numberOfGridTrades < strategy.grid.trades) {
        const volumeScale = (1 + strategy.grid.volumeScale / 100) ** numberOfGridTrades;
        let volume = strategy.grid.volume * volumeScale / 100
        volume *= +this.balance.getCoinBalance(strategy.profitCoin);
        this.openTrade(strategy, 'grid', volume, refPrice);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private getRefPrice(strategy: Strategy, price: Price, isProfit = false) {
    switch (strategy.position) {
      case 'long':
        return isProfit ? +price.sellEfPrice : +price.buyEfPrice;
      case 'short':
        return isProfit ? +price.buyEfPrice : +price.sellEfPrice;
    }
  }

  private async openTrade(
    strategy: Strategy,
    type: TradeType,
    volume: number,
    refPrice: number,
  ) {
    try {
      const offer =
        strategy.position === 'long'
          ? await this.buy(strategy, volume, strategy.profitCoin, refPrice)
          : await this.sell(strategy, volume, strategy.profitCoin, refPrice);

      if (offer) {
        const trade = this.createTrade(strategy, type, offer);
        await this.database.saveTrade(trade);
        this.emitter.emit('trade.opened', trade);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private createTrade(
    strategy: Strategy,
    type: TradeType,
    offer: IOfferResult,
  ) {
    const trade = TradeMapper.convertFromOfferResult(offer);
    trade.strategy = strategy.name;
    trade.position = strategy.position;
    trade.type = type;
    trade.dryRun = strategy.dryRun;
    return trade;
  }

  private async closeTrade(
    trade: Trade,
    offer: IOfferResult,
    profitMode: ProfitMode,
  ) {
    try {
      this.setTradeClosed(trade, offer, profitMode);
      await this.database.updateTrade(trade);
      this.emitter.emit('trade.closed', trade);
    } catch (e) {
      this.logger.error(e);
    }
  }

  private setTradeClosed(
    trade: Trade,
    offer: IOfferResult,
    profitMode: ProfitMode,
  ) {
    trade.closedAt = new Date();
    trade.closeOfferId = offer.offerId;
    trade.closeBaseAmount = offer.baseAmount;
    trade.closeQuoteAmount = offer.quoteAmount;
    trade.closeEfPrice = offer.efPrice;
    trade.profitMode = profitMode;
    trade.status = 'closed';
    return trade;
  }

  private updateVolume(strategy: Strategy, trade: Trade) {
    const profit = trade.profit();
    this.balance.addToCoinBalance(strategy.profitCoin, profit.abs);
  }

  private async checkTradeBalanced() {
    const openTrades = await this.database.findOpenTrades();
    if (!openTrades.length) {
      const balance = await this.balance.getFullBalance();
      this.emitter.emit('trade.balanced', balance);
    }
  }

  private async buy(
    strategy: Strategy,
    volume: number,
    volumeCoin: Coin,
    maxPrice: number,
  ): Promise<IOfferResult> {
    try {
      if (this.isVolumeValid(volume, volumeCoin)) {
        const offer = await this.biscoint.offer({
          base: baseCoin(strategy.pair),
          amount: volume.toString(),
          op: 'buy',
          isQuote: volumeCoin === 'BRL',
        });

        if (offer) {
          if (+offer.efPrice <= maxPrice) {
            if (!strategy.dryRun) await this.biscoint.confirm(offer.offerId);
            return offer;
          }
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private async sell(
    strategy: Strategy,
    volume: number,
    volumeCoin: Coin,
    minPrice: number,
  ): Promise<IOfferResult> {
    try {
      if (this.isVolumeValid(volume, volumeCoin)) {
        const offer = await this.biscoint.offer({
          base: baseCoin(strategy.pair),
          amount: volume.toString(),
          op: 'sell',
          isQuote: volumeCoin === 'BRL',
        });

        if (offer) {
          if (+offer.efPrice >= minPrice) {
            if (!strategy.dryRun) await this.biscoint.confirm(offer.offerId);
            return offer;
          }
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private isVolumeValid(volume: number, volumeCoin: Coin) {
    let minVolume: number;
    if (volumeCoin === 'BRL') minVolume = BOT_MIN_BUY_VOLUME_BRL;
    else
      minVolume =
        volumeCoin === 'BTC'
          ? BOT_MIN_SELL_VOLUME_BTC
          : BOT_MIN_SELL_VOLUME_ETH;

    return volume >= minVolume;
  }

  private async savePrices(prices: Price[]) {
    return this.database.savePrices(prices);
  }
}
