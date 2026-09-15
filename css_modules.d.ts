/**
 * @fileoverview Ambient typing for CSS Modules imported by `packages/ui` and
 * `apps/web` (`import styles from './button.module.css'`), and for plain
 * side-effect stylesheet imports (`import '@pokernext/ui/tokens.css'`).
 */

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

// Plain stylesheets export nothing; only `import './x.css'` type-checks.
declare module '*.css' {}
