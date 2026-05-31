import { CandleBar } from './CandleBar';
import { formatPercent, formatPrice, formatTradeValue } from '../../lib/format';
import type { StockViewModel } from '../../types';

type StockRowProps = {
  stock: StockViewModel;
  highlighted?: boolean;
};

export function StockRow({ stock, highlighted = false }: StockRowProps) {
  const tone =
    stock.changeRate > 0 ? 'up' : stock.changeRate < 0 ? 'down' : 'flat';

  return (
    <article className={`stock-row ${highlighted ? 'stock-row-highlighted' : ''}`}>
      <div className="stock-main">
        <div className="stock-copy">
          <div className="stock-name">{stock.name}</div>
          <div className={`stock-price stock-price-${tone}`}>
            {formatPrice(stock.price)}
          </div>
        </div>
        <div className="stock-metrics">
          <div className={`stock-rate stock-rate-${tone}`}>
            {formatPercent(stock.changeRate)}
          </div>
          <div className="stock-trade">{formatTradeValue(stock.tradeValue)}</div>
        </div>
      </div>
      <CandleBar
        price={stock.price}
        priceRange={stock.priceRange}
        changeRate={stock.changeRate}
      />
    </article>
  );
}
