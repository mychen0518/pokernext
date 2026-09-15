/**
 * @fileoverview Joins CSS Module class names, skipping the ones switched off.
 */

/** Joins the truthy class names with single spaces. */
export function classNames(
  ...names: Array<string | false | undefined>
): string {
  return names.filter(Boolean).join(' ');
}
