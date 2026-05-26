import crypto from "node:crypto";

export class SessionTokenService {
  // fix 1: HMAC precisa de uma chave secreta do ambiente
  constructor(private readonly secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error("SessionTokenService: secret must be at least 32 characters");
    }
  }

  /**
   * Gera token opaco de sessão.
   * 64 bytes = 512 bits de entropia — imune a força bruta.
   */
  generate(): string {
    return crypto.randomBytes(64).toString("base64url");
  }

  /**
   * Gera HMAC-SHA256 do token para persistência/cache.
   * HMAC + secret invalida rainbow tables mesmo se o DB vazar.
   */
  hash(token: string): string {
    return crypto.createHmac("sha256", this.secret).update(token).digest("hex");
  }

  /**
   * Compara hash recebido com hash armazenado em tempo constante.
   * fix 2: `===` vaza timing — timingSafeEqual não.
   */
  verify(token: string, storedHash: string): boolean {
    const incoming = Buffer.from(this.hash(token), "hex");
    const stored = Buffer.from(storedHash, "hex");

    // buffers precisam ter o mesmo tamanho para timingSafeEqual não lançar
    if (incoming.length !== stored.length) return false;

    return crypto.timingSafeEqual(incoming, stored);
  }
}

/*
const tokenService = new SessionTokenService(process.env.SESSION_SECRET!);

const token = tokenService.generate();       // enviado ao cliente (cookie/header)
const hash  = tokenService.hash(token);      // armazenado no DB/cache

// na validação da requisição:
const isValid = tokenService.verify(rawToken, hashFromDb);
*/
