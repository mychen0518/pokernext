/**
 * @fileoverview 外部 OCR 假供應商：逾時（>30s／>2min）、辨識失敗、晚到結果都能以
 * 可控時鐘重現。PRD 16.19 R16-19-10：超 30 秒可先手填，超 2 分鐘本次逾時可重試；
 * R18-08：晚到結果僅供比對。測試裡的呼叫端以時鐘等待這兩個時限，和日後的 use-case
 * 一樣。
 */

import {describe, expect, it} from 'vitest';

import type {Clock, OcrRecognized, OcrUnrecognized} from '../index';
import {ControllableClock, FakeOcrProvider} from '../testing';

const PASSPORT = {documentVersionId: 'doc-1:v1', documentKind: 'passport'};
const SECOND = 1_000;
const MANUAL_FILL_WINDOW = 30 * SECOND;
const ATTEMPT_TIMEOUT = 120 * SECOND;

type OcrResult = OcrRecognized | OcrUnrecognized;

/** Tracks whether a pending recognition has produced a result yet. */
function watch(promise: Promise<OcrResult>) {
  const state: {result?: OcrResult} = {};
  void promise.then(result => {
    state.result = result;
  });
  return state;
}

/**
 * Waits for the result the way a caller does: it gets whichever comes first,
 * the result or the end of the window on the clock.
 */
function withinWindow(
  clock: Clock,
  pending: Promise<OcrResult>,
  milliseconds: number,
): Promise<OcrResult | 'windowElapsed'> {
  return Promise.race([
    pending,
    clock.wait(milliseconds).then(() => 'windowElapsed' as const),
  ]);
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

  it('逾時超過 30 秒：30 秒的等待結束時還沒有結果（可先手填），2 分鐘內才送達辨識欄位', async () => {
    const clock = new ControllableClock();
    const ocr = new FakeOcrProvider(clock);
    ocr.injectTimeoutOver30Seconds();

    const pending = ocr.recognize(PASSPORT);
    const firstWindow = withinWindow(clock, pending, MANUAL_FILL_WINDOW);
    await clock.advanceMilliseconds(MANUAL_FILL_WINDOW);
    expect(await firstWindow).toBe('windowElapsed');
    const attempt = withinWindow(
      clock,
      pending,
      ATTEMPT_TIMEOUT - MANUAL_FILL_WINDOW,
    );
    await clock.advanceMilliseconds(ATTEMPT_TIMEOUT - MANUAL_FILL_WINDOW);

    expect(await attempt).toMatchObject({status: 'recognized'});
  });

  it('逾時超過 30 秒可以指定送達時間，但只接受 30 秒以上、2 分鐘以內', () => {
    const ocr = new FakeOcrProvider(new ControllableClock());

    expect(() =>
      ocr.injectTimeoutOver30Seconds({afterMilliseconds: 30 * SECOND}),
    ).toThrow(/more than 30 s/);
    expect(() =>
      ocr.injectTimeoutOver30Seconds({afterMilliseconds: 121 * SECOND}),
    ).toThrow(/2 min/);
  });

  it('逾時超過 2 分鐘：本次嘗試在 2 分鐘時逾時且沒有任何結果，重試時拿到辨識欄位', async () => {
    const clock = new ControllableClock();
    const ocr = new FakeOcrProvider(clock);
    ocr.injectTimeoutOver2Minutes({times: 1});

    const firstAttempt = ocr.recognize(PASSPORT);
    const outcome = withinWindow(clock, firstAttempt, ATTEMPT_TIMEOUT);
    await clock.advanceMilliseconds(ATTEMPT_TIMEOUT);
    expect(await outcome).toBe('windowElapsed');
    const first = watch(firstAttempt);
    await clock.advanceMinutes(60);
    expect(first.result).toBeUndefined();

    const retry = await ocr.recognize(PASSPORT);

    expect(retry.status).toBe('recognized');
  });

  it('晚到結果：2 分鐘時本次已逾時，之後才送達辨識欄位', async () => {
    const clock = new ControllableClock();
    const ocr = new FakeOcrProvider(clock);
    ocr.injectLateResult();

    const pending = ocr.recognize(PASSPORT);
    const attempt = withinWindow(clock, pending, ATTEMPT_TIMEOUT);
    await clock.advanceMilliseconds(ATTEMPT_TIMEOUT);
    expect(await attempt).toBe('windowElapsed');
    const late = watch(pending);
    await clock.advanceMinutes(3);

    expect(late.result?.status).toBe('recognized');
  });

  it('晚到結果只接受 2 分鐘之後才送達', () => {
    const ocr = new FakeOcrProvider(new ControllableClock());

    expect(() =>
      ocr.injectLateResult({afterMilliseconds: ATTEMPT_TIMEOUT}),
    ).toThrow(/after 2 min/);
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
