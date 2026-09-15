/**
 * @fileoverview In-memory KMS that really wraps data keys with AES-256-GCM.
 */

import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';

import type {
  DataKeyUnwrapped,
  DataKeyWrapped,
  KeyManagementFailure,
  KeyManagementService,
  KeyReference,
} from '../../index';
import {InjectedBehaviours, type InjectionOptions} from './injection';

const NONCE_BYTES = 12;
const TAG_BYTES = 16;

/**
 * Implements {@link KeyManagementService} for tests. Each key version has its
 * own random key-encryption key shared by every region (a multi-region key),
 * so a wrapped key unwraps anywhere unless a failure is injected.
 */
export class FakeKeyManagementService implements KeyManagementService {
  private readonly keys = new Map<string, Buffer>();
  private readonly wrapFailures = new InjectedBehaviours<true>();
  private readonly decryptFailures = new InjectedBehaviours<true>();
  private readonly unavailableVersions = new Set<string>();
  private readonly unavailableRegions = new Set<string>();

  /** Makes wrapping fail with `wrapFailed`. */
  injectCannotWrapDataKey(options?: InjectionOptions): void {
    this.wrapFailures.inject(true, options);
  }

  /** Makes unwrapping fail with `decryptFailed`. */
  injectCannotDecrypt(options?: InjectionOptions): void {
    this.decryptFailures.inject(true, options);
  }

  /** Makes one key version unusable in every region until restored. */
  makeKeyVersionUnavailable(
    key: Pick<KeyReference, 'keyId' | 'keyVersion'>,
  ): void {
    this.unavailableVersions.add(versionName(key));
  }

  /** Makes the KMS in another region unreachable until restored. */
  injectCrossRegionUnavailable(region: string): void {
    this.unavailableRegions.add(region);
  }

  /** Drops every injected failure; key material is kept. */
  restore(): void {
    this.wrapFailures.restore();
    this.decryptFailures.restore();
    this.unavailableVersions.clear();
    this.unavailableRegions.clear();
  }

  async wrapDataKey(
    key: KeyReference,
    dataKey: Uint8Array,
  ): Promise<DataKeyWrapped | KeyManagementFailure> {
    const unavailable = this.availabilityFailure(key);
    if (unavailable !== undefined) {
      return unavailable;
    }
    if (this.wrapFailures.take() !== undefined) {
      return {status: 'failed', reason: 'wrapFailed'};
    }
    const nonce = randomBytes(NONCE_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.keyFor(key), nonce);
    const sealed = Buffer.concat([cipher.update(dataKey), cipher.final()]);
    const wrapped = Buffer.concat([nonce, cipher.getAuthTag(), sealed]);
    return {status: 'wrapped', key, wrappedDataKey: new Uint8Array(wrapped)};
  }

  async unwrapDataKey(
    key: KeyReference,
    wrappedDataKey: Uint8Array,
  ): Promise<DataKeyUnwrapped | KeyManagementFailure> {
    const unavailable = this.availabilityFailure(key);
    if (unavailable !== undefined) {
      return unavailable;
    }
    if (this.decryptFailures.take() !== undefined) {
      return {status: 'failed', reason: 'decryptFailed'};
    }
    const bytes = Buffer.from(wrappedDataKey);
    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.keyFor(key),
        bytes.subarray(0, NONCE_BYTES),
      );
      decipher.setAuthTag(bytes.subarray(NONCE_BYTES, NONCE_BYTES + TAG_BYTES));
      const dataKey = Buffer.concat([
        decipher.update(bytes.subarray(NONCE_BYTES + TAG_BYTES)),
        decipher.final(),
      ]);
      return {status: 'unwrapped', dataKey: new Uint8Array(dataKey)};
    } catch {
      return {status: 'failed', reason: 'decryptFailed'};
    }
  }

  private availabilityFailure(
    key: KeyReference,
  ): KeyManagementFailure | undefined {
    if (this.unavailableRegions.has(key.region)) {
      return {status: 'failed', reason: 'regionUnavailable'};
    }
    if (this.unavailableVersions.has(versionName(key))) {
      return {status: 'failed', reason: 'keyVersionUnavailable'};
    }
    return undefined;
  }

  private keyFor(key: KeyReference): Buffer {
    const name = versionName(key);
    let material = this.keys.get(name);
    if (material === undefined) {
      material = randomBytes(32);
      this.keys.set(name, material);
    }
    return material;
  }
}

/** Names a key version independently of region. */
function versionName(key: Pick<KeyReference, 'keyId' | 'keyVersion'>): string {
  return `${key.keyId}@${key.keyVersion}`;
}
