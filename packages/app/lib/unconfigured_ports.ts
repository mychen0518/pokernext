/**
 * @fileoverview Placeholders for external ports whose real adapters do not
 * exist yet. Each rejects loudly instead of pretending to succeed; the ticket
 * that introduces a port's adapter replaces its placeholder.
 */

import type {ExternalPorts} from '@pokernext/ports';

/** Thrown when a use-case reaches a port that has no real adapter yet. */
export class PortNotConfiguredError extends Error {
  constructor(readonly port: keyof ExternalPorts) {
    super(`The external port "${port}" has no real adapter configured yet.`);
    this.name = 'PortNotConfiguredError';
  }
}

/** Creates a placeholder for every external port. */
export function createUnconfiguredPorts(): ExternalPorts {
  const reject = (port: keyof ExternalPorts) => () =>
    Promise.reject(new PortNotConfiguredError(port));
  return {
    pointsWorkbooks: {read: reject('pointsWorkbooks')},
    hotelConfirmations: {read: reject('hotelConfirmations')},
    ocr: {recognize: reject('ocr')},
    keyManagement: {
      wrapDataKey: reject('keyManagement'),
      unwrapDataKey: reject('keyManagement'),
    },
    notifications: {send: reject('notifications')},
    edge: {pass: reject('edge')},
  };
}
