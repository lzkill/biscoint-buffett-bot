import { IsDate, IsNumber, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Coin } from '.';

@Entity()
export class Price {
  @PrimaryGeneratedColumn()
  @IsNumber()
  id: number;

  @Column()
  @IsString()
  base: Coin;

  @Column({ default: 'BRL' })
  @IsString()
  quote: Coin;

  @Column()
  @IsString()
  buyEfPrice: string;

  @Column()
  @IsString()
  sellEfPrice: string;

  @Column()
  @IsString()
  quoteAmountRef: string;

  @Column()
  @IsDate()
  timestamp: Date;
}
