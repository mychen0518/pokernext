/**
 * @fileoverview 酒店確認 PDF 替身：同編號不同內容、作廢無替代單、缺件。
 */

import {describe, expect, it} from 'vitest';

import type {HotelConfirmation} from '../index';
import {FakeHotelConfirmationSource} from '../testing';

const ORIGINAL = {
  hotelConfirmationNo: 'HT-58213',
  guestName: 'CHEN ALEX',
  checkInDate: '2026-09-11',
  checkOutDate: '2026-09-14',
};

/** Reads a PDF and insists that it exists. */
async function readFound(
  source: FakeHotelConfirmationSource,
  fileId: string,
): Promise<HotelConfirmation> {
  const result = await source.read(fileId);
  if (result.status !== 'read') {
    throw new Error(`expected ${fileId} to exist, got ${result.status}`);
  }
  return result.confirmation;
}

describe('酒店確認 PDF 替身', () => {
  it('讀出確認編號、住客姓名與住宿日期，且未作廢', async () => {
    const source = new FakeHotelConfirmationSource();
    source.provide('pdf-1', ORIGINAL);

    const confirmation = await readFound(source, 'pdf-1');

    expect(confirmation).toMatchObject({...ORIGINAL, voided: false});
    expect(confirmation.replacementConfirmationNo).toBeUndefined();
  });

  it('同編號不同內容：兩份 PDF 確認編號相同，但日期與內容摘要不同', async () => {
    const source = new FakeHotelConfirmationSource();
    source.provide('pdf-1', ORIGINAL);
    source.injectSameNumberDifferentContent('pdf-2', {
      basedOn: 'pdf-1',
      changes: {checkOutDate: '2026-09-16'},
    });

    const first = await readFound(source, 'pdf-1');
    const second = await readFound(source, 'pdf-2');

    expect(second.hotelConfirmationNo).toBe(first.hotelConfirmationNo);
    expect(second.checkOutDate).toBe('2026-09-16');
    expect(second.contentDigest).not.toBe(first.contentDigest);
  });

  it('作廢無替代單：PDF 標示作廢且沒有替代確認編號', async () => {
    const source = new FakeHotelConfirmationSource();
    source.provide('pdf-1', ORIGINAL);
    source.injectVoidedWithoutReplacement('pdf-void', {basedOn: 'pdf-1'});

    const voided = await readFound(source, 'pdf-void');

    expect(voided.hotelConfirmationNo).toBe('HT-58213');
    expect(voided.voided).toBe(true);
    expect(voided.replacementConfirmationNo).toBeUndefined();
  });

  it('作廢且有替代單時，PDF 指出替代確認編號', async () => {
    const source = new FakeHotelConfirmationSource();
    source.provide('pdf-void', {
      ...ORIGINAL,
      voided: true,
      replacementConfirmationNo: 'HT-58990',
    });

    const voided = await readFound(source, 'pdf-void');

    expect(voided.replacementConfirmationNo).toBe('HT-58990');
  });

  it('缺件：原本有的 PDF 被標為缺件後，讀取回報缺件而不是空白確認單', async () => {
    const source = new FakeHotelConfirmationSource();
    source.provide('pdf-1', ORIGINAL);
    source.injectMissing('pdf-1');

    const result = await source.read('pdf-1');

    expect(result).toEqual({status: 'missing'});
  });
});
