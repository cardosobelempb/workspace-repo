# Guia de Implantação — Notifications em Monorepo

## 1. Objetivo

Criar uma arquitetura profissional de notificações no monorepo, separando o núcleo genérico dos providers específicos.

A arquitetura final será:

```txt
packages/
  notifications-core/
  notification-email/
  notification-sms/
  notification-whatsapp/

apps/
  api/
```

---

## 2. Responsabilidades

### `@repo/notifications-core`

Responsável por contratos, tipos e serviço principal.

Não conhece Nodemailer, Twilio, Meta, SendGrid ou qualquer provider externo.

### `@repo/notification-email`

Responsável por adapters e templates de email.

### `@repo/notification-sms`

Responsável por adapters e templates de SMS.

### `@repo/notification-whatsapp`

Responsável por adapters e templates de WhatsApp usando a API oficial da Meta.

### `apps/api`

Responsável por controller, rotas, autenticação, casos de uso e regra de negócio contextual.

---

## 3. Estrutura final

```txt
packages/
  notifications-core/
    src/
      contracts/
        notification-provider.contract.ts
      errors/
        notification-send.error.ts
      services/
        notification.service.ts
      types/
        notification-channel.ts
        notification-message.ts
      index.ts

  notification-whatsapp/
    src/
      adapters/
        meta-whatsapp.adapter.ts
        fake-whatsapp.adapter.ts
      templates/
        auth-whatsapp.templates.ts
      validations/
        whatsapp-config.schema.ts
      index.ts
    package.json
```

---

# Parte 1 — Criando o Core

## 4. Criar package `notifications-core`

```bash
mkdir -p packages/notifications-core/src
```

Crie:

```txt
packages/notifications-core/package.json
```

```json
{
  "name": "@repo/notifications-core",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

---

## 5. Criar canais de notificação

Arquivo:

```txt
packages/notifications-core/src/types/notification-channel.ts
```

```ts
export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  WHATSAPP = "WHATSAPP",
  PUSH = "PUSH",
}
```

---

## 6. Criar mensagem padrão

Arquivo:

```txt
packages/notifications-core/src/types/notification-message.ts
```

```ts
import { NotificationChannel } from "./notification-channel";

export type NotificationMessage = {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  content: string;
  html?: string;
  metadata?: Record<string, unknown>;
};
```

---

## 7. Criar contrato do provider

Arquivo:

```txt
packages/notifications-core/src/contracts/notification-provider.contract.ts
```

```ts
import { NotificationMessage } from "../types/notification-message";

export interface NotificationProviderContract {
  readonly channel: string;

  send(message: NotificationMessage): Promise<void>;
}
```

---

## 8. Criar erro customizado

Arquivo:

```txt
packages/notifications-core/src/errors/notification-send.error.ts
```

```ts
export class NotificationSendError extends Error {
  constructor(message = "Erro ao enviar notificação") {
    super(message);
    this.name = "NotificationSendError";
  }
}
```

---

## 9. Criar service principal

Arquivo:

```txt
packages/notifications-core/src/services/notification.service.ts
```

```ts
import { NotificationProviderContract } from "../contracts/notification-provider.contract";
import { NotificationSendError } from "../errors/notification-send.error";
import { NotificationMessage } from "../types/notification-message";

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
      throw new NotificationSendError(
        `Provider não encontrado para o canal: ${message.channel}`,
      );
    }

    await provider.send(message);
  }

  async sendMany(messages: NotificationMessage[]): Promise<void> {
    await Promise.all(messages.map((message) => this.send(message)));
  }
}
```

---

## 10. Exportar o core

Arquivo:

```txt
packages/notifications-core/src/index.ts
```

```ts
export * from "./contracts/notification-provider.contract";

export * from "./errors/notification-send.error";

export * from "./services/notification.service";

export * from "./types/notification-channel";
export * from "./types/notification-message";
```

---

# Parte 2 — Criando o Provider WhatsApp

## 11. Criar package `notification-whatsapp`

```bash
mkdir -p packages/notification-whatsapp/src
```

Crie:

```txt
packages/notification-whatsapp/package.json
```

```json
{
  "name": "@repo/notification-whatsapp",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@repo/notifications-core": "workspace:*",
    "zod": "^3.23.8"
  }
}
```

---

## 12. Criar validação de configuração

Arquivo:

```txt
packages/notification-whatsapp/src/validations/whatsapp-config.schema.ts
```

```ts
import { z } from "zod";

export const whatsappConfigSchema = z.object({
  accessToken: z.string().min(1),
  phoneNumberId: z.string().min(1),
  apiVersion: z.string().default("v20.0"),
});

export type WhatsAppConfig = z.infer<typeof whatsappConfigSchema>;
```

---

## 13. Criar adapter oficial da Meta

Arquivo:

```txt
packages/notification-whatsapp/src/adapters/meta-whatsapp.adapter.ts
```

```ts
import {
  NotificationChannel,
  NotificationMessage,
  NotificationProviderContract,
} from "@repo/notifications-core";

import { WhatsAppConfig } from "../validations/whatsapp-config.schema";

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
        `Erro ao enviar mensagem WhatsApp: ${response.status} ${JSON.stringify(error)}`,
      );
    }
  }
}
```

---

## 14. Criar adapter fake para testes

Arquivo:

```txt
packages/notification-whatsapp/src/adapters/fake-whatsapp.adapter.ts
```

```ts
import {
  NotificationChannel,
  NotificationMessage,
  NotificationProviderContract,
} from "@repo/notifications-core";

export class FakeWhatsAppAdapter implements NotificationProviderContract {
  public readonly channel = NotificationChannel.WHATSAPP;

  public readonly sentMessages: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<void> {
    this.sentMessages.push(message);
  }
}
```

---

## 15. Criar templates de WhatsApp

Arquivo:

```txt
packages/notification-whatsapp/src/templates/auth-whatsapp.templates.ts
```

```ts
export const AuthWhatsAppTemplates = {
  verificationCode(input: { code: string }): string {
    return `Seu código de verificação é: ${input.code}`;
  },

  resetPasswordCode(input: { code: string }): string {
    return `Use o código ${input.code} para redefinir sua senha.`;
  },

  loginAlert(input: { appName: string }): string {
    return `Detectamos um novo login na sua conta ${input.appName}. Se não foi você, altere sua senha imediatamente.`;
  },
};
```

---

## 16. Exportar package WhatsApp

Arquivo:

```txt
packages/notification-whatsapp/src/index.ts
```

```ts
export * from "./adapters/meta-whatsapp.adapter";
export * from "./adapters/fake-whatsapp.adapter";

export * from "./templates/auth-whatsapp.templates";

export * from "./validations/whatsapp-config.schema";
```

---

# Parte 3 — Usando na API

## 17. Adicionar dependências na `apps/api`

No `package.json` da API:

```json
{
  "dependencies": {
    "@repo/notifications-core": "workspace:*",
    "@repo/notification-whatsapp": "workspace:*"
  }
}
```

---

## 18. Configurar variáveis de ambiente

Arquivo:

```txt
apps/api/.env
```

```env
WHATSAPP_ACCESS_TOKEN=seu_token_da_meta
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_API_VERSION=v20.0
```

---

## 19. Criar factory na API

Arquivo:

```txt
apps/api/src/shared/factories/notification-service.factory.ts
```

```ts
import { NotificationService } from "@repo/notifications-core";

import { MetaWhatsAppAdapter, whatsappConfigSchema } from "@repo/notification-whatsapp";

export function makeNotificationService(): NotificationService {
  const whatsappConfig = whatsappConfigSchema.parse({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION,
  });

  const whatsappAdapter = new MetaWhatsAppAdapter(whatsappConfig);

  return new NotificationService([whatsappAdapter]);
}
```

---

## 20. Usar em um caso de uso

Arquivo:

```txt
apps/api/src/modules/auth/use-cases/send-whatsapp-code.use-case.ts
```

```ts
import { NotificationChannel, NotificationService } from "@repo/notifications-core";

import { AuthWhatsAppTemplates } from "@repo/notification-whatsapp";

type SendWhatsAppCodeInput = {
  phone: string;
  code: string;
};

export class SendWhatsAppCodeUseCase {
  constructor(private readonly notificationService: NotificationService) {}

  async execute(input: SendWhatsAppCodeInput): Promise<void> {
    const content = AuthWhatsAppTemplates.verificationCode({
      code: input.code,
    });

    await this.notificationService.send({
      channel: NotificationChannel.WHATSAPP,
      to: input.phone,
      content,
      metadata: {
        type: "AUTH_VERIFICATION_CODE",
      },
    });
  }
}
```

---

## 21. Criar controller de exemplo

Arquivo:

```txt
apps/api/src/modules/auth/controllers/send-whatsapp-code.controller.ts
```

```ts
import { Request, Response } from "express";

import { makeNotificationService } from "../../../shared/factories/notification-service.factory";
import { SendWhatsAppCodeUseCase } from "../use-cases/send-whatsapp-code.use-case";

export class SendWhatsAppCodeController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { phone, code } = request.body;

    const notificationService = makeNotificationService();

    const useCase = new SendWhatsAppCodeUseCase(notificationService);

    await useCase.execute({
      phone,
      code,
    });

    return response.status(204).send();
  }
}
```

---

# Parte 4 — Envio com Template Oficial

## 22. Quando usar template oficial

A Meta permite mensagens livres dentro da janela de atendimento. Para iniciar conversa fora dessa janela, normalmente você precisa usar templates aprovados no WhatsApp Manager.

Por isso, em produção, é importante suportar envio de template.

---

## 23. Criar tipo para template oficial

Arquivo:

```txt
packages/notification-whatsapp/src/types/whatsapp-template-message.ts
```

```ts
export type WhatsAppTemplateLanguage = {
  code: string;
};

export type WhatsAppTemplateComponent = {
  type: "header" | "body" | "button";
  parameters: Array<{
    type: "text";
    text: string;
  }>;
};

export type WhatsAppTemplateMessage = {
  to: string;
  templateName: string;
  language: WhatsAppTemplateLanguage;
  components?: WhatsAppTemplateComponent[];
};
```

---

## 24. Adicionar método `sendTemplate`

Atualize:

```txt
packages/notification-whatsapp/src/adapters/meta-whatsapp.adapter.ts
```

```ts
import {
  NotificationChannel,
  NotificationMessage,
  NotificationProviderContract,
} from "@repo/notifications-core";

import { WhatsAppTemplateMessage } from "../types/whatsapp-template-message";
import { WhatsAppConfig } from "../validations/whatsapp-config.schema";

export class MetaWhatsAppAdapter implements NotificationProviderContract {
  public readonly channel = NotificationChannel.WHATSAPP;

  constructor(private readonly config: WhatsAppConfig) {}

  async send(message: NotificationMessage): Promise<void> {
    await this.postMessage({
      messaging_product: "whatsapp",
      to: message.to,
      type: "text",
      text: {
        body: message.content,
      },
    });
  }

  async sendTemplate(message: WhatsAppTemplateMessage): Promise<void> {
    await this.postMessage({
      messaging_product: "whatsapp",
      to: message.to,
      type: "template",
      template: {
        name: message.templateName,
        language: message.language,
        components: message.components,
      },
    });
  }

  private async postMessage(payload: Record<string, unknown>): Promise<void> {
    const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);

      throw new Error(
        `Erro ao enviar mensagem WhatsApp: ${response.status} ${JSON.stringify(error)}`,
      );
    }
  }
}
```

---

## 25. Exportar tipo de template

Atualize:

```txt
packages/notification-whatsapp/src/index.ts
```

```ts
export * from "./adapters/meta-whatsapp.adapter";
export * from "./adapters/fake-whatsapp.adapter";

export * from "./templates/auth-whatsapp.templates";

export * from "./types/whatsapp-template-message";

export * from "./validations/whatsapp-config.schema";
```

---

## 26. Exemplo de envio com template oficial

```ts
import { MetaWhatsAppAdapter, whatsappConfigSchema } from "@repo/notification-whatsapp";

const config = whatsappConfigSchema.parse({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  apiVersion: process.env.WHATSAPP_API_VERSION,
});

const whatsappAdapter = new MetaWhatsAppAdapter(config);

await whatsappAdapter.sendTemplate({
  to: "5583999999999",
  templateName: "hello_world",
  language: {
    code: "en_US",
  },
});
```

---

# Parte 5 — Regras importantes

## 27. Formato do telefone

Use número no formato internacional, sem `+`:

```txt
5583999999999
```

---

## 28. O que fica no package

O package pode ter:

```txt
send()
sendTemplate()
templates genéricos
validações
adapters
tipos
```

---

## 29. O que fica na API

A API deve conter:

```txt
RegisterUserUseCase
ForgotPasswordUseCase
SendTwoFactorCodeUseCase
InviteMemberUseCase
```

A API decide o motivo da notificação.

O package apenas envia.

---

# Parte 6 — Checklist

Antes de finalizar:

- [ ] `notifications-core` não depende de nenhum provider;
- [ ] `notification-whatsapp` depende apenas do core;
- [ ] `apps/api` monta o `NotificationService`;
- [ ] variáveis da Meta estão no `.env`;
- [ ] telefone está em formato internacional;
- [ ] existe adapter fake para testes;
- [ ] templates oficiais foram aprovados no WhatsApp Manager;
- [ ] mensagens livres respeitam a janela de atendimento;
- [ ] erros da Meta são logados com segurança, sem vazar token.

---

# Parte 7 — Próximas evoluções

Recomendações para produção:

```txt
packages/
  notification-whatsapp/
    src/
      webhooks/
        whatsapp-webhook-verifier.ts
        whatsapp-webhook-parser.ts
      types/
        whatsapp-media-message.ts
        whatsapp-interactive-message.ts
      services/
        whatsapp-template.service.ts
```

Também recomendo adicionar:

- fila com BullMQ;
- retry com backoff;
- logs estruturados;
- auditoria de notificações;
- idempotência;
- rate limit;
- fallback para SMS;
- tratamento de erro por código da Meta;
- validação de opt-in do usuário.

---

# Conclusão

A melhor abordagem é manter o core totalmente genérico e separar cada provider em um package próprio.

Assim, o monorepo fica preparado para crescer com:

```txt
@repo/notifications-core
@repo/notification-email
@repo/notification-sms
@repo/notification-whatsapp
@repo/notification-push
```

Essa separação reduz acoplamento, melhora testabilidade e facilita evolução do produto.
