export abstract class BcryptHasher {
  abstract hash(token: string, saltRounds: number): Promise<string>;
}
