type CandleBarProps = {
  price: number;
  priceRange: {
    previousClose: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
  };
  changeRate: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function CandleBar({ price, priceRange, changeRate }: CandleBarProps) {
  const { previousClose, open, high, low } = priceRange;

  if (high == null || low == null || previousClose == null) {
    return <div className="candle-bar candle-bar-fallback" />;
  }

  const tone = changeRate > 0 ? 'up' : changeRate < 0 ? 'down' : 'flat';
  const upperDistance = Math.abs(high - previousClose);
  const lowerDistance = Math.abs(previousClose - low);
  const maxDistance = Math.max(upperDistance, lowerDistance, Math.abs(price - previousClose), 1);
  const scale = 50 / maxDistance;
  const toCenteredPercent = (value: number) => clamp(50 + (value - previousClose) * scale, 0, 100);

  const current = toCenteredPercent(price);
  const openPosition = open == null ? current : toCenteredPercent(open);
  const left = Math.min(current, openPosition);
  const width = Math.max(Math.abs(current - openPosition), 4);
  const wickLeft = toCenteredPercent(low);
  const wickRight = toCenteredPercent(high);

  return (
    <div className={`candle-bar candle-bar-${tone}`}>
      <div className="candle-range" />
      <div
        className="candle-wick"
        style={{ left: `${wickLeft}%`, width: `${Math.max(wickRight - wickLeft, 2)}%` }}
      />
      <div className="candle-body" style={{ left: `${left}%`, width: `${width}%` }} />
      <div className="candle-tick" style={{ left: '50%' }} />
    </div>
  );
}
