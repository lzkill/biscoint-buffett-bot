import { Coin, Trade, TradePosition } from '@bot/model';
import { Price } from '@bot/model/price.entity';
import { Strategy } from '@config/config-schemas';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppLoggerService } from 'src/logger/logger.service';
import { Brackets, DeleteResult, Repository } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(
    private logger: AppLoggerService,
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(Price)
    private priceRepository: Repository<Price>,
  ) {}

  async saveTrade(trade: Trade): Promise<Trade> {
    try {
      return this.tradeRepository.manager.transaction(
        async (transactionalEntityManager) => {
          return transactionalEntityManager.save(trade);
        },
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  async updateTrade(trade: Trade): Promise<Trade> {
    try {
      return this.saveTrade(trade);
    } catch (e) {
      this.logger.error(e);
    }
  }

  async deleteTrade(trade: Trade): Promise<Trade> {
    try {
      return this.tradeRepository.manager.transaction(
        async (transactionalEntityManager) => {
          return transactionalEntityManager.remove(trade);
        },
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  async deleteAllOpenTrades(): Promise<DeleteResult> {
    try {
      return this.tradeRepository.manager.transaction(
        async (transactionalEntityManager) => {
          return transactionalEntityManager.delete(Trade, {
            status: 'open',
          });
        },
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  async findTrades(...filters: Brackets[]): Promise<Trade[]> {
    try {
      let query = this.tradeRepository
        .createQueryBuilder()
        .select()
        .where('1=1');
      for (const filter of filters) query = query.andWhere(filter);
      return query.getMany();
    } catch (e) {
      this.logger.error(e);
    }
  }

  async findOpenTrades(...filters: Brackets[]): Promise<Trade[]> {
    const filter = new Brackets((qb) => {
      qb.where('status = :status', {
        status: 'open',
      });
    });
    return this.findTrades(filter, ...filters);
  }

  async findOpenTradesByPosition(position: TradePosition): Promise<Trade[]> {
    const filter = new Brackets((qb) => {
      qb.where('position = :position', {
        position: position,
      });
    });
    return this.findOpenTrades(filter);
  }

  async findOpenTradesByStrategy(strategy: Strategy): Promise<Trade[]> {
    const filter = new Brackets((qb) => {
      qb.where('strategy = :strategy', {
        strategy: strategy.name,
      });
    });
    return this.findOpenTrades(filter);
  }

  async findOpenGridTradesByStrategy(strategy: Strategy): Promise<Trade[]> {
    const filter = new Brackets((qb) => {
      qb.where('strategy = :strategy', {
        strategy: strategy.name,
      }).andWhere('type = :type', { type: 'grid' });
    });
    return this.findOpenTrades(filter);
  }

  async findLastOpenTradeByStrategy(strategy: Strategy): Promise<Trade> {
    try {
      return this.tradeRepository.findOne({
        where: {
          status: 'open',
          strategy: strategy.name,
        },
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  async savePrices(prices: Price[]) {
    try {
      return this.priceRepository.manager.transaction(
        async (transactionalEntityManager) => {
          return transactionalEntityManager.save(prices);
        },
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  async findPriceHistory(
    base: Coin,
    limit = Number.MAX_VALUE,
  ): Promise<Price[]> {
    try {
      return this.priceRepository
        .createQueryBuilder()
        .where((qb) => {
          const subQuery = qb
            .subQuery()
            .select('p.id')
            .from(Price, 'p')
            .where({ base: base })
            .orderBy({ timestamp: 'DESC' })
            .limit(limit)
            .getQuery();
          return 'price.id in ' + subQuery;
        })
        .orderBy({ timestamp: 'ASC' })
        .getMany();
    } catch (e) {
      this.logger.error(e);
    }
  }
}
