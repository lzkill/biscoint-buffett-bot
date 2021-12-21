import { Coin, Operation } from '@bot/model';
import { AppConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { terminate, truncateString } from '@shared/helper';
import Biscoint from 'biscoint-api-node';
import {
  IConfirmOfferResult,
  IMetaResult,
  IOfferParams,
  IOfferResult,
} from 'biscoint-api-node/dist/typings/biscoint';
import Bottleneck from 'bottleneck';
import { AppLoggerService } from 'src/logger/logger.service';

@Injectable()
export class BiscointService {
  private offerLimiter: Bottleneck;
  private confirmLimiter: Bottleneck;
  private balanceLimiter: Bottleneck;

  private biscoint: Biscoint;

  constructor(
    private config: AppConfigService,
    private logger: AppLoggerService,
  ) {
    this.biscoint = new Biscoint({
      apiKey: this.config.biscoint.apiKey,
      apiSecret: this.config.biscoint.apiSecret,
      apiUrl: this.config.biscoint.apiUrl,
      apiTimeout: this.config.biscoint.apiTimeout,
    });
  }

  async init() {
    await this.initRateLimiters();
  }

  private async initRateLimiters() {
    try {
      const { endpoints } = await this.meta();
      this.initOfferRateLimiter(endpoints.offer.post.rateLimit);
      this.initConfirmOfferRateLimiter(
        endpoints['offer/confirm'].post.rateLimit,
      );
      this.initBalanceRateLimiter(endpoints.balance.post.rateLimit);
    } catch (e) {
      this.logger.error(e);
      terminate();
    }
  }

  private initOfferRateLimiter(rateLimit: any) {
    this.offerLimiter = new Bottleneck({
      minTime: Math.ceil(rateLimit.windowMs / rateLimit.maxRequests),
      maxConcurrent: 1,
    });
    this.offerLimiter.on('error', function (e) {
      this.logger.error(e);
    });
  }

  private initConfirmOfferRateLimiter(rateLimit: any) {
    this.confirmLimiter = new Bottleneck({
      minTime: Math.ceil(rateLimit.windowMs / rateLimit.maxRequests),
      maxConcurrent: 1,
    });
    this.confirmLimiter.on('error', function (e) {
      this.logger.error(e);
    });
  }

  private initBalanceRateLimiter(rateLimit: any) {
    this.balanceLimiter = new Bottleneck({
      minTime: Math.ceil(rateLimit.windowMs / rateLimit.maxRequests),
      maxConcurrent: 1,
    });
    this.balanceLimiter.on('error', function (e) {
      this.logger.error(e);
    });
  }

  private async meta(): Promise<IMetaResult> {
    return this.biscoint.meta();
  }

  async balance() {
    return this.balanceLimiter.schedule(() => this.biscoint.balance());
  }

  async offer(args: IOfferParams): Promise<IOfferResult> {
    this.tweakOfferArgs(args);
    return this.offerLimiter.schedule(() => this.biscoint.offer(args));
  }

  private tweakOfferArgs(args: IOfferParams) {
    args.base = args.base.toUpperCase(); // config allows lower case
    this.truncateEthAmount(args);
  }

  // TODO Remove after biscoint-api-node/issues/21
  private truncateEthAmount(args: IOfferParams) {
    if (!args.isQuote && args.base === 'ETH') {
      args.amount = truncateString(args.amount, 10);
    }

    return args;
  }

  async confirm(offerId: string): Promise<IConfirmOfferResult> {
    return this.confirmLimiter.schedule(() =>
      this.biscoint.confirmOffer({ offerId: offerId }),
    );
  }

  async efPrice(
    coin: Coin,
    operation: Operation,
    amount: number,
  ): Promise<string> {
    const args = {
      base: coin,
      amount: amount.toString(),
      op: operation,
      isQuote: true,
    };
    return this.offer(args).then((offer) => {
      return offer.efPrice;
    });
  }
}
