/**
 * @fileoverview 假 KMS：真的能包裝與解開 DEK，並能注入無法包裝、無法解密、金鑰版本
 * 不可用、跨區不可用。
 */

import {describe, expect, it} from 'vitest';

import type {KeyReference} from '../index';
import {FakeKeyManagementService} from '../testing';

const PRIMARY: KeyReference = {
  keyId: 'documents',
  keyVersion: '1',
  region: 'ap-northeast-2',
};
const SECONDARY: KeyReference = {...PRIMARY, region: 'ap-northeast-1'};
const DATA_KEY = new Uint8Array(32).fill(7);

describe('假 KMS', () => {
  it('以某金鑰版本包裝的 DEK，可以用同一金鑰版本解開', async () => {
    const kms = new FakeKeyManagementService();

    const wrapped = await kms.wrapDataKey(PRIMARY, DATA_KEY);
    if (wrapped.status !== 'wrapped') {
      throw new Error(`expected a wrapped key, got ${wrapped.status}`);
    }
    const unwrapped = await kms.unwrapDataKey(PRIMARY, wrapped.wrappedDataKey);

    expect(wrapped.wrappedDataKey).not.toEqual(DATA_KEY);
    expect(unwrapped).toEqual({status: 'unwrapped', dataKey: DATA_KEY});
  });

  it('被竄改的包裝 DEK 無法解開', async () => {
    const kms = new FakeKeyManagementService();
    const wrapped = await kms.wrapDataKey(PRIMARY, DATA_KEY);
    if (wrapped.status !== 'wrapped') {
      throw new Error(`expected a wrapped key, got ${wrapped.status}`);
    }
    const tampered = Uint8Array.from(wrapped.wrappedDataKey);
    tampered[tampered.length - 1] ^= 0xff;

    const result = await kms.unwrapDataKey(PRIMARY, tampered);

    expect(result).toEqual({status: 'failed', reason: 'decryptFailed'});
  });

  it('無法包裝 DEK 時回報失敗，不給出任何包裝結果', async () => {
    const kms = new FakeKeyManagementService();
    kms.injectCannotWrapDataKey();

    const result = await kms.wrapDataKey(PRIMARY, DATA_KEY);

    expect(result).toEqual({status: 'failed', reason: 'wrapFailed'});
  });

  it('無法解密時回報失敗，不給出 DEK', async () => {
    const kms = new FakeKeyManagementService();
    const wrapped = await kms.wrapDataKey(PRIMARY, DATA_KEY);
    if (wrapped.status !== 'wrapped') {
      throw new Error(`expected a wrapped key, got ${wrapped.status}`);
    }
    kms.injectCannotDecrypt();

    const result = await kms.unwrapDataKey(PRIMARY, wrapped.wrappedDataKey);

    expect(result).toEqual({status: 'failed', reason: 'decryptFailed'});
  });

  it('金鑰版本不可用時，該版本無法包裝也無法解開；其他版本照常', async () => {
    const kms = new FakeKeyManagementService();
    const wrapped = await kms.wrapDataKey(PRIMARY, DATA_KEY);
    if (wrapped.status !== 'wrapped') {
      throw new Error(`expected a wrapped key, got ${wrapped.status}`);
    }
    kms.makeKeyVersionUnavailable(PRIMARY);

    const unwrap = await kms.unwrapDataKey(PRIMARY, wrapped.wrappedDataKey);
    const wrapAgain = await kms.wrapDataKey(PRIMARY, DATA_KEY);
    const otherVersion = await kms.wrapDataKey(
      {...PRIMARY, keyVersion: '2'},
      DATA_KEY,
    );

    expect(unwrap).toEqual({status: 'failed', reason: 'keyVersionUnavailable'});
    expect(wrapAgain).toEqual({
      status: 'failed',
      reason: 'keyVersionUnavailable',
    });
    expect(otherVersion.status).toBe('wrapped');
  });

  it('跨區不可用時，備援區無法解開；主區仍可解開', async () => {
    const kms = new FakeKeyManagementService();
    const wrapped = await kms.wrapDataKey(PRIMARY, DATA_KEY);
    if (wrapped.status !== 'wrapped') {
      throw new Error(`expected a wrapped key, got ${wrapped.status}`);
    }
    kms.injectCrossRegionUnavailable(SECONDARY.region);

    const secondary = await kms.unwrapDataKey(
      SECONDARY,
      wrapped.wrappedDataKey,
    );
    const primary = await kms.unwrapDataKey(PRIMARY, wrapped.wrappedDataKey);

    expect(secondary).toEqual({status: 'failed', reason: 'regionUnavailable'});
    expect(primary.status).toBe('unwrapped');
  });

  it('跨區恢復後，備援區以同一金鑰版本解開主區包裝的 DEK', async () => {
    const kms = new FakeKeyManagementService();
    const wrapped = await kms.wrapDataKey(PRIMARY, DATA_KEY);
    if (wrapped.status !== 'wrapped') {
      throw new Error(`expected a wrapped key, got ${wrapped.status}`);
    }
    kms.injectCrossRegionUnavailable(SECONDARY.region);
    kms.restore();

    const secondary = await kms.unwrapDataKey(
      SECONDARY,
      wrapped.wrappedDataKey,
    );

    expect(secondary).toEqual({status: 'unwrapped', dataKey: DATA_KEY});
  });
});
