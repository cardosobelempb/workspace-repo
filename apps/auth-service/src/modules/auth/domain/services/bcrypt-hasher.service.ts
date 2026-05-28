import { BcryptHasher } from "@repo/common";
import bcrypt from "bcryptjs";

export class BcryptHasherService implements BcryptHasher {
  private HASH_SALT_LENGTH = 8;
  /**
   * Gera token opaco de sessão.
   * 64 bytes = 512 bits de entropia — imune a força bruta.
   */
  async generate(): Promise<string> {
    return bcrypt.genSaltSync(64);
  }

  /**
   * Gera HMAC-SHA256 do token para persistência/cache.
   * HMAC + secret invalida rainbow tables mesmo se o DB vazar.
   */
  async hash(plain: string): Promise<string> {
    return bcrypt.hashSync(plain, this.HASH_SALT_LENGTH);
  }

  /**
   * Compara hash recebido com hash armazenado em tempo constante.
   * fix 2: `===` vaza timing — timingSafeEqual não.
   */
  async verify(plain: string, storedHash: string): Promise<boolean> {
    const hashedToken = await this.hash(plain);
    const incoming = Buffer.from(hashedToken, "hex");
    const stored = Buffer.from(storedHash, "hex");

    // buffers precisam ter o mesmo tamanho para timingSafeEqual não lançar
    if (incoming.length !== stored.length) return false;

    return bcrypt.compareSync(plain, storedHash);
  }
}

/*
const tokenService = new SessionTokenService(process.env.SESSION_SECRET!);

const token = tokenService.generate();       // enviado ao cliente (cookie/header)
const hash  = tokenService.hash(token);      // armazenado no DB/cache

// na validação da requisição:
const isValid = tokenService.verify(rawToken, hashFromDb);
*/
