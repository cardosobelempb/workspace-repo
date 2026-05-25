// ─── Tipos inferidos ──────────────────────────────────────────────────────────
//
// Nunca escreva tipos manualmente — inferidos diretamente dos schemas.
// Se o schema mudar, o tipo muda junto automaticamente.

import z from "zod";
import {
  CreateUserProfileSchema,
  UpdateUserProfileSchema,
  UserProfileCreateResponseSchema,
  UserProfileFindByIdResponseSchema,
  UserProfilePageResponseSchema,
  UserProfileResponseSchema,
  UserProfileSchema,
  UserProfileSummarySchema,
  UserProfileUpdateResponseSchema,
} from "@/modules/user/infrastructure/http/schemas/user-profile.schema";

export type UserProfileDto = z.infer<typeof UserProfileSchema>;
export type CreateUserProfileDto = z.infer<typeof CreateUserProfileSchema>;
export type UpdateUserProfileDto = z.infer<typeof UpdateUserProfileSchema>;
export type UserProfileSummaryDto = z.infer<typeof UserProfileSummarySchema>;
export type UserProfileResponseDto = z.infer<typeof UserProfileResponseSchema>;
export type UserProfileCreateResponseDto = z.infer<
  typeof UserProfileCreateResponseSchema
>;
export type UserProfileFindByIdResponseDto = z.infer<
  typeof UserProfileFindByIdResponseSchema
>;
export type UserProfileUpdateResponseDto = z.infer<
  typeof UserProfileUpdateResponseSchema
>;
export type UserProfilePageResponseDto = z.infer<typeof UserProfilePageResponseSchema>;
