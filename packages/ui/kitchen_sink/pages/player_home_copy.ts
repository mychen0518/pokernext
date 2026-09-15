/**
 * @fileoverview Every string the player-home kitchen-sink page shows, in one
 * module so `tests/player_copy_has_no_play_more_prompts.test.ts` can scan it.
 * Values are transcribed from the prototype's seed and player home
 * (`docs/design/prototype/pokernext-prototype.html`, `#/player/home`) for
 * Alex Chen's trip TR-260911-028; nothing is computed here.
 */

/** Copy shared by both states. */
export const PLAYER_HOME_COMMON = {
  greeting: 'Alex，您好',
} as const;

/** Alex's confirmed Jeju trip (prototype `seed()`, trip TR-260911-028). */
export const PLAYER_HOME_READY = {
  destination: '濟州島',
  destinationEn: 'JEJU ISLAND',
  dates: '09/11 – 09/13 · 2 晚',
  tripAction: '查看行程',
  hotel: '濟州君悅酒店',
  lodging: '住宿已確認',
  transfer: '接送待確認',
  itinerary: '行程待您確認',
  // The prototype shows 可用積分 as ledger 30,000 minus reserved 25,000.
  availablePoints: 5000,
  reservedPoints: 25000,
  contactLabel: '接待人',
  contactName: 'Amy',
  contactDetail: '服務時段 09:00–22:00（韓國時間）',
  contactAction: '聯繫接待人',
} as const;

/** A member with no trip and no points record yet. */
export const PLAYER_HOME_EMPTY = {
  noTripReason: '目前沒有進行中的行程，行程確認後會顯示在這裡。',
  applyAction: '申請行程',
  noPointsReason: '尚無積分紀錄，天城的積分資料匯入後會顯示在這裡。',
} as const;
