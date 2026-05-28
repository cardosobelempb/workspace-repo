// ============================================================
// User.schema.ts
// Schemas exclusivos da entidade User.
// Importa dos shared — zero duplicação de erros/paginação.
// ============================================================

import {
  actionResponseSchema,
  createResponseSchema,
  findResponseSchema,
  pageResponseSchema,
  s,
  updateResponseSchema,
  UuidSchema,
} from "@repo/common";
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
    email: s.email,
    passwordHash: s.password,
    createdAt: s.date,
    emailVerified: s.nullableDate,
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
  email: true,
  emailVerified: true,
  createdAt: true,
});

// ─── Response wrappers via factory ───────────────────────────────────────────
//
// Cada wrapper envelopa UserResponseSchema (entidade completa),
// não o schema de input — a resposta de create/update devolve a entidade
// persistida, não o payload que o cliente enviou.

export const UserRegisterSchema = UserSchema.omit({
  id: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// Payload de criação: sem campos gerados pelo servidor
export const UserRegisterProjectionSchema = UserSchema.pick({
  id: true,
  email: true,
  createdAt: true,
  emailVerified: true,
});

export const UserCreateResponseSchema = createResponseSchema(UserResponseSchema);
export const UserFindByIdResponseSchema = findResponseSchema(UserResponseSchema);
export const UserUpdateResponseSchema = updateResponseSchema(UserResponseSchema);
export const UserActivateResponseSchema = actionResponseSchema();
export const UserDeactivateResponseSchema = actionResponseSchema();
export const UserProjectionResponseSchema = pageResponseSchema(UserProjectionSchema);
