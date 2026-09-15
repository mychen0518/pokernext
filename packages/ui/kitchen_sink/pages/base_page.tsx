/**
 * @fileoverview `/?page=base`: the DESIGN.md §2 tokens and every variant and
 * state of the 00a base components, imported through the public entry point.
 * Demo values are transcribed from the prototype's seed data.
 */

import {SearchX} from 'lucide-react';
import {useState} from 'react';

import {
  AmountDisplay,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  DateInput,
  Drawer,
  EmptyState,
  InfoBox,
  Input,
  Modal,
  Select,
  StatusDot,
  Tabs,
  Textarea,
  Toast,
} from '../../index';
import type {ButtonVariant, TabItem, Tone} from '../../index';
import {
  CatalogueHeader,
  CatalogueSection,
  Specimen,
  SpecimenRow,
} from '../layout';
import styles from './base_page.module.css';
import {TokenCatalogue} from './token_catalogue';

interface ButtonExample {
  readonly variant: ButtonVariant;
  readonly label: string;
}

const BUTTON_EXAMPLES: readonly ButtonExample[] = [
  {variant: 'primary', label: '掃碼報到'},
  {variant: 'secondary', label: '查看'},
  {variant: 'outline-gold', label: '查看行程'},
  {variant: 'ghost', label: '查看全部'},
  {variant: 'danger', label: '撤回申請'},
];

interface ToneExample {
  readonly tone: Tone;
  readonly dot: string;
  readonly badge: string;
}

const TONE_EXAMPLES: readonly ToneExample[] = [
  {tone: 'success', dot: '已報到', badge: '已收取'},
  {tone: 'warning', dot: '待報到', badge: '待開始'},
  {tone: 'danger', dot: '有差異', badge: '待退還'},
  {tone: 'info', dot: '處理中', badge: '處理中'},
  {tone: 'neutral', dot: '無須押金', badge: '示意資料'},
];

const UNDERLINE_TABS: readonly TabItem[] = [
  {id: 'pending', label: '待處理', count: '02'},
  {id: 'running', label: '執行中', count: '01'},
  {id: 'closed', label: '已結案', count: '12'},
];

const SEGMENTED_TABS: readonly TabItem[] = [
  {id: 'open', label: '進行中'},
  {id: 'done', label: '已完成'},
  {id: 'all', label: '全部'},
];

/** Renders both Tabs variants, each switchable by click or arrow keys. */
function TabsSpecimens() {
  const [underline, setUnderline] = useState('pending');
  const [segmented, setSegmented] = useState('open');
  return (
    <>
      <SpecimenRow label="underline">
        <Specimen caption="頁內 · 帶計數">
          <Tabs
            label="案件狀態"
            items={UNDERLINE_TABS}
            selectedId={underline}
            onSelect={setUnderline}
          />
        </Specimen>
      </SpecimenRow>
      <SpecimenRow label="segmented">
        <Specimen caption="僅手機">
          <div className={styles['phone-width']}>
            <Tabs
              label="任務篩選"
              variant="segmented"
              items={SEGMENTED_TABS}
              selectedId={segmented}
              onSelect={setSegmented}
            />
          </div>
        </Specimen>
      </SpecimenRow>
    </>
  );
}

/** Does nothing; overlays on this page stay open for the catalogue. */
function keepOpen(): void {}

/** Renders the base kitchen-sink page. */
export function BasePage() {
  return (
    <>
      <CatalogueHeader
        title="Tokens and base components"
        description="DESIGN.md §2 tokens 與 00a 基礎元件的全部變體與狀態。"
      />

      <TokenCatalogue />

      <CatalogueSection title="Button" source="DESIGN.md §4 Button">
        {BUTTON_EXAMPLES.map(({variant, label}) => (
          <SpecimenRow key={variant} label={variant}>
            <Specimen caption="default">
              <Button variant={variant}>{label}</Button>
            </Specimen>
            <Specimen caption="hover">
              <Button variant={variant} data-state="hover">
                {label}
              </Button>
            </Specimen>
            <Specimen caption="focus-visible">
              <Button variant={variant} data-state="focus-visible">
                {label}
              </Button>
            </Specimen>
            <Specimen caption="disabled">
              <Button variant={variant} disabled>
                {label}
              </Button>
            </Specimen>
            <Specimen caption="loading">
              <Button variant={variant} loading>
                {label}
              </Button>
            </Specimen>
          </SpecimenRow>
        ))}
        <SpecimenRow label="size">
          <Specimen caption="sm · 32px（表格操作）">
            <Button variant="secondary" size="sm">
              查看
            </Button>
          </Specimen>
          <Specimen caption="md · 44px（桌面）">
            <Button variant="secondary">查看</Button>
          </Specimen>
          <Specimen caption="lg · 52px（手機）">
            <Button variant="outline-gold" size="lg">
              查看行程
            </Button>
          </Specimen>
        </SpecimenRow>
      </CatalogueSection>

      <CatalogueSection title="StatusDot 與 Badge" source="DESIGN.md §4">
        <SpecimenRow label="StatusDot">
          {TONE_EXAMPLES.map(({tone, dot}) => (
            <Specimen key={tone} caption={tone}>
              <StatusDot tone={tone}>{dot}</StatusDot>
            </Specimen>
          ))}
        </SpecimenRow>
        <SpecimenRow label="Badge">
          {TONE_EXAMPLES.map(({tone, badge}) => (
            <Specimen key={tone} caption={tone}>
              <Badge tone={tone}>{badge}</Badge>
            </Specimen>
          ))}
        </SpecimenRow>
      </CatalogueSection>

      <CatalogueSection title="Tabs" source="DESIGN.md §4 Tabs">
        <TabsSpecimens />
      </CatalogueSection>

      <CatalogueSection title="Card" source="DESIGN.md §4 Card">
        <div className={styles['cards']}>
          <Specimen caption="default + CardHeader">
            <Card
              className={styles['fill']}
              header={
                <CardHeader
                  title="資料核對"
                  status={<Badge tone="warning">待確認</Badge>}
                />
              }
            >
              <p className={styles['paragraph']}>
                CHEN, ALEX · TC-008126 · TR-260911-028
              </p>
            </Card>
          </Specimen>
          <Specimen caption="default">
            <Card className={styles['fill']}>
              <p className={styles['paragraph']}>
                濟州君悅酒店 · 09/10 – 09/13 · 3 晚
              </p>
            </Card>
          </Specimen>
          <Specimen caption="elevated">
            <Card variant="elevated" className={styles['fill']}>
              <p className={styles['paragraph']}>接待人 Amy · 韓國時間</p>
            </Card>
          </Specimen>
        </div>
      </CatalogueSection>

      <CatalogueSection
        title="Input、Select、DateInput、Textarea"
        source="DESIGN.md §4"
      >
        <div className={styles['form-grid']}>
          <div className={styles['form-column']}>
            <Input label="玩家姓名" defaultValue="CHEN, ALEX" />
            <Input
              label="押金金額"
              prefix="KRW"
              defaultValue="300,000"
              inputMode="numeric"
            />
            <Input
              label="天城會員編號"
              defaultValue="TC-00812"
              error="會員編號應為 TC- 加六位數字"
            />
            <Input label="搜尋" placeholder="輸入姓名、會員或行程編號" />
          </div>
          <div className={styles['form-column']}>
            <Select label="收取方式" labelPosition="left" defaultValue="cash">
              <option value="cash">現金</option>
              <option value="card">信用卡預授權</option>
            </Select>
            <DateInput
              label="申請續住至"
              labelPosition="left"
              defaultValue="2026-09-14"
            />
            <Textarea
              label="處理說明"
              labelPosition="left"
              maxLength={200}
              defaultValue="已與玩家確認續住一晚，房型不變。"
            />
          </div>
        </div>
      </CatalogueSection>

      <CatalogueSection
        title="Checkbox、InfoBox、AmountDisplay"
        source="DESIGN.md §4"
      >
        <SpecimenRow label="Checkbox">
          <Specimen caption="unchecked">
            <Checkbox label="本人核對一致" />
          </Specimen>
          <Specimen caption="checked">
            <Checkbox label="勾選後樣式" defaultChecked />
          </Specimen>
          <Specimen caption="disabled">
            <Checkbox label="無法勾選" disabled />
          </Specimen>
        </SpecimenRow>
        <SpecimenRow label="InfoBox">
          <InfoBox title="示意資料">
            本頁數值取自原型示範資料，不是正式紀錄。
          </InfoBox>
        </SpecimenRow>
        <SpecimenRow label="AmountDisplay">
          <AmountDisplay label="押金金額" currency="KRW" amount={300000} />
        </SpecimenRow>
      </CatalogueSection>

      <CatalogueSection title="EmptyState" source="DESIGN.md §4 EmptyState">
        <div className={styles['cards']}>
          <Card className={styles['fill']}>
            <EmptyState reason="本次行程尚未建立，建立後會顯示在這裡。" />
          </Card>
          <Card className={styles['fill']}>
            <EmptyState
              icon={SearchX}
              reason="找不到符合「TR-260911-099」的行程，請確認編號。"
              action={<Button variant="secondary">清除搜尋</Button>}
            />
          </Card>
        </div>
      </CatalogueSection>

      <CatalogueSection title="Toast" source="DESIGN.md §4 Toast">
        <SpecimenRow label="Toast">
          <Specimen caption="success">
            <Toast tone="success" title="押金已收取">
              TR-260911-029 · 2026/09/11 10:30 · 韓國時間
            </Toast>
          </Specimen>
          <Specimen caption="error">
            <Toast tone="error" title="儲存失敗">
              網路連線中斷，資料尚未送出，請稍後再試。
            </Toast>
          </Specimen>
        </SpecimenRow>
      </CatalogueSection>

      <CatalogueSection title="Modal 與 Drawer" source="DESIGN.md §4">
        <div className={styles['overlays']}>
          <Specimen caption="Modal">
            <div className={styles['overlay-frame']}>
              <Modal
                open
                title="確認收取押金"
                onClose={keepOpen}
                actions={
                  <>
                    <Button variant="secondary">取消</Button>
                    <Button>確認收取</Button>
                  </>
                }
              >
                <AmountDisplay
                  label="押金金額"
                  currency="KRW"
                  amount={300000}
                />
                <p className={styles['paragraph']}>
                  CHEN, ALEX · TR-260911-028
                </p>
              </Modal>
            </div>
          </Specimen>
          <Specimen caption="Drawer">
            <div className={styles['overlay-frame']}>
              <Drawer
                open
                title="續住申請"
                onClose={keepOpen}
                actions={
                  <>
                    <Button variant="secondary">稍後處理</Button>
                    <Button>開始執行</Button>
                  </>
                }
              >
                <p className={styles['paragraph']}>
                  申請人 KIM, JISOO · TR-260909-017
                </p>
                <p className={styles['paragraph']}>原退房日 2026/09/12</p>
              </Drawer>
            </div>
          </Specimen>
        </div>
      </CatalogueSection>
    </>
  );
}
