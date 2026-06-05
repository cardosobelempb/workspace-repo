import { BcryptHashGenerator } from "@repo/common";
import bcrypt from "bcryptjs";

export class BcryptGeneratorService implements BcryptHashGenerator {
  hash(plain: string): Promise<string> {
    const saltRounds = 12;
    const hash = bcrypt.hash(plain, saltRounds);
    return hash;
  }
}
