import { Coin, Pair } from '@bot/model';

export function baseCoin(pair: Pair): Coin {
  const coins = pair.split('-');
  const base =  coins[0] === 'BRL' ? coins[1] : coins[0];
  return base as Coin;
}
