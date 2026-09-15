/**
 * @fileoverview Ambient typing for CSS Modules imported by `packages/ui` and
 * `apps/web` (`import styles from './button.module.css'`).
 */

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
