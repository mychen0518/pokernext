/**
 * @fileoverview 假通知送出器（LINE／Email／WhatsApp／Telegram）：送出失敗、管道不可
 * 達、所有管道全失敗。
 */

import {describe, expect, it} from 'vitest';

import type {NotificationChannel, OutgoingNotification} from '../index';
import {FakeNotificationSender} from '../testing';

/** Builds a message to one member through one channel. */
function message(
  channel: NotificationChannel,
  messageId = `msg-${channel}`,
): OutgoingNotification {
  return {
    messageId,
    channel,
    recipientAddress: `alex@${channel}`,
    body: '您的行程 TR-260911-028 已確認',
  };
}

describe('假通知送出器', () => {
  it('正常送出時回報已送出，且收件紀錄裡有這則訊息', async () => {
    const sender = new FakeNotificationSender();

    const result = await sender.send(message('line'));

    expect(result).toEqual({
      status: 'sent',
      messageId: 'msg-line',
      channel: 'line',
    });
    expect(sender.delivered).toEqual([message('line')]);
  });

  it('Email 送出失敗時回報失敗，收件紀錄裡沒有這則訊息', async () => {
    const sender = new FakeNotificationSender();
    sender.injectSendFailure('email');

    const result = await sender.send(message('email'));

    expect(result).toEqual({
      status: 'failed',
      messageId: 'msg-email',
      channel: 'email',
      reason: 'sendFailed',
    });
    expect(sender.delivered).toEqual([]);
  });

  it('LINE 管道不可達時只有 LINE 失敗，Email 仍送達', async () => {
    const sender = new FakeNotificationSender();
    sender.injectChannelUnreachable('line');

    const line = await sender.send(message('line'));
    const email = await sender.send(message('email'));

    expect(line).toMatchObject({
      status: 'failed',
      reason: 'channelUnreachable',
    });
    expect(email.status).toBe('sent');
  });

  it('所有管道全失敗時，四種管道都回報失敗且沒有任何送達', async () => {
    const sender = new FakeNotificationSender();
    sender.injectAllChannelsFail();

    const channels: NotificationChannel[] = [
      'line',
      'email',
      'whatsApp',
      'telegram',
    ];
    const results = await Promise.all(
      channels.map(channel => sender.send(message(channel))),
    );

    expect(results.map(result => result.status)).toEqual([
      'failed',
      'failed',
      'failed',
      'failed',
    ]);
    expect(sender.delivered).toEqual([]);
  });

  it('只注入一次的送出失敗，重送同一則訊息就送達', async () => {
    const sender = new FakeNotificationSender();
    sender.injectSendFailure('telegram', {times: 1});

    const first = await sender.send(message('telegram'));
    const retry = await sender.send(message('telegram'));

    expect(first.status).toBe('failed');
    expect(retry.status).toBe('sent');
    expect(sender.delivered).toHaveLength(1);
  });
});
