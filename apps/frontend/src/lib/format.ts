export function formatPercent(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export function formatTradeValue(value: number) {
  return `${new Intl.NumberFormat('ko-KR').format(value)}억`;
}

export function formatClock(timestamp: string | null) {
  if (!timestamp) {
    return '--:--:--';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}
