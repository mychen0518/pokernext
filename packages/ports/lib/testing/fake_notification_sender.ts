/**
 * @fileoverview In-memory notification sender with per-channel failures.
 */

import type {
  NotificationChannel,
  NotificationFailed,
  NotificationSender,
  NotificationSent,
  OutgoingNotification,
} from '../../index';
import {InjectedBehaviours, type InjectionOptions} from './injection';

type FailureReason = NotificationFailed['reason'];

const CHANNELS: readonly NotificationChannel[] = [
  'line',
  'email',
  'whatsApp',
  'telegram',
];

/**
 * Implements {@link NotificationSender} for tests. Delivered messages are the
 * observable external effect; failed sends deliver nothing.
 */
export class FakeNotificationSender implements NotificationSender {
  private readonly failures = new Map<
    NotificationChannel,
    InjectedBehaviours<FailureReason>
  >(CHANNELS.map(channel => [channel, new InjectedBehaviours()]));
  private readonly deliveredMessages: OutgoingNotification[] = [];

  /** Lists every message a channel accepted, in send order. */
  get delivered(): readonly OutgoingNotification[] {
    return [...this.deliveredMessages];
  }

  /** Makes sends through one channel fail with `sendFailed`. */
  injectSendFailure(
    channel: NotificationChannel,
    options?: InjectionOptions,
  ): void {
    this.failuresFor(channel).inject('sendFailed', options);
  }

  /** Makes one channel unreachable (`channelUnreachable`). */
  injectChannelUnreachable(
    channel: NotificationChannel,
    options?: InjectionOptions,
  ): void {
    this.failuresFor(channel).inject('channelUnreachable', options);
  }

  /** Makes sends through every channel fail; `times` counts per channel. */
  injectAllChannelsFail(options?: InjectionOptions): void {
    for (const channel of CHANNELS) {
      this.injectSendFailure(channel, options);
    }
  }

  /** Drops every injected failure; delivered messages are kept. */
  restore(): void {
    for (const failures of this.failures.values()) {
      failures.restore();
    }
  }

  async send(
    notification: OutgoingNotification,
  ): Promise<NotificationSent | NotificationFailed> {
    const {messageId, channel} = notification;
    const reason = this.failuresFor(channel).take();
    if (reason !== undefined) {
      return {status: 'failed', messageId, channel, reason};
    }
    this.deliveredMessages.push(notification);
    return {status: 'sent', messageId, channel};
  }

  private failuresFor(
    channel: NotificationChannel,
  ): InjectedBehaviours<FailureReason> {
    const failures = this.failures.get(channel);
    if (failures === undefined) {
      throw new Error(`Unknown notification channel: ${channel}`);
    }
    return failures;
  }
}
