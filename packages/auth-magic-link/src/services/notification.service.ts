// packages/notifications-core/src/services/notification.service.ts

import { NotificationProviderContract } from "../contracts/notification-provider.contract";
import { NotificationMessage } from "../shared";

export class NotificationService {
  private readonly providers = new Map<string, NotificationProviderContract>();

  constructor(providers: NotificationProviderContract[]) {
    for (const provider of providers) {
      this.providers.set(provider.channel, provider);
    }
  }

  async send(message: NotificationMessage): Promise<void> {
    const provider = this.providers.get(message.channel);

    if (!provider) {
      throw new Error(`Provider não encontrado para o canal: ${message.channel}`);
    }

    await provider.send(message);
  }

  async sendMany(messages: NotificationMessage[]): Promise<void> {
    await Promise.all(messages.map((message) => this.send(message)));
  }
}
