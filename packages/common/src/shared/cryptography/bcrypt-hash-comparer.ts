export abstract class BcryptHashComparer {
  abstract compare(plain: string, hash: string): Promise<boolean>;
}
