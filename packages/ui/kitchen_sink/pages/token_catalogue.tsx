/**
 * @fileoverview Token area of the base kitchen-sink page: every DESIGN.md §2
 * colour, type, spacing, radius, shadow and focus token with its name, its
 * live value from tokens.css and a sample.
 */

import {useEffect, useState} from 'react';

import {CatalogueSection} from '../layout';
import styles from './token_catalogue.module.css';

interface ColourGroup {
  readonly title: string;
  readonly tokens: readonly string[];
}

const COLOUR_GROUPS: readonly ColourGroup[] = [
  {
    title: '背景明度階',
    tokens: [
      'bg',
      'surface',
      'surface-2',
      'surface-3',
      'border',
      'border-strong',
    ],
  },
  {title: '文字', tokens: ['text', 'text-2', 'text-3', 'text-inverse']},
  {title: '品牌金', tokens: ['gold', 'gold-bright', 'gold-dim', 'gold-tint']},
  {
    title: '語意色',
    tokens: [
      'success',
      'success-tint',
      'warning',
      'warning-tint',
      'danger',
      'danger-tint',
      'info',
      'info-tint',
      'neutral',
      'neutral-tint',
    ],
  },
  {title: '遮罩', tokens: ['scrim']},
];

interface TypeToken {
  readonly name: string;
  readonly use: string;
  readonly sample: string;
}

const TYPE_TOKENS: readonly TypeToken[] = [
  {name: 'display-xl', use: '手機 Hero 目的地標題', sample: '濟州島'},
  {name: 'display-lg', use: '積分、押金等關鍵數字', sample: '30,000'},
  {name: 'display-md', use: 'KPI 數字、詳情頁人名', sample: '24'},
  {name: 'title-lg', use: '頁面標題', sample: '工作總覽'},
  {name: 'title-md', use: '卡片標題、詳情標題', sample: '待辦事項'},
  {name: 'title-sm', use: '區塊標題、列表項標題', sample: '取消申請'},
  {
    name: 'body',
    use: '一般內文、表格值',
    sample: '玩家 LIN, MAY 已完成 PokerRoom 到場報到',
  },
  {name: 'body-sm', use: '次要內文、表頭', sample: '已確認現場押金收取'},
  {
    name: 'label',
    use: '欄位 label、時間戳',
    sample: '2026/09/11 11:08 · 韓國時間',
  },
  {
    name: 'overline',
    use: '英文副標、section eyebrow',
    sample: 'Jeju · Partner workspace',
  },
  {name: 'mono', use: 'UUID、編號', sample: 'TR-260911-028'},
];

const FONT_TOKENS = ['sans', 'serif', 'mono'] as const;
const SPACE_TOKENS = ['1', '2', '3', '4', '5', '6', '8', '10'] as const;
const RADIUS_TOKENS = ['sm', 'md', 'lg', 'round'] as const;

/** Reads the value of a custom property as declared on `:root`. */
function useTokenValue(name: string): string {
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue(
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    );
  }, [name]);
  return value;
}

/** Shows a token's live value in the mono style. */
function TokenValue({name}: {name: string}) {
  return <span className={styles['token-value']}>{useTokenValue(name)}</span>;
}

function TypeSpec({name}: {name: string}) {
  const size = useTokenValue(`--pn-type-${name}-size`);
  const line = useTokenValue(`--pn-type-${name}-line`);
  const weight = useTokenValue(`--pn-type-${name}-weight`);
  return (
    <span className={styles['token-value']}>
      {size} / {line} / {weight}
    </span>
  );
}

/** Renders the whole token area. */
export function TokenCatalogue() {
  return (
    <>
      <CatalogueSection title="色彩 Colour" source="DESIGN.md §2.1">
        <div className={styles['groups']}>
          {COLOUR_GROUPS.map(group => (
            <div key={group.title}>
              <h3 className={styles['group-title']}>{group.title}</h3>
              <div className={styles['swatches']}>
                {group.tokens.map(token => (
                  <figure key={token} className={styles['swatch']}>
                    <div
                      className={`${styles['chip']} ${styles[`fill-${token}`]}`}
                    />
                    <figcaption>
                      <div className={styles['token-name']}>--pn-{token}</div>
                      <TokenValue name={`--pn-${token}`} />
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CatalogueSection>

      <CatalogueSection title="字體 Typography" source="DESIGN.md §2.2">
        <dl className={styles['type-list']}>
          {FONT_TOKENS.map(font => (
            <div key={font} className={styles['type-row']}>
              <dt className={styles['type-meta']}>
                <span className={styles['token-name']}>--pn-font-{font}</span>
              </dt>
              <dd className={styles['type-sample']}>
                <TokenValue name={`--pn-font-${font}`} />
              </dd>
            </div>
          ))}
        </dl>
        <dl className={styles['type-list']}>
          {TYPE_TOKENS.map(token => (
            <div key={token.name} className={styles['type-row']}>
              <dt className={styles['type-meta']}>
                <span className={styles['token-name']}>
                  --pn-type-{token.name}-*
                </span>
                <TypeSpec name={token.name} />
                <span className={styles['token-value']}>{token.use}</span>
              </dt>
              <dd
                className={`${styles['type-sample']} ${styles[`type-${token.name}`]}`}
              >
                {token.sample}
              </dd>
            </div>
          ))}
        </dl>
      </CatalogueSection>

      <CatalogueSection title="間距 Spacing" source="DESIGN.md §2.3">
        <div className={styles['scale-list']}>
          {SPACE_TOKENS.map(step => (
            <div key={step} className={styles['scale-row']}>
              <span>
                <span className={styles['token-name']}>--pn-space-{step}</span>{' '}
                <TokenValue name={`--pn-space-${step}`} />
              </span>
              <div
                className={`${styles['space-bar']} ${styles[`space-${step}`]}`}
              />
            </div>
          ))}
        </div>
      </CatalogueSection>

      <CatalogueSection title="圓角 Radius" source="DESIGN.md §2.3">
        <div className={styles['swatches']}>
          {RADIUS_TOKENS.map(radius => (
            <figure key={radius} className={styles['swatch']}>
              <div
                className={`${styles['radius-box']} ${styles[`radius-${radius}`]}`}
              />
              <figcaption>
                <div className={styles['token-name']}>--pn-radius-{radius}</div>
                <TokenValue name={`--pn-radius-${radius}`} />
              </figcaption>
            </figure>
          ))}
        </div>
      </CatalogueSection>

      <CatalogueSection
        title="陰影與焦點 Shadow and focus"
        source="DESIGN.md §2.3、§6"
      >
        <div className={styles['swatches']}>
          <figure className={styles['swatch']}>
            <div
              className={`${styles['elevation-box']} ${styles['shadow-none']}`}
            >
              Card
            </div>
            <figcaption>
              <div className={styles['token-name']}>--pn-shadow</div>
              <TokenValue name="--pn-shadow" />
            </figcaption>
          </figure>
          <figure className={styles['swatch']}>
            <div
              className={`${styles['elevation-box']} ${styles['shadow-overlay']}`}
            >
              Modal / Drawer
            </div>
            <figcaption>
              <div className={styles['token-name']}>--pn-shadow-overlay</div>
              <TokenValue name="--pn-shadow-overlay" />
            </figcaption>
          </figure>
          <figure className={styles['swatch']}>
            <div className={styles['focus-box']}>focus-visible</div>
            <figcaption>
              <div className={styles['token-name']}>--pn-focus-ring</div>
              <TokenValue name="--pn-focus-ring" />
            </figcaption>
          </figure>
        </div>
      </CatalogueSection>
    </>
  );
}
