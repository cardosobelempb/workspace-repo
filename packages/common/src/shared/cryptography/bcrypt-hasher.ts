export abstract class BcryptHasher {
  abstract hash(token: string, saltRounds: number): Promise<string>;
  abstract generate(): Promise<string>;
  abstract verify(token: string, storedHash: string): Promise<boolean>;
}
