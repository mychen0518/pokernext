/**
 * @fileoverview Local servers started for the demo and HTTP tests: the tool
 * waits until one answers, gives up with its output when it dies, reaches
 * `*.localhost` hosts on loopback, and stops a server with its workers.
 */

import {type ChildProcess, spawn} from 'node:child_process';
import {createServer, type Server} from 'node:http';
import type {AddressInfo} from 'node:net';

import {afterEach, describe, expect, it, onTestFinished} from 'vitest';

import {
  answersOk,
  isListening,
  keepOutputTail,
  stopProcessTree,
  waitUntilAnswering,
} from '../index';

const started: ChildProcess[] = [];
const servers: Server[] = [];

afterEach(async () => {
  for (const child of started.splice(0)) {
    stopProcessTree(child, 'SIGKILL');
  }
  await Promise.all(
    servers.splice(0).map(
      server =>
        new Promise<void>(resolve => {
          server.close(() => resolve());
          server.closeAllConnections();
        }),
    ),
  );
});

/** Runs a Node script as a child process, detached on POSIX like servers. */
function startNode(script: string): ChildProcess {
  const child = spawn(process.execPath, ['-e', script], {
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  started.push(child);
  return child;
}

/** Serves every request with the status the handler picks. */
async function startHttpServer(
  status: (hostHeader: string | undefined) => number,
): Promise<number> {
  const server = createServer((request, response) => {
    response.writeHead(status(request.headers.host));
    response.end();
  });
  servers.push(server);
  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  // listen() on a TCP port always yields an AddressInfo, never a pipe name.
  return (server.address() as AddressInfo).port;
}

function exitOf(child: ChildProcess): Promise<void> {
  return new Promise(resolve => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    child.once('exit', () => resolve());
  });
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

describe('a local server started for the demo or HTTP tests', () => {
  it('is ready once its health check answers 200', async () => {
    let requests = 0;
    const port = await startHttpServer(() => (++requests < 3 ? 503 : 200));
    const child = startNode('setInterval(() => {}, 1000);');

    await waitUntilAnswering(
      {child, name: 'server'},
      `http://127.0.0.1:${port}/api/health`,
    );

    expect(requests).toBe(3);
  });

  it('that exits before answering fails the wait with what it printed', async () => {
    const child = startNode(
      'console.log("database refused"); process.exit(3);',
    );
    const outputTail = keepOutputTail(child);

    await expect(
      waitUntilAnswering(
        {child, name: 'next dev', outputTail},
        'http://127.0.0.1:9/api/health',
      ),
    ).rejects.toThrow(/next dev exited with code 3:\ndatabase refused/);
  });

  it('that never answers fails the wait after the timeout', async () => {
    const child = startNode('setInterval(() => {}, 1000);');

    await expect(
      waitUntilAnswering({child, name: 'server'}, 'http://127.0.0.1:9/', {
        timeoutMilliseconds: 50,
      }),
    ).rejects.toThrow('http://127.0.0.1:9/ did not answer 200 within 50 ms');
  });

  it('on a *.localhost host is asked on loopback with that Host header', async () => {
    const hostHeaders: Array<string | undefined> = [];
    const port = await startHttpServer(host => {
      hostHeaders.push(host);
      return 200;
    });

    expect(await answersOk(`http://work.localhost:${port}/api/health`)).toBe(
      true,
    );
    expect(hostHeaders).toEqual([`work.localhost:${port}`]);
    expect(await isListening('127.0.0.1', port)).toBe(true);
  });

  it('stops together with the processes it started', async () => {
    // On Windows a detached worker leaves Node's job object, which would
    // otherwise end it with its parent however the parent was stopped.
    const child = startNode(
      [
        "const {spawn} = require('node:child_process');",
        "const worker = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'],",
        `  {stdio: 'ignore', windowsHide: true, detached: ${process.platform === 'win32'}});`,
        'console.log(worker.pid);',
        'setInterval(() => {}, 1000);',
      ].join('\n'),
    );
    const workerPid = await new Promise<number>(resolve => {
      child.stdout?.once('data', chunk => resolve(Number(String(chunk))));
    });
    onTestFinished(() => {
      if (isAlive(workerPid)) {
        process.kill(workerPid, 'SIGKILL');
      }
    });
    expect(isAlive(workerPid)).toBe(true);

    stopProcessTree(child);
    await exitOf(child);

    await expect.poll(() => isAlive(workerPid), {timeout: 10_000}).toBe(false);
  });
});
