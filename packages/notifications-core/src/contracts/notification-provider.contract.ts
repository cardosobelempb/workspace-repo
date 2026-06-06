import { NotificationMessage } from "../shared";

export abstract class NotificationProviderContract {
  abstract channel: string;
  abstract send(message: NotificationMessage): Promise<void>;
}
