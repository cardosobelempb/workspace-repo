import { envAuth } from "@/config/env-auth";
import { TokenGenerator } from "@repo/common";
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

export class JwtService implements TokenGenerator<JwtPayload> {
  async generate(payload: JwtPayload): Promise<string> {
    const token = jwt.sign(payload, envAuth.JWT_ACCESS_TOKEN_SECRET as string, {
      expiresIn: envAuth.JWT_ACCESS_TOKEN_EXPIRES_IN,
    });
    return token;
  }

  verify(token: string): JwtPayload | null {
    throw new Error("Method not implemented.");
  }
  isValid(token: string): boolean {
    const payload = jwt.decode(token) as JwtPayload;
    if (!payload) {
      return false;
    }
    return true;
  }
  decode(token: string): JwtPayload | null {
    const payload = jwt.decode(token) as JwtPayload;
    if (!payload) {
      return null;
    }
    return payload;
  }
}
