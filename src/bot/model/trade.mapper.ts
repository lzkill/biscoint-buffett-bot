import { IOfferResult } from 'biscoint-api-node/dist/typings/biscoint';
import { Trade } from './trade.entity';

export class TradeMapper {
  static convertFromOfferResult(offer: IOfferResult): Trade {
    const trade = new Trade();
    Object.assign(trade, offer);
    return trade;
  }
}
