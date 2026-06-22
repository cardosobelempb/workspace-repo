// ─── Tipos inferidos ──────────────────────────────────────────────────────────
//
// Nunca escreva tipos manualmente — inferidos diretamente dos schemas.
// Se o schema mudar, o tipo muda junto automaticamente.

import {
  CreateUserSchema,
  UpdateUserSchema,
  UserActivateResponseSchema,
  UserCreateResponseSchema,
  UserDeactivateResponseSchema,
  UserFindByIdResponseSchema,
  UserProjectionSchema,
  UserRegisterProjectionSchema,
  UserRegisterSchema,
  UserResponseSchema,
  UserSchema,
  UserSessionProjectionSchema,
  UserSessionSchema,
  UserUpdateResponseSchema,
} from "@/common/infrastructure/http/schemas/user.schema";
import z from "zod";

export type UserDto = z.infer<typeof UserSchema>;
export type UserRegisterDto = z.infer<typeof UserRegisterSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UserProjectionDto = z.infer<typeof UserProjectionSchema>;
export type UserResponseDto = z.infer<typeof UserResponseSchema>;
export type UserCreateResponseDto = z.infer<typeof UserCreateResponseSchema>;
export type UserFindByIdResponseDto = z.infer<typeof UserFindByIdResponseSchema>;
export type UserUpdateResponseDto = z.infer<typeof UserUpdateResponseSchema>;
export type UserActivateResponseDto = z.infer<typeof UserActivateResponseSchema>;
export type UserDeactivateResponseDto = z.infer<typeof UserDeactivateResponseSchema>;
export type UserSessionDto = z.infer<typeof UserSessionSchema>;
export type UserSessionProjectionDto = z.infer<typeof UserSessionProjectionSchema>;
export type UserRegisterProjectionDto = z.infer<typeof UserRegisterProjectionSchema>;
