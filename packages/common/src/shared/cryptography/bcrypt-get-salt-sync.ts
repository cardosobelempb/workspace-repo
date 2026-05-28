export abstract class BcryptGetSaltAsync {
  abstract genSaltSync(rounds?: number): Promise<string>;
}
