/**
 * @fileoverview Formats the Topbar date and time in Korea time with its time
 * zone label (DESIGN.md §5: 時間一律顯示時區標記).
 */

const FORMAT = new Intl.DateTimeFormat('zh-TW', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'narrow',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Formats an instant as `2026/09/11（五）11:05 · 韓國時間`. */
export function formatKoreaDateTime(instant: Date): string {
  const parts = Object.fromEntries(
    FORMAT.formatToParts(instant).map(part => [part.type, part.value]),
  );
  return (
    `${parts['year']}/${parts['month']}/${parts['day']}` +
    `（${parts['weekday']}）${parts['hour']}:${parts['minute']} · 韓國時間`
  );
}
