import { HashComparer } from "@repo/common";
import bcrypt from "bcryptjs";

export class ComparerService implements HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(plain, hash);
    return isMatch;
  }
}
