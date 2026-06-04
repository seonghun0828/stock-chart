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

const LOWER_LIMIT_RATE = 0.3;
const UPPER_LIMIT_RATE = 0.3;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function CandleBar({ price, priceRange, changeRate }: CandleBarProps) {
  const { previousClose, open, high, low } = priceRange;

  if (high == null || low == null || previousClose == null) {
    return <div className="candle-bar candle-bar-fallback" />;
  }

  const tone = changeRate > 0 ? 'up' : changeRate < 0 ? 'down' : 'flat';
  const lowerLimit = previousClose * (1 - LOWER_LIMIT_RATE);
  const upperLimit = previousClose * (1 + UPPER_LIMIT_RATE);
  const span = Math.max(upperLimit - lowerLimit, 1);
  const toPercent = (value: number) =>
    clamp(((value - lowerLimit) / span) * 100, 0, 100);

  const current = toPercent(price);
  const openPosition = open == null ? current : toPercent(open);
  const left = Math.min(current, openPosition);
  const width = Math.max(Math.abs(current - openPosition), 4);
  const wickLeft = toPercent(low);
  const wickRight = toPercent(high);

  return (
    <div className={`candle-bar candle-bar-${tone}`}>
      <div className="candle-range" data-testid="candle-range" />
      <div
        className="candle-wick"
        data-testid="candle-wick"
        style={{ left: `${wickLeft}%`, width: `${Math.max(wickRight - wickLeft, 2)}%` }}
      />
      <div
        className="candle-body"
        data-testid="candle-body"
        style={{ left: `${left}%`, width: `${width}%` }}
      />
      <div className="candle-tick" data-testid="candle-tick" style={{ left: '50%' }} />
    </div>
  );
}
