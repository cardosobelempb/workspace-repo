export abstract class BcryptHashGenerator {
  abstract hash(plain: string): Promise<string>;
}
