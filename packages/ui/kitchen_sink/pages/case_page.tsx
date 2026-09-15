/**
 * @fileoverview `/?page=case`: the DESIGN.md §3.2 案件頁 composed from the
 * desktop workspace components with venue demo data, like
 * `docs/design/references/partner-change-requests.png`.
 * `&state=loading|empty|error` switches the case list to that state.
 */

import {FileText} from 'lucide-react';
import {useState} from 'react';

import {
  Badge,
  Button,
  Card,
  Checkbox,
  DetailPanel,
  EmptyState,
  InfoBox,
  KeyValueList,
  ListItem,
  ListPanel,
  PageGrid,
  PageHeader,
  SearchInput,
  StatusDot,
  Stepper,
  Tabs,
  Textarea,
} from '../../index';
import {CASE_TABS, CHANGE_CASES} from '../fixtures/partner_workspace';
import type {CaseStage, ChangeCase} from '../fixtures/partner_workspace';
import type {KitchenSinkPageProps} from '../page_types';
import styles from './case_page.module.css';
import {readDataState} from './page_state';
import {VenueFrame} from './venue_frame';

/** Formats a tab count as two digits, as on the reference, or none. */
function countOf(stage: CaseStage): string | undefined {
  const count = CHANGE_CASES.filter(item => item.stage === stage).length;
  return count === 0 ? undefined : String(count).padStart(2, '0');
}

/** Keeps cases whose member number, trip ID or player contains the query. */
function matches(item: ChangeCase, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return [item.player, item.venueMemberNo, item.tripId, item.id].some(text =>
    text.toLowerCase().includes(needle),
  );
}

interface CaseDetailProps {
  item: ChangeCase;
}

/** Renders the DetailPanel of one change request. */
function CaseDetail({item}: CaseDetailProps) {
  return (
    <DetailPanel
      label="案件詳情"
      title={item.title}
      badge={<Badge tone={item.status.tone}>{item.status.label}</Badge>}
      referenceLabel="案件編號"
      referenceId={item.id}
      actions={
        <>
          <Button>已完成</Button>
          <Button variant="secondary">儲存說明</Button>
        </>
      }
      meta={`最後更新 ${item.lastUpdated}`}
    >
      <KeyValueList
        items={[
          {label: '玩家', value: item.player},
          {label: '天城會員編號', value: item.venueMemberNo, mono: true},
          {label: '行程編號', value: item.tripId, mono: true},
          {
            label: '住宿確認編號',
            value: item.hotelConfirmationNo,
            mono: true,
            action: (
              <Button variant="ghost" size="sm">
                檢視確認單
              </Button>
            ),
          },
        ]}
      />
      <div className={styles['request-group']}>
        <Card variant="elevated">
          <div className={styles['request']}>
            <KeyValueList
              variant="stacked"
              items={[{label: '目前住宿', value: item.currentStay}]}
            />
            <KeyValueList
              variant="stacked"
              items={[{label: '申請內容', value: item.request}]}
            />
          </div>
        </Card>
        <KeyValueList
          variant="compact"
          items={[
            {
              label: '酒店入住',
              value: (
                <StatusDot tone={item.hotelCheckin.tone}>
                  {item.hotelCheckin.label}
                </StatusDot>
              ),
            },
          ]}
        />
      </div>
      <section className={styles['section']}>
        <h3 className={styles['section-title']}>處理進度</h3>
        <Stepper label="處理進度" steps={item.steps} />
      </section>
      <section className={styles['section']}>
        <h3 className={styles['section-title']}>{item.resultTitle}</h3>
        <div className={styles['result']}>
          <div className={styles['result-form']}>
            <Checkbox label={item.resultConfirmation} />
            <Textarea
              label="處理說明"
              labelPosition="left"
              maxLength={200}
              defaultValue={item.resultNote}
            />
          </div>
          <InfoBox title="玩家端目前顯示">{item.playerSees}</InfoBox>
        </div>
      </section>
    </DetailPanel>
  );
}

/** Renders the case page type. */
export function CasePage({params}: KitchenSinkPageProps) {
  const state = readDataState(params);
  const [stage, setStage] = useState<CaseStage>('inProgress');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(CHANGE_CASES[0].id);
  const cases = CHANGE_CASES.filter(
    item => item.stage === stage && matches(item, query),
  );
  const selected =
    state === 'ready' ? cases.find(item => item.id === selectedId) : undefined;

  return (
    <VenueFrame currentId="changes" dateTime="2026/09/11（五）11:05 · 韓國時間">
      <PageHeader
        title="行程異動"
        description="處理玩家行程、住宿與相關異動申請"
      />
      <Tabs
        label="案件狀態"
        items={CASE_TABS.map(tab => ({...tab, count: countOf(tab.id)}))}
        selectedId={stage}
        onSelect={id => {
          const next = CASE_TABS.find(tab => tab.id === id);
          if (next !== undefined) {
            setStage(next.id);
          }
        }}
      >
        <div className={styles['tab-panel']}>
          <PageGrid variant="case">
            <ListPanel
              label="異動案件"
              search={
                <SearchInput
                  label="搜尋異動案件"
                  placeholder="輸入會員或行程編號"
                  value={query}
                  onValueChange={setQuery}
                />
              }
              state={state}
              selectedId={selected?.id}
              onSelect={setSelectedId}
              emptyReason={
                query === ''
                  ? '此狀態目前沒有異動案件，切換上方分頁查看其他狀態。'
                  : `找不到符合「${query}」的案件，請確認會員或行程編號。`
              }
            >
              {cases.map(item => (
                <ListItem
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  badge={
                    <Badge tone={item.status.tone}>{item.status.label}</Badge>
                  }
                  person={item.player}
                  reference={item.tripId}
                  time={item.submitted}
                />
              ))}
            </ListPanel>
            {selected === undefined ? (
              <Card aria-label="案件詳情">
                <EmptyState
                  icon={FileText}
                  reason="從左側清單選擇一個案件，查看申請內容與處理進度。"
                />
              </Card>
            ) : (
              <CaseDetail key={selected.id} item={selected} />
            )}
          </PageGrid>
        </div>
      </Tabs>
    </VenueFrame>
  );
}
