export type LoginDto = { email: string; password: string };
export type RegisterDto = {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
};
export type AuthUserProjectionDto = {
  id: string;
  email: string;
  emailVerified: Date | null | boolean;
};
export type AuthProjectionDto = {
  user: AuthUserProjectionDto;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};
