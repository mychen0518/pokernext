/**
 * @fileoverview Stand-in for the Cloudflare edge's decisions. `withFakeEdge`
 * (fake_edge_middleware.ts) puts it in front of HTTP handlers.
 */

import type {
  EdgeDelivered,
  EdgeInterrupted,
  EdgeProtection,
  EdgeRequest,
  EdgeStopped,
} from '../../index';
import {InjectedBehaviours, type InjectionOptions} from './injection';

type EdgeFailure = EdgeStopped['status'] | EdgeInterrupted['status'];

/**
 * Implements {@link EdgeProtection} for tests. Passes requests straight to the
 * origin unless a failure is injected.
 */
export class FakeEdgeProtection implements EdgeProtection {
  private readonly failures = new InjectedBehaviours<EdgeFailure>();

  /** Blocks legitimate requests as WAF false positives. */
  injectFalseBlock(options?: InjectionOptions): void {
    this.failures.inject('blocked', options);
  }

  /** Makes the edge itself fail before reaching the origin. */
  injectOutage(options?: InjectionOptions): void {
    this.failures.inject('unavailable', options);
  }

  /** Answers requests with a challenge instead of forwarding them. */
  injectChallenge(options?: InjectionOptions): void {
    this.failures.inject('challenged', options);
  }

  /** Lets the origin handle requests but loses their responses. */
  injectResponseInterrupted(options?: InjectionOptions): void {
    this.failures.inject('interrupted', options);
  }

  /** Drops every injected failure. */
  restore(): void {
    this.failures.restore();
  }

  /** Forwards the request unless an injected failure stops it. */
  async pass<T>(
    request: EdgeRequest,
    origin: () => Promise<T>,
  ): Promise<EdgeDelivered<T> | EdgeStopped | EdgeInterrupted> {
    const failure = this.failures.take();
    if (failure === 'interrupted') {
      await origin();
      return {status: 'interrupted'};
    }
    if (failure !== undefined) {
      return {status: failure};
    }
    return {status: 'delivered', response: await origin()};
  }
}
