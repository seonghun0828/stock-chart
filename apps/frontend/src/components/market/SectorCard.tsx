import { formatTradeValue } from '../../lib/format';
import type { SectorViewModel } from '../../types';
import { StockRow } from './StockRow';

type SectorCardProps = {
  sector: SectorViewModel;
};

export function SectorCard({ sector }: SectorCardProps) {
  return (
    <section className="sector-card">
      <header className="sector-card-header">
        <span className="sector-name">{sector.name}</span>
        <span className="sector-trade">{formatTradeValue(sector.totalTradeValue)}</span>
      </header>
      {sector.headline ? <p className="sector-headline">{sector.headline}</p> : null}
      <div className="sector-stocks">
        {sector.stocks.map((stock, index) => (
          <StockRow
            key={stock.code}
            stock={stock}
            highlighted={index === 0 && stock.changeRate >= 29.5}
          />
        ))}
      </div>
    </section>
  );
}
