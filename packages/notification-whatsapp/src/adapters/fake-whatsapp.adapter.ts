import {
  NotificationChannel,
  NotificationMessage,
  NotificationProviderContract,
} from '@repo/notifications-core';

export class FakeWhatsAppAdapter implements NotificationProviderContract {
  public readonly channel = NotificationChannel.WHATSAPP;

  public readonly sentMessages: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<void> {
    this.sentMessages.push(message);
  }
}