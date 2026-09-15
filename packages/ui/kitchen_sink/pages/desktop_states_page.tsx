/**
 * @fileoverview `/?page=desktop-states`: the loading, empty, error and ready
 * states (DESIGN.md §5) of each desktop data container: DataTable,
 * ListPanel, TodoPanel and ActivityTimeline, with venue demo data.
 */

import {FileText, SearchX} from 'lucide-react';

import {
  ActivityTimeline,
  Badge,
  Button,
  Card,
  DataTable,
  ListItem,
  ListPanel,
  StatusDot,
  TodoCard,
  TodoPanel,
} from '../../index';
import type {DataState, DataTableColumn} from '../../index';
import {
  ARRIVALS,
  CHANGE_CASES,
  RECENT_ACTIVITY,
  TODOS,
} from '../fixtures/partner_workspace';
import type {ArrivalRow} from '../fixtures/partner_workspace';
import {CatalogueHeader, CatalogueSection, Specimen} from '../layout';
import styles from './desktop_states_page.module.css';

const STATES: readonly DataState[] = ['loading', 'empty', 'error', 'ready'];

const CAPTIONS: Readonly<Record<DataState, string>> = {
  loading: 'loading · 骨架列',
  empty: 'empty · EmptyState 帶原因',
  error: 'error · 載入失敗與重新載入',
  ready: 'ready',
};

const COLUMNS: ReadonlyArray<DataTableColumn<ArrivalRow>> = [
  {id: 'player', header: '玩家', cell: row => row.player},
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

/** Does nothing; the specimens are static. */
function ignore(): void {}

/** Renders the four states of the desktop data containers. */
export function DesktopStatesPage() {
  return (
    <>
      <CatalogueHeader
        title="Desktop data container states"
        description="DataTable、ListPanel、TodoPanel、ActivityTimeline 的 loading／empty／error／ready 四態（DESIGN.md §5）。"
      />

      <CatalogueSection title="DataTable" source="DESIGN.md §4 DataTable">
        <div className={styles['grid']}>
          {STATES.map(state => (
            <Specimen key={state} caption={`${CAPTIONS[state]} · regular`}>
              <Card className={styles['fill']}>
                <DataTable
                  label={`今日到訪（${state}）`}
                  columns={COLUMNS}
                  rows={ARRIVALS}
                  rowKey={row => row.tripId}
                  state={state}
                  emptyReason="今日沒有預計到訪的行程，行程確認後會出現在這裡。"
                  onRetry={ignore}
                />
              </Card>
            </Specimen>
          ))}
          <Specimen caption="ready · dense">
            <Card className={styles['fill']}>
              <DataTable
                label="今日到訪（dense）"
                density="dense"
                columns={COLUMNS}
                rows={ARRIVALS.slice(0, 2)}
                rowKey={row => row.tripId}
                state="ready"
                emptyReason=""
              />
            </Card>
          </Specimen>
          <Specimen caption="empty · 搜尋無結果">
            <Card className={styles['fill']}>
              <DataTable
                label="今日到訪（搜尋無結果）"
                columns={COLUMNS}
                rows={[]}
                rowKey={row => row.tripId}
                state="ready"
                emptyIcon={SearchX}
                emptyReason="找不到符合「TR-260911-099」的玩家，請確認姓名、會員或行程編號。"
                emptyAction={<Button variant="secondary">清除搜尋</Button>}
              />
            </Card>
          </Specimen>
        </div>
      </CatalogueSection>

      <CatalogueSection title="ListPanel" source="DESIGN.md §4 ListPanel">
        <div className={styles['columns']}>
          {STATES.map(state => (
            <Specimen key={state} caption={CAPTIONS[state]}>
              <div className={styles['list-frame']}>
                <ListPanel
                  label={`異動案件（${state}）`}
                  state={state}
                  selectedId={CHANGE_CASES[0].id}
                  onSelect={ignore}
                  emptyReason="此狀態目前沒有異動案件，切換上方分頁查看其他狀態。"
                  onRetry={ignore}
                >
                  {CHANGE_CASES.map(item => (
                    <ListItem
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      badge={
                        <Badge tone={item.status.tone}>
                          {item.status.label}
                        </Badge>
                      }
                      person={item.player}
                      reference={item.tripId}
                      time={item.submitted}
                    />
                  ))}
                </ListPanel>
              </div>
            </Specimen>
          ))}
        </div>
      </CatalogueSection>

      <CatalogueSection title="TodoPanel" source="DESIGN.md §4 TodoPanel">
        <div className={styles['columns']}>
          {STATES.map(state => (
            <Specimen key={state} caption={CAPTIONS[state]}>
              <div className={styles['todo-frame']}>
                <TodoPanel
                  title="待辦事項"
                  state={state}
                  emptyReason="目前沒有待處理的異動申請或押金退還。"
                  onRetry={ignore}
                  meta="最新資料 2026/09/11 11:05 · 韓國時間"
                >
                  {TODOS.slice(0, 2).map(todo => (
                    <TodoCard
                      key={todo.id}
                      icon={FileText}
                      title={todo.title}
                      badge={
                        <Badge tone={todo.status.tone}>
                          {todo.status.label}
                        </Badge>
                      }
                      reference={todo.tripId}
                      details={todo.details}
                      action={<Button fullWidth>{todo.action}</Button>}
                    />
                  ))}
                </TodoPanel>
              </div>
            </Specimen>
          ))}
        </div>
      </CatalogueSection>

      <CatalogueSection
        title="ActivityTimeline"
        source="DESIGN.md §4 ActivityTimeline"
      >
        <div className={styles['grid']}>
          {STATES.map(state => (
            <Specimen key={state} caption={CAPTIONS[state]}>
              <Card className={styles['fill']}>
                <ActivityTimeline
                  label={`最近處理（${state}）`}
                  items={RECENT_ACTIVITY}
                  state={state}
                  emptyReason="今日尚無處理紀錄，完成報到、收押金或異動後會出現在這裡。"
                  onRetry={ignore}
                />
              </Card>
            </Specimen>
          ))}
        </div>
      </CatalogueSection>
    </>
  );
}
