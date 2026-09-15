/**
 * @fileoverview `/?page=operation`: the DESIGN.md §3.2 作業頁 composed from
 * the desktop workspace components with venue demo data, like
 * `docs/design/references/partner-checkin.png`. Confirmation boxes start
 * unchecked: a fact confirmation is never pre-checked.
 */

import {BedDouble, Clock, MapPin, ScanLine} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';

import {
  AmountDisplay,
  Button,
  Card,
  CardHeader,
  Checkbox,
  InfoBox,
  Input,
  KeyValueList,
  PageGrid,
  PageHeader,
  ResultBanner,
  StatusDot,
} from '../../index';
import type {Tone} from '../../index';
import {DEPOSIT_FACTS, SCANNED_TRIP} from '../fixtures/partner_workspace';
import styles from './operation_page.module.css';
import {VenueFrame} from './venue_frame';

interface TripStatusProps {
  icon: LucideIcon;
  label: string;
  tone: Tone;
  status: string;
}

/** Renders one of the two trip status boxes: hotel stay or PokerRoom. */
function TripStatus({icon: Icon, label, tone, status}: TripStatusProps) {
  return (
    <div className={styles['trip-status']}>
      <Icon
        className={styles['trip-status-icon']}
        aria-hidden="true"
        size={24}
        strokeWidth={1.5}
        absoluteStrokeWidth
      />
      <div>
        <p className={styles['trip-status-label']}>{label}</p>
        <StatusDot tone={tone}>{status}</StatusDot>
      </div>
    </div>
  );
}

/** Renders the operation page type. */
export function OperationPage() {
  return (
    <VenueFrame currentId="checkin" dateTime="2026/09/11（五）11:08 · 韓國時間">
      <PageHeader
        title="到場報到"
        description="掃描確認玩家身份，並完成到場與押金作業。"
        action={
          <Button variant="secondary" icon={ScanLine}>
            掃描下一位
          </Button>
        }
      />
      <ResultBanner
        tone="success"
        title="掃碼成功"
        referenceLabel="本次行程"
        referenceId="TR-260911-028"
        status={<StatusDot tone="warning">待確認到場</StatusDot>}
      />
      <PageGrid variant="operation">
        <Card
          aria-label="玩家與行程資料"
          header={<CardHeader title="玩家與行程資料" />}
          meta={<span>掃碼時間 2026/09/11 11:08 · 韓國時間</span>}
        >
          <div className={styles['column']}>
            <p className={styles['person-name']}>CHEN, ALEX</p>
            <KeyValueList items={SCANNED_TRIP} />
            <div className={styles['group']}>
              <p className={styles['group-label']}>行程狀態</p>
              <div className={styles['trip-statuses']}>
                <TripStatus
                  icon={BedDouble}
                  label="酒店入住"
                  tone="neutral"
                  status="尚未入住"
                />
                <TripStatus
                  icon={MapPin}
                  label="PokerRoom"
                  tone="warning"
                  status="待報到"
                />
              </div>
            </div>
            <Checkbox label="本人與行程資料核對一致" />
            <Button fullWidth>確認到場報到</Button>
          </div>
        </Card>
        <Card
          aria-label="押金收取"
          header={
            <CardHeader
              title="押金收取"
              status={<StatusDot tone="warning">待收取</StatusDot>}
            />
          }
          meta={
            <>
              <span>
                接待人 <span className={styles['meta-value']}>Amy</span>
              </span>
              <Button variant="ghost" size="sm">
                聯繫接待人
              </Button>
            </>
          }
        >
          <div className={styles['column']}>
            <KeyValueList items={DEPOSIT_FACTS} />
            <div className={styles['amount']}>
              <AmountDisplay label="應收押金" currency="KRW" amount={300000} />
            </div>
            <InfoBox title="收款方：天城 PokerRoom">
              玩家於現場直接向天城 PokerRoom 支付押金。
            </InfoBox>
            <div className={styles['form']}>
              <Input
                label="實收金額"
                labelPosition="left"
                prefix="KRW"
                defaultValue="300,000"
                inputMode="numeric"
              />
              <Input
                label="收款時間（韓國時間）"
                labelPosition="left"
                defaultValue="2026/09/11 11:08"
              />
            </div>
            <Button fullWidth>已收到押金</Button>
            <p className={styles['hint']}>
              <Clock aria-hidden="true" size={16} strokeWidth={1.5} />
              尚未記錄收款
            </p>
          </div>
        </Card>
      </PageGrid>
    </VenueFrame>
  );
}
