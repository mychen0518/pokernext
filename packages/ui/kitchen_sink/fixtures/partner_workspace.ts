/**
 * @fileoverview Demo data for the 合作端 (場館工作區) page types, transcribed
 * from the prototype's seed values and the three partner reference images.
 * Display strings only: no business rules, and nothing a partner must not
 * see (DESIGN.md §5: no attribution history, performance, marketing fees,
 * other venues' activity or internal notes).
 */

import {BedDouble, Car, Database, FileText, House, User} from 'lucide-react';

import type {
  ActivityTimelineItem,
  KeyValueItem,
  SidebarItem,
  StepperStep,
  Tone,
} from '../../index';

/** Workspace name under the brand, from the prototype's `SUB.venue`. */
export const VENUE_WORKSPACE_NAME = '天城合作端';

/** Topbar breadcrumb, from the prototype's `CRUMB.venue`. */
export const VENUE_BREADCRUMB = 'JEJU · PARTNER WORKSPACE';

/** The signed-in demo user of the venue workspace. */
export const VENUE_USER = {name: '琪琪', role: '天城業務'} as const;

/** Venue workspace navigation, as in the reference images. */
export const VENUE_NAV: readonly SidebarItem[] = [
  {id: 'overview', label: '工作總覽', href: '?page=overview', icon: House},
  {id: 'checkin', label: '到場報到', href: '?page=operation', icon: User},
  {id: 'changes', label: '行程異動', href: '?page=case', icon: FileText},
  {id: 'recon', label: '住宿兌換核對', href: '#recon', icon: BedDouble},
  {id: 'deposits', label: '押金紀錄', href: '#deposits', icon: Database},
  {id: 'transfer', label: '接送安排', href: '#transfer', icon: Car},
];

/** A status in words with its StatusDot or Badge tone. */
export interface ToneLabel {
  readonly tone: Tone;
  readonly label: string;
}

/** One row of the 總覽頁 arrivals table. */
export interface ArrivalRow {
  readonly tripId: string;
  readonly player: string;
  readonly venueMemberNo: string;
  readonly stay: string;
  readonly checkin: ToneLabel;
  readonly deposit: ToneLabel;
}

const AWAITING_CHECKIN: ToneLabel = {tone: 'warning', label: '待報到'};
const CHECKED_IN: ToneLabel = {tone: 'success', label: '已報到'};
const AWAITING_DEPOSIT: ToneLabel = {tone: 'warning', label: '待收取'};

/** Today's arrivals, from the prototype's trips and members. */
export const ARRIVALS: readonly ArrivalRow[] = [
  {
    tripId: 'TR-260911-028',
    player: 'CHEN, ALEX',
    venueMemberNo: 'TC-008126',
    stay: '09/11 – 09/13',
    checkin: AWAITING_CHECKIN,
    deposit: AWAITING_DEPOSIT,
  },
  {
    tripId: 'TR-260911-029',
    player: 'LIN, MAY',
    venueMemberNo: 'TC-008127',
    stay: '09/11 – 09/14',
    checkin: CHECKED_IN,
    deposit: {tone: 'success', label: '已收取'},
  },
  {
    tripId: 'TR-260911-030',
    player: 'WANG, LEO',
    venueMemberNo: 'TC-008128',
    stay: '09/11 – 09/13',
    checkin: AWAITING_CHECKIN,
    deposit: {tone: 'neutral', label: '無須押金'},
  },
  {
    tripId: 'TR-260911-031',
    player: 'LEE, ANNA',
    venueMemberNo: 'TC-008129',
    stay: '09/11 – 09/15',
    checkin: AWAITING_CHECKIN,
    deposit: AWAITING_DEPOSIT,
  },
];

/** Players on the island: the arrivals already checked in, plus Jisoo. */
export const ON_ISLAND: readonly ArrivalRow[] = [
  {
    tripId: 'TR-260909-017',
    player: 'KIM, JISOO',
    venueMemberNo: 'TC-008119',
    stay: '09/09 – 09/12',
    checkin: CHECKED_IN,
    deposit: {tone: 'success', label: '已收取'},
  },
  ...ARRIVALS.filter(row => row.checkin === CHECKED_IN),
];

/** Recent venue activity for the 總覽頁 timeline (Korea time). */
export const RECENT_ACTIVITY: readonly ActivityTimelineItem[] = [
  {
    id: 'a1',
    time: '10:42',
    event: '取消完成',
    reference: 'TR-260908-014',
    description: '玩家取消行程，已完成處理',
  },
  {
    id: 'a2',
    time: '10:30',
    event: '押金已收取',
    reference: 'TR-260911-029',
    description: '已確認現場押金收取 KRW 300,000',
  },
  {
    id: 'a3',
    time: '10:15',
    event: '到場報到',
    reference: 'TR-260911-029',
    description: '玩家 LIN, MAY 已完成 PokerRoom 到場報到',
  },
];

/** One card of the 總覽頁 to-do panel. */
export interface TodoFixture {
  readonly id: string;
  readonly kind: 'change' | 'extend' | 'refund';
  readonly title: string;
  readonly status: ToneLabel;
  readonly tripId: string;
  readonly details: readonly KeyValueItem[];
  readonly action: string;
}

/** To-dos from the partner-overview reference image. */
export const TODOS: readonly TodoFixture[] = [
  {
    id: 't1',
    kind: 'change',
    title: '取消申請',
    status: {tone: 'warning', label: '待開始'},
    tripId: 'TR-260912-032',
    details: [
      {label: '申請人', value: 'CHANG, RYAN'},
      {label: '申請時間', value: '2026/09/11 09:18 · 韓國時間'},
    ],
    action: '開始執行',
  },
  {
    id: 't2',
    kind: 'extend',
    title: '續住申請',
    status: {tone: 'info', label: '處理中'},
    tripId: 'TR-260909-017',
    details: [
      {label: '申請人', value: 'KIM, JISOO'},
      {label: '原退房日', value: '2026/09/12'},
      {label: '申請續住至', value: '2026/09/14'},
    ],
    action: '查看需求',
  },
  {
    id: 't3',
    kind: 'refund',
    title: '押金退還',
    status: {tone: 'danger', label: '待退還'},
    tripId: 'TR-260908-021',
    details: [
      {label: '申請人', value: 'PARK, MINHO'},
      {label: '退還金額', value: 'KRW 300,000'},
      {label: '申請時間', value: '2026/09/10 16:20 · 韓國時間'},
    ],
    action: '查看明細',
  },
];

/** Player and trip facts for the 作業頁 check-in card. */
export const SCANNED_TRIP: readonly KeyValueItem[] = [
  {
    label: 'POKERNEXT UUID',
    value: '8f39c210-7a64-4b19-92da-65a130fc482e',
    mono: true,
    copyValue: '8f39c210-7a64-4b19-92da-65a130fc482e',
  },
  {label: '天城會員編號', value: 'TC-008126', mono: true},
  {label: '行程編號', value: 'TR-260911-028', mono: true},
  {label: '住宿確認編號', value: 'GHJ-260911-0842', mono: true},
  {label: '住宿日期', value: '2026/09/11 – 09/13'},
  {label: '住宿晚數', value: '2 晚'},
];

/** Deposit facts for the 作業頁 deposit card. */
export const DEPOSIT_FACTS: readonly KeyValueItem[] = [
  {label: '住宿需求', value: '2 晚'},
  {label: '已保留積分', value: '25,000 分 · 可兌換 1 晚'},
  {label: '積分不足', value: '1 晚'},
  {label: '每晚押金', value: 'KRW 300,000'},
];

/** Tabs of the 案件頁, by case stage. */
export type CaseStage = 'pending' | 'inProgress' | 'done' | 'withdrawn';

/** One change request of the 案件頁. */
export interface ChangeCase {
  readonly id: string;
  readonly stage: CaseStage;
  readonly title: string;
  readonly status: ToneLabel;
  readonly player: string;
  readonly venueMemberNo: string;
  readonly tripId: string;
  readonly hotelConfirmationNo: string;
  /** Short submission time for the list, with its time zone label. */
  readonly submitted: string;
  readonly currentStay: string;
  readonly request: string;
  readonly hotelCheckin: ToneLabel;
  readonly steps: readonly StepperStep[];
  readonly resultTitle: string;
  readonly resultConfirmation: string;
  /** The venue's own processing note, prefilled where one exists. */
  readonly resultNote: string;
  readonly playerSees: string;
  readonly lastUpdated: string;
}

const IN_PROGRESS: ToneLabel = {tone: 'info', label: '執行中'};

/** Change requests from the prototype's seed and the reference image. */
export const CHANGE_CASES: readonly ChangeCase[] = [
  {
    id: 'CHG-260911-006',
    stage: 'inProgress',
    title: '取消行程',
    status: IN_PROGRESS,
    player: 'CHANG, RYAN',
    venueMemberNo: 'TC-008132',
    tripId: 'TR-260912-032',
    hotelConfirmationNo: 'GHJ-260912-0635',
    submitted: '09/11 09:18 · 韓國時間',
    currentStay: '2026/09/12 – 09/14 · 2 晚',
    request: '取消本次行程與住宿',
    hotelCheckin: {tone: 'neutral', label: '尚未入住'},
    steps: [
      {label: '申請已收到', status: 'done', detail: '09/11 09:18'},
      {label: '開始執行', status: 'current', detail: '09/11 10:40 · 琪琪'},
      {label: '已完成', status: 'upcoming'},
    ],
    resultTitle: '取消結果',
    resultConfirmation: '已在天城系統完成取消',
    resultNote: '原住宿確認單已作廢。',
    playerSees: '執行取消行程中',
    lastUpdated: '2026/09/11 10:40 · 韓國時間 · 琪琪',
  },
  {
    id: 'CHG-260909-004',
    stage: 'inProgress',
    title: '續住申請',
    status: IN_PROGRESS,
    player: 'KIM, JISOO',
    venueMemberNo: 'TC-008119',
    tripId: 'TR-260909-017',
    hotelConfirmationNo: 'GHJ-260909-0512',
    submitted: '09/09 16:20 · 韓國時間',
    currentStay: '2026/09/09 – 09/12 · 3 晚',
    request: '續住至 2026/09/14',
    hotelCheckin: {tone: 'success', label: '已入住'},
    steps: [
      {label: '申請已收到', status: 'done', detail: '09/09 16:20'},
      {label: '開始執行', status: 'current', detail: '09/10 09:00 · 琪琪'},
      {label: '已回報', status: 'upcoming'},
    ],
    resultTitle: '續住結果',
    resultConfirmation: '已在天城系統完成續住',
    resultNote: '',
    playerSees: '續住處理中',
    lastUpdated: '2026/09/10 09:00 · 韓國時間 · 琪琪',
  },
  {
    id: 'CHG-260911-005',
    stage: 'pending',
    title: '住宿日期異動',
    status: {tone: 'warning', label: '待開始'},
    player: 'LEE, ANNA',
    venueMemberNo: 'TC-008129',
    tripId: 'TR-260911-031',
    hotelConfirmationNo: 'GHJ-260911-0860',
    submitted: '09/11 14:35 · 韓國時間',
    currentStay: '2026/09/11 – 09/15 · 4 晚',
    request: '改為 2026/09/12 – 09/16',
    hotelCheckin: {tone: 'neutral', label: '尚未入住'},
    steps: [
      {label: '申請已收到', status: 'current', detail: '09/11 14:35'},
      {label: '開始執行', status: 'upcoming'},
      {label: '已回報', status: 'upcoming'},
    ],
    resultTitle: '異動結果',
    resultConfirmation: '已在天城系統完成日期異動',
    resultNote: '',
    playerSees: '日期異動申請已送出',
    lastUpdated: '2026/09/11 14:35 · 韓國時間',
  },
];

/** Tabs of the 案件頁 with their labels. */
export const CASE_TABS: ReadonlyArray<{
  readonly id: CaseStage;
  readonly label: string;
}> = [
  {id: 'pending', label: '待開始'},
  {id: 'inProgress', label: '執行中'},
  {id: 'done', label: '已完成'},
  {id: 'withdrawn', label: '已撤回'},
];
