/**
 * @fileoverview 外部 OCR 假供應商：逾時（>30s／>2min）、辨識失敗、晚到結果都能以
 * 可控時鐘重現。
 */

import {describe, expect, it} from 'vitest';

import type {OcrRecognized, OcrUnrecognized} from '../index';
import {ControllableClock, FakeOcrProvider} from '../testing';

const PASSPORT = {documentVersionId: 'doc-1:v1', documentKind: 'passport'};

/** Tracks whether a pending recognition has produced a result yet. */
function watch(promise: Promise<OcrRecognized | OcrUnrecognized>) {
  const state: {result?: OcrRecognized | OcrUnrecognized} = {};
  void promise.then(result => {
    state.result = result;
  });
  return state;
}

describe('外部 OCR 假供應商', () => {
  it('正常時立即回傳辨識出的證件欄位', async () => {
    const clock = new ControllableClock();
    const ocr = new FakeOcrProvider(clock);
    ocr.recognizeAs({familyName: 'CHEN', givenName: 'ALEX'});

    const result = await ocr.recognize(PASSPORT);

    expect(result).toEqual({
      status: 'recognized',
      fields: {familyName: 'CHEN', givenName: 'ALEX'},
    });
  });

  it('超過 30 秒才回應：第 30 秒時仍沒有結果，第 31 秒拿到結果', async () => {
    const clock = new ControllableClock();
    const ocr = new FakeOcrProvider(clock);
    ocr.injectResponseAfter30Seconds();

    const pending = watch(ocr.recognize(PASSPORT));
    await clock.advanceMilliseconds(30_000);
    expect(pending.result).toBeUndefined();
    await clock.advanceMilliseconds(1_000);

    expect(pending.result?.status).toBe('recognized');
  });

  it('超過 2 分鐘逾時：時鐘推進 10 分鐘後仍沒有任何結果', async () => {
    const clock = new ControllableClock();
    const ocr = new FakeOcrProvider(clock);
    ocr.injectTimeoutOver2Minutes();

    const pending = watch(ocr.recognize(PASSPORT));
    await clock.advanceMinutes(10);

    expect(pending.result).toBeUndefined();
  });

  it('晚到結果：2 分鐘時仍沒有回應，之後才送達辨識欄位', async () => {
    const clock = new ControllableClock();
    const ocr = new FakeOcrProvider(clock);
    ocr.injectLateResult();

    const pending = watch(ocr.recognize(PASSPORT));
    await clock.advanceMinutes(2);
    expect(pending.result).toBeUndefined();
    await clock.advanceMinutes(3);

    expect(pending.result?.status).toBe('recognized');
  });

  it('辨識失敗時回報失敗，而不是回傳空白欄位', async () => {
    const clock = new ControllableClock();
    const ocr = new FakeOcrProvider(clock);
    ocr.injectRecognitionFailure('glare');

    const result = await ocr.recognize(PASSPORT);

    expect(result).toEqual({status: 'unrecognized', reason: 'glare'});
  });

  it('只注入一次的失敗，下一次重試就恢復正常', async () => {
    const clock = new ControllableClock();
    const ocr = new FakeOcrProvider(clock);
    ocr.injectRecognitionFailure('glare', {times: 1});

    const first = await ocr.recognize(PASSPORT);
    const retry = await ocr.recognize(PASSPORT);

    expect(first.status).toBe('unrecognized');
    expect(retry.status).toBe('recognized');
  });
});
