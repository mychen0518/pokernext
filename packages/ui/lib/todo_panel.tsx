/**
 * @fileoverview `TodoPanel` and `TodoCard` from DESIGN.md §4: the stacked
 * to-do cards in the side column of a 總覽頁, with the panel's loading,
 * empty, error and ready states.
 */

'use client';

import type {LucideIcon} from 'lucide-react';
import {Children, useId} from 'react';
import type {ReactNode} from 'react';

import {ErrorState, LOADING_LABEL, SkeletonBar} from './container_states';
import type {ContainerErrorProps} from './container_states';
import type {DataState} from './data_state';
import {EmptyState} from './empty_state';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import {KeyValueList} from './key_value_list';
import type {KeyValueItem} from './key_value_list';
import styles from './todo_panel.module.css';
import hidden from './visually_hidden.module.css';

/** Number of skeleton cards while loading. */
const SKELETON_CARDS = 2;

/** Props for {@link TodoPanel}. */
export interface TodoPanelProps extends ContainerErrorProps {
  /** Panel title and accessible name, such as 待辦事項. */
  title: string;
  /** Right-hand header action, such as a ghost 查看全部 Button. */
  action?: ReactNode;
  state: DataState;
  /** Why there is nothing to do, such as 目前沒有待處理的異動或退款. */
  emptyReason: ReactNode;
  /** `label`-size line at the bottom, such as 最新資料 11:05 · 韓國時間. */
  meta?: ReactNode;
  /** The cards: {@link TodoCard} elements. */
  children?: ReactNode;
}

/** Renders the to-do side panel. */
export function TodoPanel({
  title,
  action,
  state,
  emptyReason,
  errorReason,
  onRetry,
  meta,
  children,
}: TodoPanelProps) {
  const titleId = useId();
  let body: ReactNode;
  if (state === 'error') {
    body = <ErrorState errorReason={errorReason} onRetry={onRetry} />;
  } else if (
    state === 'empty' ||
    (state === 'ready' && Children.count(children) === 0)
  ) {
    body = <EmptyState reason={emptyReason} />;
  } else if (state === 'loading') {
    body = (
      <div className={styles['cards']} aria-busy="true">
        <span className={hidden['visually-hidden']}>{LOADING_LABEL}</span>
        {Array.from({length: SKELETON_CARDS}, (_, index) => (
          <div key={index} className={styles['skeleton-card']}>
            <SkeletonBar size="medium" />
            <SkeletonBar size="short" />
            <SkeletonBar size="wide" />
            <SkeletonBar size="wide" />
          </div>
        ))}
      </div>
    );
  } else {
    body = <div className={styles['cards']}>{children}</div>;
  }
  return (
    <section className={styles['todo-panel']} aria-labelledby={titleId}>
      <header className={styles['header']}>
        <h2 id={titleId} className={styles['title']}>
          {title}
        </h2>
        {action}
      </header>
      {body}
      {meta === undefined ? undefined : (
        <p className={styles['meta']}>{meta}</p>
      )}
    </section>
  );
}

/** Props for {@link TodoCard}. */
export interface TodoCardProps {
  /** Outline icon from `lucide-react` for the kind of task. */
  icon: LucideIcon;
  /** Task kind, such as 取消申請. */
  title: string;
  /** Status `Badge` after the title. */
  badge?: ReactNode;
  /** Related ID in `mono` under the title, such as `TR-260912-032`. */
  reference?: string;
  /** Two or three facts, shown as a compact KeyValueList. */
  details: readonly KeyValueItem[];
  /** The card's one full-width primary `Button`. */
  action: ReactNode;
}

/** Renders one to-do card. */
export function TodoCard({
  icon: Icon,
  title,
  badge,
  reference,
  details,
  action,
}: TodoCardProps) {
  return (
    <article className={styles['todo-card']}>
      <header className={styles['card-header']}>
        <Icon
          className={styles['icon']}
          aria-hidden="true"
          size={ICON_SIZE.title}
          strokeWidth={ICON_STROKE_WIDTH}
          absoluteStrokeWidth
        />
        <div className={styles['card-heading']}>
          <div className={styles['title-row']}>
            <h3 className={styles['card-title']}>{title}</h3>
            {badge}
          </div>
          {reference === undefined ? undefined : (
            <p className={styles['reference']}>{reference}</p>
          )}
        </div>
      </header>
      <div className={styles['details']}>
        <KeyValueList variant="compact" items={details} />
      </div>
      <div className={styles['action']}>{action}</div>
    </article>
  );
}
