// @ts-check
// Commit message rules from "How to Write a Git Commit Message"
// (https://cbea.ms/git-commit/), as referenced by docs/CODING_STANDARDS.md.
// No Conventional Commits type prefix: subjects read "Add pre-commit hooks".
// Imperative mood cannot be checked mechanically; the reviewer checks it.

/** Git-generated subjects that are exempt (merges, reverts, fixups). */
const GENERATED_SUBJECT = /^(Merge|Revert|fixup!|squash!|amend!) /;

/** @type {import('@commitlint/types').UserConfig} */
export default {
  ignores: [message => GENERATED_SUBJECT.test(message)],
  plugins: [
    {
      rules: {
        'header-capitalized': ({header}) => [
          /^[A-Z]/.test(header ?? ''),
          'subject must start with a capital letter',
        ],
      },
    },
  ],
  rules: {
    'header-capitalized': [2, 'always'],
    'header-max-length': [2, 'always', 50],
    'header-min-length': [2, 'always', 3],
    'header-full-stop': [2, 'never', '.'],
    'header-trim': [2, 'always'],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 72],
    'footer-leading-blank': [2, 'always'],
  },
};
