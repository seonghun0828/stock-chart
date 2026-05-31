type CandleBarProps = {
  price: number;
  priceRange: {
    open: number | null;
    high: number | null;
    low: number | null;
  };
  changeRate: number;
};

function toPercent(value: number, min: number, max: number) {
  if (max <= min) {
    return 50;
  }

  return ((value - min) / (max - min)) * 100;
}

export function CandleBar({ price, priceRange, changeRate }: CandleBarProps) {
  const { open, high, low } = priceRange;

  if (high == null || low == null) {
    return <div className="candle-bar candle-bar-fallback" />;
  }

  const tone = changeRate > 0 ? 'up' : changeRate < 0 ? 'down' : 'flat';
  const current = Math.min(100, Math.max(0, toPercent(price, low, high)));
  const openPosition =
    open == null ? current : Math.min(100, Math.max(0, toPercent(open, low, high)));
  const left = Math.min(current, openPosition);
  const width = Math.max(Math.abs(current - openPosition), 4);

  return (
    <div className={`candle-bar candle-bar-${tone}`}>
      <div className="candle-range" />
      <div className="candle-body" style={{ left: `${left}%`, width: `${width}%` }} />
      <div className="candle-tick" style={{ left: `${current}%` }} />
    </div>
  );
}
