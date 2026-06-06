import { NotificationChannel } from "./notification-channel";

export type NotificationMessage = {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  content: string;
  html?: string;
  metadata?: Record<string, unknown>;
};
