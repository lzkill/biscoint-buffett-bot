const express = require('express');
const app = express();
const offers = new Map();
const Walk = require('random-walk');

let brlBalance = 1000;
let btcBalance = 0.01;

const walk = new Walk();

let params = {
  pseudo: false,
  rate: { min: 10, max: 10 },
  type: 'positive',
  base: 240000,
  scale: 100, // 100 is normal (default), > 100 is less volatile, < 100 is more volatile
};

let lastRandomPrice;
walk.on('result', (result) => {
  lastRandomPrice = parseFloat(result);
});

walk.get('walk', params);

app.use(express.json());

app.get('/v1/meta', (req, res, next) => {
  res.json(meta());
});

app.post('/v1/offer', (req, res, next) => {
  res.json(offer(req.body.amount, req.body.op, req.body.isQuote));
});

app.post('/v1/offer/confirm', (req, res, next) => {
  res.json(confirm(req.body.offerId));
});

app.post('/v1/balance', (req, res, next) => {
  res.json({message: '', data: {BRL: brlBalance.toString(), BTC: btcBalance.toString()}});
});

app.listen(5001, () => {
  console.log('Biscoint fake server running on port 5001');
});

function randomBtcPrice() {
  let precision = Math.floor(Math.random() * 2) + 1;
  return lastRandomPrice.toFixed(precision);
}

function randomGuid() {
  return (Math.random() + 1).toString(36).substring(7);
}

function meta() {
  return {
    message: '',
    data: {
      version: 'v1',
      endpoints: {
        ticker: {
          get: {
            type: 'public',
            rateLimit: {
              windowMs: 60000,
              maxRequests: 6,
              rate: '6 per 1 minute',
            },
          },
        },
        fees: {
          get: {
            type: 'public',
            rateLimit: {
              windowMs: 60000,
              maxRequests: 2,
              rate: '2 per 1 minute',
            },
          },
        },
        meta: {
          get: {
            type: 'public',
            rateLimit: {
              windowMs: 60000,
              maxRequests: 2,
              rate: '2 per 1 minute',
            },
          },
        },
        balance: {
          post: {
            type: 'private',
            rateLimit: {
              windowMs: 60000,
              maxRequests: 6000,
              rate: '12 per 1 minute',
            },
          },
        },
        offer: {
          get: {
            type: 'private',
            rateLimit: {
              windowMs: 60000,
              maxRequests: 6000,
              rate: '24 per 1 minute',
            },
          },
          post: {
            type: 'private',
            rateLimit: {
              windowMs: 60000,
              maxRequests: 6000,
              rate: '6000 per 1 minute',
            },
          },
        },
        'offer/confirm': {
          get: {
            type: 'private',
            rateLimit: {
              windowMs: 60000,
              maxRequests: 6000,
              rate: '6000 per 1 minute',
            },
          },
          post: {
            type: 'private',
            rateLimit: {
              windowMs: 60000,
              maxRequests: 6000,
              rate: '24 per 1 minute',
            },
          },
        },
        trades: {
          get: {
            type: 'private',
            rateLimit: {
              windowMs: 60000,
              maxRequests: 12,
              rate: '12 per 1 minute',
            },
          },
        },
      },
    },
  };
}

function offer(amount, op, isQuote) {
  const efPrice = randomBtcPrice();
  const offerId = randomGuid();
  const baseAmount = isQuote ? parseFloat(amount / efPrice).toFixed(8) : amount;
  const quoteAmount = isQuote ? amount : parseFloat(amount * efPrice).toFixed(2);

  var now = new Date();

  const offer = {
    message: '',
    data: {
      offerId: offerId,
      base: 'BTC',
      quote: 'BRL',
      op: op,
      isQuote: isQuote,
      baseAmount: baseAmount.toString(),
      quoteAmount: quoteAmount.toString(),
      efPrice: efPrice.toString(),
      createdAt: now,
      expiresAt: now.setSeconds(now.getSeconds() + 15),
      apiKeyId: 'BdFABxNakZyxPwnRu',
    },
  };

  offers.set(offerId, offer);
  return offer;
}

function confirm(offerId) {
  const offer = offers.get(offerId);

  const confirm = {
    message: '',
    data: {
      offerId: offer.data.offerId,
      base: offer.data.base,
      quote: offer.data.quote,
      op: offer.data.op,
      isQuote: offer.data.isQuote,
      baseAmount: offer.data.baseAmount,
      quoteAmount: offer.data.quoteAmount,
      efPrice: offer.data.efPrice,
      createdAt: offer.data.createdAt,
      confirmedAt: new Date(),
      apiKeyId: offer.data.apiKeyId,
    },
  };

  if(offer.data.op === 'buy') {
    brlBalance -= +offer.data.quoteAmount;
    btcBalance += +offer.data.baseAmount;
  }

  if(offer.data.op === 'sell') {
    brlBalance += +offer.data.quoteAmount;
    btcBalance -= +offer.data.baseAmount;
  }

  console.log(`${brlBalance.toFixed(2)};${btcBalance.toFixed(8)}`);

  offers.delete(offerId);

  return confirm;
}
