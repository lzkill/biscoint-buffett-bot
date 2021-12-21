import { percent } from '@shared/helper';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Coin } from '.';
import {
  Operation,
  ProfitMode,
  TradePosition,
  TradeStatus,
  TradeType,
} from './base-types';

export interface Profit {
  coin: Coin;
  abs: number; // base or quote
  perc: number;
}

@Entity()
export class Trade {
  @PrimaryGeneratedColumn()
  @IsNumber()
  id: number;

  @Column()
  @IsString()
  apiKeyId: string;

  @Column()
  @IsString()
  offerId: string;

  @Column()
  @IsString()
  base: Coin;

  @Column({ default: 'BRL' })
  @IsString()
  quote: Coin;

  @Column()
  @IsString()
  op: Operation;

  @Column()
  @IsBoolean()
  isQuote: boolean;

  @Column()
  @IsString()
  baseAmount: string;

  @Column()
  @IsString()
  quoteAmount: string;

  @Column()
  @IsString()
  efPrice: string;

  @Column({ nullable: true })
  @IsString()
  strategy: string;

  @Column()
  @IsString()
  position: TradePosition;

  @Column()
  @IsString()
  type: TradeType;

  @Column({ default: false })
  @IsBoolean()
  isManual: boolean;

  @Column({ default: false })
  @IsBoolean()
  dryRun: boolean;

  @Column()
  @IsDate()
  createdAt: Date;

  @Column({ nullable: true })
  @IsDate()
  closedAt: Date;

  @Column({ nullable: true })
  @IsString()
  closeOfferId: string;

  @Column({ nullable: true })
  @IsString()
  closeBaseAmount: string;

  @Column({ nullable: true })
  @IsString()
  closeQuoteAmount: string;

  @Column({ nullable: true })
  @IsString()
  closeEfPrice: string;

  @Column({ nullable: true })
  @IsString()
  profitMode: ProfitMode;

  @Column({
    default: 'open',
  })
  @IsString()
  status: TradeStatus;

  profit(): Profit {
    const profit = { coin: undefined, abs: undefined, perc: undefined };

    if (this.status === 'closed') {
      let openAmount: number;
      let closeAmount: number;

      // Trade iniciou com BRL
      if (this.isQuote) {
        openAmount = +this.quoteAmount;
        closeAmount = +this.closeQuoteAmount;
        profit.coin = this.quote;
      } else {
        openAmount = +this.baseAmount;
        closeAmount = +this.closeBaseAmount;
        profit.coin = this.base;
      }

      profit.abs = closeAmount - openAmount;
      profit.perc = percent(openAmount, closeAmount);
    }

    return profit;
  }
}
