# Guia de Implementação — Email Service com Templates Padrões

## Objetivo

Este guia tem como objetivo orientar a implementação de um serviço de envio de emails em TypeScript, usando uma arquitetura limpa, testável e de fácil manutenção.

A solução separa responsabilidades em:

- Contrato do provedor de email;
- Provider concreto com Nodemailer;
- Service de aplicação;
- Templates HTML reutilizáveis;
- Variáveis de ambiente;
- Exemplo prático de uso.

---

## 1. Instalar dependências

Execute:

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

---

## 2. Criar estrutura de pastas

Crie a seguinte estrutura:

```txt
src/
  shared/
    email/
      contracts/
        email-provider.ts
      providers/
        nodemailer-email-provider.ts
      services/
        email-service.ts
      templates/
        email-template.ts
        auth-email-templates.ts
```

---

## 3. Criar contrato do provider

Arquivo:

```txt
src/shared/email/contracts/email-provider.ts
```

Código:

```ts
export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}
```

### Por que usar contrato?

O service não deve depender diretamente do Nodemailer.
Assim, no futuro, você pode trocar para SendGrid, Amazon SES, Mailgun ou Resend sem alterar a regra de negócio.

---

## 4. Criar provider com Nodemailer

Arquivo:

```txt
src/shared/email/providers/nodemailer-email-provider.ts
```

Código:

```ts
import nodemailer from "nodemailer";
import { EmailProvider, SendEmailInput } from "../contracts/email-provider";

export class NodemailerEmailProvider implements EmailProvider {
  private readonly transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: process.env.MAIL_SECURE === "true",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async send(input: SendEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}
```

---

## 5. Configurar variáveis de ambiente

Adicione no `.env`:

```env
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=user@example.com
MAIL_PASS=secret
MAIL_FROM="Minha Plataforma <noreply@example.com>"
```

### Recomendações

Nunca deixe credenciais fixas no código.

Evite isto:

```ts
user: 'meu-email@gmail.com',
pass: 'minha-senha',
```

Prefira sempre:

```ts
user: process.env.MAIL_USER,
pass: process.env.MAIL_PASS,
```

---

## 6. Criar template base

Arquivo:

```txt
src/shared/email/templates/email-template.ts
```

Código:

```ts
type BaseEmailTemplateInput = {
  title: string;
  preview: string;
  content: string;
};

export function baseEmailTemplate(input: BaseEmailTemplateInput): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>${input.title}</title>
      </head>

      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;">
          ${input.preview}
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;">
                <tr>
                  <td>
                    <h1 style="margin:0 0 24px;color:#111827;font-size:24px;">
                      ${input.title}
                    </h1>

                    <div style="color:#374151;font-size:16px;line-height:1.6;">
                      ${input.content}
                    </div>

                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />

                    <p style="color:#6b7280;font-size:12px;line-height:1.5;">
                      Se você não solicitou este email, apenas ignore esta mensagem.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
```

---

## 7. Criar templates de autenticação

Arquivo:

```txt
src/shared/email/templates/auth-email-templates.ts
```

Código:

```ts
import { baseEmailTemplate } from "./email-template";

type VerificationEmailInput = {
  name: string;
  verificationUrl: string;
};

type ResetPasswordEmailInput = {
  name: string;
  resetUrl: string;
};

type WelcomeEmailInput = {
  name: string;
  appName: string;
};

export const AuthEmailTemplates = {
  verification(input: VerificationEmailInput): string {
    return baseEmailTemplate({
      title: "Confirme seu email",
      preview: "Confirme seu cadastro para ativar sua conta.",
      content: `
        <p>Olá, <strong>${input.name}</strong>.</p>

        <p>
          Obrigado por se cadastrar. Para ativar sua conta, clique no botão abaixo:
        </p>

        <p style="margin:32px 0;">
          <a href="${input.verificationUrl}"
             style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;">
            Confirmar email
          </a>
        </p>

        <p>
          Caso o botão não funcione, copie e cole este link no navegador:
        </p>

        <p style="word-break:break-all;color:#2563eb;">
          ${input.verificationUrl}
        </p>
      `,
    });
  },

  resetPassword(input: ResetPasswordEmailInput): string {
    return baseEmailTemplate({
      title: "Redefinição de senha",
      preview: "Use este link para redefinir sua senha.",
      content: `
        <p>Olá, <strong>${input.name}</strong>.</p>

        <p>
          Recebemos uma solicitação para redefinir sua senha.
        </p>

        <p style="margin:32px 0;">
          <a href="${input.resetUrl}"
             style="background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;">
            Redefinir senha
          </a>
        </p>

        <p>
          Por segurança, este link deve expirar em alguns minutos.
        </p>
      `,
    });
  },

  welcome(input: WelcomeEmailInput): string {
    return baseEmailTemplate({
      title: `Bem-vindo ao ${input.appName}`,
      preview: "Sua conta foi criada com sucesso.",
      content: `
        <p>Olá, <strong>${input.name}</strong>.</p>

        <p>
          Sua conta foi criada com sucesso no <strong>${input.appName}</strong>.
        </p>

        <p>
          Agora você já pode acessar a plataforma e começar a usar os recursos disponíveis.
        </p>
      `,
    });
  },
};
```

---

## 8. Criar EmailService

Arquivo:

```txt
src/shared/email/services/email-service.ts
```

Código:

```ts
import { EmailProvider } from "../contracts/email-provider";
import { AuthEmailTemplates } from "../templates/auth-email-templates";

export class EmailService {
  constructor(private readonly emailProvider: EmailProvider) {}

  async sendVerificationEmail(input: {
    to: string;
    name: string;
    verificationUrl: string;
  }): Promise<void> {
    const html = AuthEmailTemplates.verification({
      name: input.name,
      verificationUrl: input.verificationUrl,
    });

    await this.emailProvider.send({
      to: input.to,
      subject: "Confirme seu email",
      html,
    });
  }

  async sendResetPasswordEmail(input: {
    to: string;
    name: string;
    resetUrl: string;
  }): Promise<void> {
    const html = AuthEmailTemplates.resetPassword({
      name: input.name,
      resetUrl: input.resetUrl,
    });

    await this.emailProvider.send({
      to: input.to,
      subject: "Redefinição de senha",
      html,
    });
  }

  async sendWelcomeEmail(input: {
    to: string;
    name: string;
    appName: string;
  }): Promise<void> {
    const html = AuthEmailTemplates.welcome({
      name: input.name,
      appName: input.appName,
    });

    await this.emailProvider.send({
      to: input.to,
      subject: `Bem-vindo ao ${input.appName}`,
      html,
    });
  }
}
```

---

## 9. Exemplo de uso

```ts
import { EmailService } from "./shared/email/services/email-service";
import { NodemailerEmailProvider } from "./shared/email/providers/nodemailer-email-provider";

const emailProvider = new NodemailerEmailProvider();

const emailService = new EmailService(emailProvider);

await emailService.sendVerificationEmail({
  to: "usuario@email.com",
  name: "Samuel",
  verificationUrl: "https://app.com/verify-email?token=abc123",
});
```

---

## 10. Exemplo em fluxo de autenticação

```ts
async function registerUser() {
  const user = {
    name: "Samuel",
    email: "samuel@email.com",
  };

  const verificationToken = "token-gerado-com-seguranca";

  const verificationUrl = `https://app.com/verify-email?token=${verificationToken}`;

  await emailService.sendVerificationEmail({
    to: user.email,
    name: user.name,
    verificationUrl,
  });
}
```

---

## 11. Boas práticas aplicadas

### SRP — Single Responsibility Principle

Cada classe possui uma responsabilidade clara:

- `EmailService`: orquestra o envio;
- `EmailProvider`: define o contrato;
- `NodemailerEmailProvider`: executa o envio real;
- `AuthEmailTemplates`: monta os templates;
- `baseEmailTemplate`: centraliza o layout padrão.

---

### DIP — Dependency Inversion Principle

O service depende de uma interface, não de uma implementação concreta.

Isso facilita trocar:

```txt
NodemailerEmailProvider
```

por:

```txt
SendGridEmailProvider
AmazonSesEmailProvider
ResendEmailProvider
MailgunEmailProvider
```

sem alterar a regra de negócio.

---

### DRY — Don't Repeat Yourself

O layout base do email é reutilizado em todos os templates.

Isso evita repetição de HTML, estilos e rodapé.

---

### KISS — Keep It Simple

A implementação é simples, direta e fácil de evoluir.

---

## 12. Erros comuns

### Erro 1: Service depender diretamente do Nodemailer

Evite:

```ts
import nodemailer from "nodemailer";
```

dentro do service de regra de negócio.

Correção:

```ts
constructor(private readonly emailProvider: EmailProvider) {}
```

---

### Erro 2: Misturar template com envio

Evite montar HTML dentro do provider.

O provider deve apenas enviar.

---

### Erro 3: Não usar variáveis de ambiente

Evite expor credenciais no código.

Use `.env`.

---

### Erro 4: Não validar configuração SMTP

Recomenda-se validar as variáveis obrigatórias na inicialização da aplicação.

---

## 13. Complexidade Big-O

O processamento interno para montar e enviar um email é:

```txt
O(1)
```

A complexidade não cresce com volume de dados significativo.

O principal gargalo é externo:

- Latência do SMTP;
- Limite de envio do provedor;
- Bloqueio por spam;
- Falhas temporárias de rede.

---

## 14. Recomendações preventivas

Para ambiente profissional, considere adicionar:

- Fila com BullMQ;
- Retry automático;
- Logs estruturados;
- Auditoria de envio;
- Rate limit;
- Provider fake para testes;
- Templates com React Email;
- Monitoramento de bounce e falha;
- Validação de variáveis de ambiente com Zod.

---

## 15. Próximos passos recomendados

Após implementar a base, evolua para:

```txt
shared/email/
  providers/
    fake-email-provider.ts
    resend-email-provider.ts
    nodemailer-email-provider.ts
  queue/
    email-queue.ts
  templates/
    auth-email-templates.ts
    organization-email-templates.ts
    notification-email-templates.ts
```

Essa evolução ajuda o projeto a crescer com organização e baixo acoplamento.
