import { BcryptHashComparer } from "@repo/common";
import bcrypt from "bcryptjs";

export class BcryptComparerService implements BcryptHashComparer {
  compare(plain: string, hash: string): Promise<boolean> {
    const isMatch = bcrypt.compare(plain, hash);
    return isMatch;
  }
}
