import {
  NotificationChannel,
  NotificationMessage,
  NotificationProviderContract,
} from "@repo/notifications-core";
import nodemailer from "nodemailer";

type NodemailerEmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export class NodemailerEmailAdapter implements NotificationProviderContract {
  public readonly channel = NotificationChannel.EMAIL;

  private readonly transporter;

  constructor(private readonly config: NodemailerEmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  async send(message: NotificationMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.content,
      html: message.html,
    });
  }
}
