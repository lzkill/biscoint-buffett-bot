import { Coin } from '@bot/model';
import { Injectable } from '@nestjs/common';
import { IBalanceResult } from 'biscoint-api-node/dist/typings/biscoint';
import { BiscointService } from './biscoint.service';

@Injectable()
export class BalanceService {
  private balance: IBalanceResult;

  constructor(private biscoint: BiscointService) {}

  async refresh(): Promise<IBalanceResult> {
    this.balance = await this.biscoint.balance();
    return this.balance;
  }

  getFullBalance(): IBalanceResult {
    return this.balance;
  }

  getCoinBalance(coin: Coin): string {
    return this.balance ? this.balance[coin] : '0';
  }

  addToCoinBalance(coin: Coin, amount: number): string {
    let coinBalance = +this.balance[coin];
    coinBalance += amount;
    this.balance[coin] = coinBalance.toString();
    return this.balance[coin];
  }
}
