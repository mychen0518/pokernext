/**
 * @fileoverview Kitchen-sink entry: routes `/?page=<id>` to a registered page
 * and lists all pages when no page is given.
 */

import '../tokens.css';
import './kitchen_sink.css';

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import {KITCHEN_SINK_PAGES} from './page_registry';

/** Renders the page named in the query, or the page index. */
function KitchenSink() {
  const params = new URLSearchParams(window.location.search);
  const page = KITCHEN_SINK_PAGES.find(p => p.id === params.get('page'));
  if (page !== undefined) {
    const Page = page.component;
    if (page.fullBleed) {
      return (
        <div data-kitchen-sink-page={page.id}>
          <Page params={params} />
        </div>
      );
    }
    return (
      <main className="pn-kitchen-sink" data-kitchen-sink-page={page.id}>
        <Page params={params} />
      </main>
    );
  }
  return (
    <main className="pn-kitchen-sink" data-kitchen-sink-page="index">
      <h1>Kitchen-sink</h1>
      <ul>
        {KITCHEN_SINK_PAGES.map(p => (
          <li key={p.id}>
            <a href={`?page=${p.id}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('kitchen_sink/index.html must contain #root');
}
createRoot(rootElement).render(
  <StrictMode>
    <KitchenSink />
  </StrictMode>,
);
