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

export function formatConnectionStatusLabel(
  status: 'connecting' | 'open' | 'closed' | 'error',
) {
  switch (status) {
    case 'open':
      return '연결됨';
    case 'connecting':
      return '연결중';
    case 'closed':
      return '연결 종료';
    case 'error':
      return '에러 발생';
  }
}

export function isMarketOpen(date: Date) {
  const { isWeekday, totalMinutes } = getSeoulMarketTime(date);
  const isMarketHours = totalMinutes >= 9 * 60 && totalMinutes < 15 * 60 + 30;

  return isWeekday && isMarketHours;
}

export function isRealtimeSessionActive(date: Date) {
  const { isWeekday, totalMinutes } = getSeoulMarketTime(date);
  const isRealtimeHours = totalMinutes >= 9 * 60 && totalMinutes < 15 * 60 + 31;

  return isWeekday && isRealtimeHours;
}

function getSeoulMarketTime(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const weekday = values.get('weekday');
  const hour = Number(values.get('hour'));
  const minute = Number(values.get('minute'));
  const totalMinutes = hour * 60 + minute;
  const isWeekday =
    weekday === 'Mon' ||
    weekday === 'Tue' ||
    weekday === 'Wed' ||
    weekday === 'Thu' ||
    weekday === 'Fri';

  return { isWeekday, totalMinutes };
}

export function getMarketStatusLabel(date: Date) {
  return isMarketOpen(date) ? '장 열림' : '장 마감';
}

export function getNextMarketBoundary(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(values.get('year'));
  const month = Number(values.get('month'));
  const day = Number(values.get('day'));
  const currentTime = date.getTime();

  const candidates = [
    buildSeoulDate(year, month, day, 9, 0, 0),
    buildSeoulDate(year, month, day, 15, 30, 0),
    buildSeoulDate(year, month, day, 15, 31, 0),
  ].filter((candidate) => candidate.getTime() > currentTime);

  if (candidates.length > 0) {
    return candidates[0];
  }

  return buildSeoulDate(year, month, day + 1, 9, 0, 0);
}

function buildSeoulDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
) {
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, second));
}
