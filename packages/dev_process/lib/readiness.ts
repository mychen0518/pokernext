/**
 * @fileoverview Waiting for a local server: whether a port is taken, whether
 * a URL answers 200, and polling until a started server does, failing fast
 * when its process exits.
 */

import type {ChildProcess} from 'node:child_process';
import {request} from 'node:http';
import {createConnection} from 'node:net';

/**
 * How long a started `next dev` may take to answer its health check: the
 * first request compiles the app.
 */
export const READY_TIMEOUT_MILLISECONDS = 180_000;

/** Pause between two readiness checks. */
const POLL_MILLISECONDS = 500;

/** Time allowed for one readiness request. */
const REQUEST_TIMEOUT_MILLISECONDS = 10_000;

/** Lines of output kept for an error message by default. */
const DEFAULT_OUTPUT_TAIL_LINES = 40;

/** A started server process being waited on. */
export interface ServerProcess {
  readonly child: ChildProcess;
  /** Names it in errors, such as `next dev` or `pnpm demo`. */
  readonly name: string;
  /** Its latest output for errors; omit when its output is not piped. */
  outputTail?(): string;
}

/** Options for {@link waitUntilAnswering}. */
export interface WaitUntilAnsweringOptions {
  /** Defaults to {@link READY_TIMEOUT_MILLISECONDS}. */
  readonly timeoutMilliseconds?: number;
}

/**
 * Collects the last lines a child prints on its piped stdout and stderr and
 * returns a function that reads them.
 */
export function keepOutputTail(
  child: ChildProcess,
  maxLines: number = DEFAULT_OUTPUT_TAIL_LINES,
): () => string {
  const lines: string[] = [];
  const keep = (chunk: unknown) => {
    lines.push(...String(chunk).split(/\r?\n/).filter(Boolean));
    lines.splice(0, Math.max(0, lines.length - maxLines));
  };
  child.stdout?.on('data', keep);
  child.stderr?.on('data', keep);
  return () => lines.join('\n');
}

/**
 * Polls the URL until it answers 200. Fails as soon as the server process
 * exits, or when the timeout passes; both errors carry its latest output.
 */
export async function waitUntilAnswering(
  server: ServerProcess,
  url: string,
  {
    timeoutMilliseconds = READY_TIMEOUT_MILLISECONDS,
  }: WaitUntilAnsweringOptions = {},
): Promise<void> {
  const withOutput = (message: string) => {
    const output = server.outputTail?.() ?? '';
    return output === '' ? message : `${message}:\n${output}`;
  };
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    const {exitCode, signalCode} = server.child;
    if (exitCode !== null || signalCode !== null) {
      const how =
        exitCode === null ? `signal ${signalCode}` : `code ${exitCode}`;
      throw new Error(withOutput(`${server.name} exited with ${how}`));
    }
    if (await answersOk(url)) {
      return;
    }
    await new Promise(resolve => {
      setTimeout(resolve, POLL_MILLISECONDS);
    });
  }
  throw new Error(
    withOutput(`${url} did not answer 200 within ${timeoutMilliseconds} ms`),
  );
}

/**
 * Tells whether a GET of the URL answers 200. A `*.localhost` URL is requested
 * at 127.0.0.1 with its own `Host` header, because Node does not resolve
 * `*.localhost` names on every platform.
 */
export function answersOk(url: string): Promise<boolean> {
  const target = new URL(url);
  const address = target.hostname.endsWith('.localhost')
    ? '127.0.0.1'
    : target.hostname;
  return new Promise(resolve => {
    const outgoing = request(
      {
        host: address,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        headers: {host: target.host},
        timeout: REQUEST_TIMEOUT_MILLISECONDS,
      },
      response => {
        response.resume();
        resolve(response.statusCode === 200);
      },
    );
    outgoing.once('timeout', () => outgoing.destroy());
    outgoing.once('error', () => resolve(false));
    outgoing.end();
  });
}

/** Tells whether something accepts TCP connections on the address. */
export function isListening(host: string, port: number): Promise<boolean> {
  return new Promise(resolve => {
    const socket = createConnection({host, port});
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}
