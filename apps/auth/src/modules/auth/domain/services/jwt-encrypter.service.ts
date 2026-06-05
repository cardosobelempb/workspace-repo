import { envAuth } from "@/config/env-auth";
import { JwtEncrypter, Tokens } from "@repo/common";
import jwt from "jsonwebtoken";
export type JwtPayload = {
  sub: string;
  email: string;
  // memberships: Array<{
  //   tenantId: string;
  //   organizationId: string | null;
  //   role: string;
  // }>;
};

export class JwtEncrypterService implements JwtEncrypter<JwtPayload> {
  verifyAccessToken(token: string): JwtPayload | null {
    const payload = jwt.verify(
      token,
      envAuth.JWT_ACCESS_TOKEN_SECRET as string,
    ) as JwtPayload;
    if (!payload) {
      return null;
    }
    return payload;
  }
  verifyRefreshToken(token: string): JwtPayload | null {
    const payload = jwt.verify(
      token,
      envAuth.JWT_REFRESH_TOKEN_SECRET as string,
    ) as JwtPayload;
    if (!payload) {
      return null;
    }
    return payload;
  }
  decodeAccessToken(token: string): JwtPayload | null {
    const payload = jwt.decode(token) as JwtPayload;
    if (!payload) {
      return null;
    }
    return payload;
  }
  decodeRefreshToken(token: string): JwtPayload | null {
    const payload = jwt.decode(token) as JwtPayload;
    if (!payload) {
      return null;
    }
    return payload;
  }
  createAccessToken(payload: JwtPayload): string {
    const token = jwt.sign(payload, envAuth.JWT_ACCESS_TOKEN_SECRET as string, {
      expiresIn: envAuth.JWT_ACCESS_TOKEN_EXPIRES_IN,
    });
    return token;
  }
  async createAsyncAccessToken(payload: JwtPayload): Promise<string> {
    const token = jwt.sign(payload, envAuth.JWT_ACCESS_TOKEN_SECRET as string, {
      expiresIn: envAuth.JWT_ACCESS_TOKEN_EXPIRES_IN,
    });
    return Promise.resolve(token);
  }
  createRefreshToken(payload: JwtPayload): string {
    const token = jwt.sign(payload, envAuth.JWT_REFRESH_TOKEN_SECRET as string, {
      expiresIn: envAuth.JWT_REFRESH_TOKEN_EXPIRES_IN,
    });
    return token;
  }
  async createAsyncRefreshToken(payload: JwtPayload): Promise<string> {
    const token = jwt.sign(payload, envAuth.JWT_REFRESH_TOKEN_SECRET as string, {
      expiresIn: envAuth.JWT_REFRESH_TOKEN_EXPIRES_IN,
    });
    return Promise.resolve(token);
  }
  createTokens(payload: JwtPayload): Tokens {
    const accessToken = this.createAccessToken(payload);
    const refreshToken = this.createRefreshToken(payload);
    return { accessToken, refreshToken };
  }
  isAccessToken(token: string): boolean {
    const payload = jwt.decode(token) as JwtPayload;
    if (!payload) {
      return false;
    }
    return true;
  }
  isRefreshToken(token: string): boolean {
    const payload = jwt.decode(token) as JwtPayload;
    if (!payload) {
      return false;
    }
    return true;
  }
}
