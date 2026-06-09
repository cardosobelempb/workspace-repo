import { NotificationChannel } from "./notification-channel";

export interface NotificationMessage {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  content: string;
  html?: string;
  metadata?: Record<string, unknown>;
}
