export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export abstract class EmailService {
  abstract send(input: SendEmailInput): Promise<void>;
}
