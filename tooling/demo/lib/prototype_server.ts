/**
 * @fileoverview Serves `docs/design/prototype/pokernext-prototype.html` on an
 * ephemeral 127.0.0.1 port, so each capture has a normal http origin whose
 * browser storage can be cleared (a `file://` page has no stable origin).
 */

import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import type {AddressInfo} from 'node:net';
import {fileURLToPath} from 'node:url';

const PROTOTYPE_FILE = fileURLToPath(
  new URL(
    '../../../docs/design/prototype/pokernext-prototype.html',
    import.meta.url,
  ),
);

/** A running prototype server. */
export interface PrototypeServer {
  /** The prototype page URL without a hash route. */
  readonly pageUrl: string;
  close(): Promise<void>;
}

/** Starts serving the prototype page. */
export async function startPrototypeServer(): Promise<PrototypeServer> {
  const html = await readFile(PROTOTYPE_FILE);
  const server = createServer((request, response) => {
    if (request.url === '/' || request.url?.startsWith('/?')) {
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      response.end(html);
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  // listen() on a TCP port always yields an AddressInfo, never a pipe name.
  const {port} = server.address() as AddressInfo;
  return {
    pageUrl: `http://127.0.0.1:${port}/`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      }),
  };
}
