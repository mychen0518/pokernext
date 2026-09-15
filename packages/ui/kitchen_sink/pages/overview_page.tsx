/**
 * @fileoverview `/?page=overview`: the DESIGN.md §3.2 總覽頁 composed from the
 * desktop workspace components with venue demo data, like
 * `docs/design/references/partner-overview.png`. `&state=loading|empty|error`
 * switches every data container on the page to that state.
 */

import {Clock, FileText, ScanLine, User, Users} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {useId, useState} from 'react';

import {
  ActivityTimeline,
  Badge,
  Button,
  Card,
  DataTable,
  KpiRow,
  KpiTile,
  PageGrid,
  PageHeader,
  SearchInput,
  StatusDot,
  Tabs,
  TodoCard,
  TodoPanel,
} from '../../index';
import type {DataTableColumn} from '../../index';
import {
  ARRIVALS,
  ON_ISLAND,
  RECENT_ACTIVITY,
  TODOS,
} from '../fixtures/partner_workspace';
import type {ArrivalRow, TodoFixture} from '../fixtures/partner_workspace';
import type {KitchenSinkPageProps} from '../page_types';
import styles from './overview_page.module.css';
import {readDataState} from './page_state';
import {VenueFrame} from './venue_frame';

const TAB_ROWS: Readonly<Record<string, readonly ArrivalRow[]>> = {
  today: ARRIVALS,
  island: ON_ISLAND,
  checkout: [],
};

const TABS = [
  {id: 'today', label: '今日到訪'},
  {id: 'island', label: '在島玩家'},
  {id: 'checkout', label: '今日退房'},
] as const;

const TAB_EMPTY_REASONS: Readonly<Record<string, string>> = {
  today: '今日沒有預計到訪的行程，行程確認後會出現在這裡。',
  island: '目前沒有在島玩家，完成到場報到後會出現在這裡。',
  checkout: '今日沒有退房的行程，酒店回報退房後會出現在這裡。',
};

const TODO_ICONS: Readonly<Record<TodoFixture['kind'], LucideIcon>> = {
  change: FileText,
  extend: FileText,
  refund: Clock,
};

const COLUMNS: ReadonlyArray<DataTableColumn<ArrivalRow>> = [
  {id: 'player', header: '玩家', cell: row => row.player},
  {
    id: 'member',
    header: '天城會員編號',
    cell: row => row.venueMemberNo,
    mono: true,
  },
  {
    id: 'trip',
    header: '行程與住宿',
    cell: row => row.tripId,
    secondary: row => row.stay,
    mono: true,
  },
  {
    id: 'checkin',
    header: '報到狀態',
    cell: row => (
      <StatusDot tone={row.checkin.tone}>{row.checkin.label}</StatusDot>
    ),
  },
  {
    id: 'deposit',
    header: '押金狀態',
    cell: row => (
      <StatusDot tone={row.deposit.tone}>{row.deposit.label}</StatusDot>
    ),
  },
  {
    id: 'action',
    header: '操作',
    cell: () => (
      <Button variant="secondary" size="sm">
        查看
      </Button>
    ),
  },
];

/** Keeps rows whose player, member number or trip ID contains the query. */
function matches(row: ArrivalRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return [row.player, row.venueMemberNo, row.tripId].some(text =>
    text.toLowerCase().includes(needle),
  );
}

/** Renders the overview page type. */
export function OverviewPage({params}: KitchenSinkPageProps) {
  const state = readDataState(params);
  const [tab, setTab] = useState('today');
  const [query, setQuery] = useState('');
  const recentTitleId = useId();
  const rows = (TAB_ROWS[tab] ?? []).filter(row => matches(row, query));
  const emptyReason =
    query === ''
      ? TAB_EMPTY_REASONS[tab]
      : `找不到符合「${query}」的玩家，請確認姓名、會員或行程編號。`;

  return (
    <VenueFrame
      currentId="overview"
      dateTime="2026/09/11（五）11:05 · 韓國時間"
    >
      <PageHeader
        title="工作總覽"
        description="天城 PokerRoom"
        action={<Button icon={ScanLine}>掃碼報到</Button>}
      />
      <KpiRow label="今日概況">
        <KpiTile icon={Users} label="今日預計到訪" value="08" />
        <KpiTile icon={User} label="在島玩家" value="24" />
        <KpiTile icon={FileText} label="待處理異動" value="05" />
        <KpiTile icon={Clock} label="待退押金" value="03" />
      </KpiRow>
      <PageGrid variant="overview">
        <Card aria-label="到訪名單">
          <Tabs
            label="到訪名單"
            items={TABS}
            selectedId={tab}
            onSelect={setTab}
          >
            <div className={styles['tab-panel']}>
              <SearchInput
                label="搜尋到訪名單"
                placeholder="輸入姓名、會員或行程編號"
                value={query}
                onValueChange={setQuery}
              />
              <DataTable
                label={TABS.find(item => item.id === tab)?.label ?? ''}
                columns={COLUMNS}
                rows={rows}
                rowKey={row => row.tripId}
                state={state}
                emptyReason={emptyReason}
              />
            </div>
          </Tabs>
          <section className={styles['recent']} aria-labelledby={recentTitleId}>
            <header className={styles['section-header']}>
              <h2 id={recentTitleId} className={styles['section-title']}>
                最近處理
              </h2>
              <span className={styles['section-meta']}>時間為韓國時間</span>
              <Button variant="ghost" size="sm">
                查看全部
              </Button>
            </header>
            <ActivityTimeline
              label="最近處理"
              items={RECENT_ACTIVITY}
              state={state}
              emptyReason="今日尚無處理紀錄，完成報到、收押金或異動後會出現在這裡。"
            />
          </section>
        </Card>
        <TodoPanel
          title="待辦事項"
          action={
            <Button variant="ghost" size="sm">
              查看全部
            </Button>
          }
          state={state}
          emptyReason="目前沒有待處理的異動申請或押金退還。"
          meta="最新資料 2026/09/11 11:05 · 韓國時間"
        >
          {TODOS.map(todo => (
            <TodoCard
              key={todo.id}
              icon={TODO_ICONS[todo.kind]}
              title={todo.title}
              badge={<Badge tone={todo.status.tone}>{todo.status.label}</Badge>}
              reference={todo.tripId}
              details={todo.details}
              action={<Button fullWidth>{todo.action}</Button>}
            />
          ))}
        </TodoPanel>
      </PageGrid>
    </VenueFrame>
  );
}
