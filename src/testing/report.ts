import type {CaseResult, ChannelResult, SuiteResult} from './runner';

/**
 * Human-readable rendering of run results. Kept separate from the runner so the
 * runner stays pure data and a port can format however it likes.
 */

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[90m';
const RESET = '\x1b[0m';

const color = (on: boolean, c: string, s: string): string => (on ? c + s + RESET : s);

const show = (value: unknown): string => {
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    // Printed-tree channels (cstPrint/trace): show as the rendered tree.
    return '\n' + (value as string[]).map((l) => '    ' + l).join('\n');
  }
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
};

const channelLine = (ch: ChannelResult, c: boolean): string => {
  if (ch.status === 'fail') {
    return (
      color(c, RED, `      ${ch.channel}: mismatch`) +
      color(c, DIM, `\n      expected `) +
      show(ch.expected) +
      color(c, DIM, `\n      actual   `) +
      show(ch.actual)
    );
  }
  if (ch.status === 'missing') {
    return color(c, YELLOW, `      ${ch.channel}: no snapshot stored — run with --update`);
  }
  return '';
};

/** One line (plus any diff) for a single case. */
export const formatCase = (res: CaseResult, useColor = true): string => {
  if (res.status === 'skip') return color(useColor, DIM, `  - ${res.name} (skipped)`);
  if (res.status === 'pass') return color(useColor, GREEN, `  ✓ ${res.name}`);
  const head = color(useColor, RED, `  ✗ ${res.name}`);
  if (res.error) return head + color(useColor, RED, `\n      threw: ${res.error}`);
  const details = res.channels
    .map((ch) => channelLine(ch, useColor))
    .filter(Boolean)
    .join('\n');
  return head + (details ? '\n' + details : '');
};

/** Full suite rendering with a trailing summary line. */
export const formatSuite = (res: SuiteResult, useColor = true): string => {
  const lines: string[] = [];
  if (res.describe) lines.push(res.describe);
  for (const c of res.cases) lines.push(formatCase(c, useColor));
  const summary =
    `  ${res.pass} passed` +
    (res.fail ? `, ${res.fail} failed` : '') +
    (res.skip ? `, ${res.skip} skipped` : '') +
    (res.updated ? ` (snapshots updated)` : '');
  lines.push(color(useColor, res.fail ? RED : GREEN, summary));
  return lines.join('\n');
};
