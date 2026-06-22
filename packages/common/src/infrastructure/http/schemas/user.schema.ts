// ============================================================
// User.schema.ts
// Schemas exclusivos da entidade User.
// Importa dos shared — zero duplicação de erros/paginação.
// ============================================================

import {
  actionResponseSchema,
  createResponseSchema,
  EmailSchema,
  findResponseSchema,
  pageResponseSchema,
  PasswordSchema,
  s,
  updateResponseSchema,
  UuidSchema,
  withPasswordConfirmation,
} from "@/common/shared";
import z from "zod";

// ─── Params ───────────────────────────────────────────────────────────────────

export const UserParamsSchema = z.object({
  userId: UuidSchema,
});

export type UserParams = z.infer<typeof UserParamsSchema>;

// ─── Schema base da entidade ──────────────────────────────────────────────────
//
// Fonte única de verdade para todos os schemas derivados.
//
// ⚠️  z.nativeEnum() — obrigatório para enums TypeScript.
//     z.enum() só aceita tuplas de string literal ["A","B"],
//     não enums compilados. Usar z.enum(EnumTS) quebra em runtime.

export const UserSchema = z
  .object({
    id: UuidSchema,
    firstName: s.string.nullable(),
    lastName: s.string.nullable(),
    email: EmailSchema,
    passwordHash: PasswordSchema,
    emailVerified: s.nullableDate,
    createdAt: s.date,
    updatedAt: s.nullableDate,
    deletedAt: s.nullableDate,
  })
  .strict();

// ─── Body schemas (entrada) ───────────────────────────────────────────────────

// Payload de criação: sem campos gerados pelo servidor
export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// Payload de criação: sem campos gerados pelo servidor
export const UserSessionSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
  })
  .strict();

// Payload de criação: sem campos gerados pelo servidor
// ⚠️ .strict() fica dentro do z.object() porque withPasswordConfirmation
//    retorna ZodEffects (que não aceita .strict() no final).
export const UserRegisterSchema = withPasswordConfirmation(
  z
    .object({
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
      email: EmailSchema,
      passwordHash: PasswordSchema,
      confirmPassword: PasswordSchema.optional(),
    })
    .strict(),
);

// Payload de atualização: todos os campos opcionais
// Não precisa de .strict() extra — já herdado do UserSchema base
export const UpdateUserSchema = UserSchema.partial();

// ─── Response schemas (saída) ─────────────────────────────────────────────────

// Resposta completa: expõe tudo exceto campos de soft-delete
export const UserResponseSchema = UserSchema.omit({
  passwordHash: true,
  updatedAt: true,
  deletedAt: true,
});

// Resumo para listagem: versão compacta — evita over-fetching
export const UserProjectionSchema = UserSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  createdAt: true,
});

// ─── Response wrappers via factory ───────────────────────────────────────────
//
// Cada wrapper envelopa UserResponseSchema (entidade completa),
// não o schema de input — a resposta de create/update devolve a entidade
// persistida, não o payload que o cliente enviou.

// Payload de criação: sem campos gerados pelo servidor
export const UserRegisterProjectionSchema = UserSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  createdAt: true,
});

export const UserSessionProjectionSchema = z
  .object({
    user: UserProjectionSchema,
    accessToken: s.token,
    refreshToken: s.token,
    expiresAt: s.date,
  })
  .strict();

export const UserCreateResponseSchema = createResponseSchema(UserResponseSchema);
export const UserFindByIdResponseSchema = findResponseSchema(UserResponseSchema);
export const UserUpdateResponseSchema = updateResponseSchema(UserResponseSchema);
export const UserActivateResponseSchema = actionResponseSchema();
export const UserDeactivateResponseSchema = actionResponseSchema();
export const UserProjectionResponseSchema = pageResponseSchema(UserProjectionSchema);
