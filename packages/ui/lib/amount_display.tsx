/**
 * @fileoverview `AmountDisplay` from DESIGN.md §4: a label on the left, then
 * the currency code and the amount as a large gold number.
 */

import type {ReactNode} from 'react';

import styles from './amount_display.module.css';

/** Props for {@link AmountDisplay}. */
export interface AmountDisplayProps {
  label: ReactNode;
  /** ISO 4217 currency code shown in front of the amount, such as `KRW`. */
  currency: string;
  /** Whole amount in the currency's display unit, such as `300000`. */
  amount: number;
}

const AMOUNT_FORMAT = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

/**
 * Renders a money amount in the DESIGN.md §5 format: `KRW 300,000` (currency
 * prefix and thousands separators).
 */
export function AmountDisplay({label, currency, amount}: AmountDisplayProps) {
  return (
    <div className={styles['amount-display']}>
      <span className={styles['label']}>{label}</span>
      <span className={styles['value']}>
        <span className={styles['currency']}>{currency}</span>
        <span className={styles['amount']}>{AMOUNT_FORMAT.format(amount)}</span>
      </span>
    </div>
  );
}
