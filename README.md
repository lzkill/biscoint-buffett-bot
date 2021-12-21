# bbb - biscoint-buffett-bot

## Disclaimer

:warning: :warning: :warning: Ainda que este bot seja estável e rentável, nunca opere quantias que você não está disposto a perder ou que não tolera ver flutuar. O(s) autor(es) não se responsabiliza(m) por eventuais perdas ou por rentabilidades diferentes das expectativas.

## Overview

Este repositório contém um bot de *infinity grid* para operação na [Biscoint](https://biscoint.io/). Ele permite operar comprado (long) e/ou vendido (short). Múltiplas configurações podem ser carregadas simultaneamente para obter profit em diferentes cenários de mercado.

O algoritmo básico do bot consiste em uma entrada principal e várias entradas de segurança, que têm o intuito de buscar o profit almejado mesmo se o mercado caminhar no sentido contrário. Um exemplo: suponha que o bot entre no mercado fazendo uma compra (*long*). Se o preço subir e alcançar o *take profit* configurado a operação é fechada com uma venda. Caso o preço caia, a cada *stepSize* uma nova compra é realizada. Se o preço subir novamente as operações são fechadas uma após a outra. O mesmo raciocínio se aplica para trades em *short*, com a diferença de que a operação inicial é uma venda e que o profit é obtido após uma compra em um patamar de preço inferior. Por padrão, **o bot nunca fecha trades com loss**.

A tabela abaixo mostra um exemplo de configuração cujo resultado efetivo é um grid com 5 posições e cobertura máxima de 6,23% a partir da entrada.

**entry volume %:** 10.00
**stepSize %:**	0.30
**stepScale:** 50.00
**volumeScale:** 5.00
**grid volume %:** 13.23

|# grid       |stepScale|stepSize %|stepSize acc %|volumeScale|volume %|volume acc %|total volume %|
|-------------|---------|----------|--------------|-----------|--------|------------|--------------|
|0            |1.00     |0.30      |0.30          |1.00       |13.23   |13.23       |23.23         |
|1            |1.50     |0.45      |0.75          |1.05       |13.89   |27.13       |37.13         |
|2            |2.25     |0.68      |1.43          |1.10       |14.59   |41.71       |51.71         |
|3            |3.38     |1.01      |2.44          |1.16       |15.32   |57.03       |67.03         |
|4            |5.06     |1.52      |3.96          |1.22       |16.08   |73.12       |83.12         |
|5            |7.59     |2.28      |6.23          |1.28       |16.89   |90.00       |100.00        |
|6            |11.39    |3.42      |9.65          |1.34       |17.73   |107.74      |117.74        |
|7            |17.09    |5.13      |14.78         |1.41       |18.62   |126.35      |136.35        |
|8            |25.63    |7.69      |22.47         |1.48       |19.55   |145.90      |155.90        |
|9            |38.44    |11.53     |34.00         |1.55       |20.53   |166.43      |176.43        |


## Config

Copie `config.example.json` para `config.json`, editando os valores onde necessário.

**Parâmetros relevantes:**

- `biscoint.apiKey` / `biscoint.apiSecret`: credenciais de acesso à API da Biscoint;
- `initPrices`: número de preços buscados no banco de dados local para inicialização dos indicadores de entrada (*em desenvolvimento*);
- `portfolio`: array de estratégias do bot;
  - `name`: nome da estratégia, deve ser único;
  - `pair`:  par de negociação (atualmente apenas BTC e ETH estão disponíveis na Biscoint);
  - `position`:  tipo de estratégia (`long` / `short`);
  - `takeProfit`: lucro percentual almejado nos trades;
  - `profitMode`: modo de fechamento dos grids (`grid` / `dca`. Em modo *grid* cada posição de grid será fechada após o `takeProfit` ser atingido em relação ao preço de entrada. Em modo *dca* as posições de grid serão fechadas após o `takeProfit` ser atingido em relação ao custo médio de todas as posições abertas.
  - `profitCoin`: moeda na qual se deseja o lucro apurado. Deve-se manter saldo nesta moeda para operação do bot;
  - `entry.volume`: tamanho da posição de entrada, percentual em relação ao saldo na corretora;
  - `entry.maxSpread`: filtro no spread entre preço de compra e preço de venda. A entrada não será feita caso o spread corrente seja maior que o valor configurado neste parâmetro;
  - `grid.volume`: tamanho da posição de grid, percentual em relação ao saldo na corretora;
  - `grid.volumeScale`: fator multiplicador para aumento gradual das posições de grid (vide [Martingale](https://www.investopedia.com/terms/m/martingalesystem.asp));
  - `grid.stepSize`: afastamento percentual entre as posições de grid. A primeira posição acontece quando o preço de referência (compra para long e venda para short) se afasta `stepSize`% do preço da posição de entrada;
  - `grid.stepScale`: fator multiplicador para afastamento gradual das posições de grid;
  - `grid.trades`:  número de posições de grid;
  - `dryRun`: modo de simulação. Quando ativado, nenhuma operação é efetivada na corretora. Útil para acompanhar uma tese de operação pelo Telegam.
- `hideKnownErrors`: descarte de erros conhecidos (saldo insuficiente, oferta indisponível, etc);
- `tradeEnabled`: modo de operação habilitado / desabilitado. Quando desligado, o bot apenas coleta e salva os preços da corretora para uso futuro.

**Comandos de Telegram:**

- **/bbb_start** nothing really useful
- **/bbb_get_balance** get the current balance
- **/bbb_get_config** get the bot config
- **/bbb_get_trades** get the open trades
- **/bbb_set_chat_on** enable the trade chat
- **/bbb_set_chat_off** disable the trade chat
- **/bbb_set_trade_on** enable the trading algorithm
- **/bbb_set_trade_off** disable the trading algorithm
- **/bbb_clear_trades** discards all open trades
- **/bbb_refresh_balance** refresh with broker info
- **/bbb_ping pong back**
- **/bbb_help** show this message

## Build

```bash
npm run pkg
```
Após este comando o diretório *pkg* deve conter um binário executável do bot. Para executá-lo o diretório corrente deve conter a extensão node do SQLite correspondente ao sistema operacional em questão. (vide *etc*).

## Development

### Setup (Linux + Bash)

- Instale [nodenv](https://github.com/nodenv/nodenv#basic-github-checkout) e [node-build](https://github.com/nodenv/node-build#installation);

- Configure o ambiente e o projeto;

```bash
$ nodenv install 14.16.0 && \
  npm install -g @nestjs/cli && \
  nodenv rehash && \
  npm install -f && \
  npm run prepare
```

- Se a IDE de trabalho for VSCode, instale as extensões a seguir:

  - [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
  - [Todo Tree](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  - [Generate Index](https://marketplace.visualstudio.com/items?itemName=JayFong.generate-index)

## Roadmap

Vide [Issues](https://github.com/lzkill/biscoint-buffett-bot/issues).

Toda ajuda é bem vinda!
