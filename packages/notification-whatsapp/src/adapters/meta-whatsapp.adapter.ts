import {
  NotificationChannel,
  NotificationMessage,
  NotificationProviderContract,
} from "@repo/notifications-core";
import { WhatsAppConfig } from "../shared";

export class MetaWhatsAppAdapter implements NotificationProviderContract {
  public readonly channel = NotificationChannel.WHATSAPP;

  constructor(private readonly config: WhatsAppConfig) {}

  async send(message: NotificationMessage): Promise<void> {
    const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.to,
        type: "text",
        text: {
          body: message.content,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);

      throw new Error(
        `Erro ao enviar WhatsApp: ${response.status} ${JSON.stringify(error)}`,
      );
    }
  }
}
