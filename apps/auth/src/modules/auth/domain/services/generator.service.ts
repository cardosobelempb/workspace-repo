import { HashGenerator } from "@repo/common";
import bcrypt from "bcryptjs";

export class GeneratorService implements HashGenerator {
  hash(plain: string): Promise<string> {
    const saltRounds = 12;
    const hash = bcrypt.hash(plain, saltRounds);
    return hash;
  }
}
