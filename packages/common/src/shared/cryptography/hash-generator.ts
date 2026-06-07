export abstract class HashGenerator {
  abstract hash(token: string, saltRounds: number): Promise<string>;
}
