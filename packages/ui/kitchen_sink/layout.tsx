/**
 * @fileoverview Catalogue layout pieces shared by kitchen-sink pages: a page
 * header, titled sections and captioned specimens.
 */

import type {ReactNode} from 'react';

import styles from './layout.module.css';

interface PageHeaderProps {
  title: string;
  description: string;
}

/** Renders the kitchen-sink page title and a one-line description. */
export function CatalogueHeader({title, description}: PageHeaderProps) {
  return (
    <header className={styles['page-header']}>
      <h1 className={styles['page-title']}>{title}</h1>
      <p className={styles['page-description']}>{description}</p>
    </header>
  );
}

interface SectionProps {
  title: string;
  /** DESIGN.md reference, e.g. `§4 Button`. */
  source: string;
  children: ReactNode;
}

/** Renders one titled catalogue section. */
export function CatalogueSection({title, source, children}: SectionProps) {
  return (
    <section className={styles['section']}>
      <header className={styles['section-header']}>
        <h2 className={styles['section-title']}>{title}</h2>
        <span className={styles['section-source']}>{source}</span>
      </header>
      {children}
    </section>
  );
}

interface SpecimenProps {
  caption: string;
  children: ReactNode;
}

/** Renders one example with a caption naming its variant or state. */
export function Specimen({caption, children}: SpecimenProps) {
  return (
    <figure className={styles['specimen']}>
      <div className={styles['specimen-body']}>{children}</div>
      <figcaption className={styles['caption']}>{caption}</figcaption>
    </figure>
  );
}

interface SpecimenRowProps {
  /** Row heading, e.g. the variant name. */
  label?: string;
  children: ReactNode;
}

/** Renders specimens side by side, wrapping on narrow screens. */
export function SpecimenRow({label, children}: SpecimenRowProps) {
  return (
    <div className={styles['row']}>
      {label === undefined ? undefined : (
        <div className={styles['row-label']}>{label}</div>
      )}
      <div className={styles['row-items']}>{children}</div>
    </div>
  );
}
