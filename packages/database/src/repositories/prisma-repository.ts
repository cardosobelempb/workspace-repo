// shared/database/prisma-repository.ts

import { PrismaClient } from "@prisma/client";
import { BaseRepository } from "@repo/common";

export type PrismaTransaction = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

/**
 * Raiz da hierarquia de repositórios.
 * Define e protege a instância do Prisma — declarada UMA única vez aqui.
 * Todas as subclasses herdam `this.prisma` sem precisar redeclarar.
 */
export abstract class PrismaRepository<T> extends BaseRepository<T> {
  protected readonly prisma: PrismaTransaction;

  constructor(prisma: PrismaTransaction) {
    super();
    this.prisma = prisma;
  }

  /**
   * ✅ Método ESTÁTICO — cria instância a partir da classe diretamente.
   * Uso: PrismaUserRepository.withTx(tx)
   *
   * Mantido para casos onde a classe concreta está disponível.
   */
  static withTx<T extends PrismaRepository<T>>(
    this: new (tx: PrismaTransaction) => T,
    tx: PrismaTransaction,
  ): T {
    return new this(tx);
  }

  /**
   * ✅ Método de INSTÂNCIA — cria nova instância do mesmo tipo com o contexto tx.
   * Uso: this.tenantRepo.withTx(tx)
   *
   * Usa `this.constructor` para recriar a instância do tipo concreto correto
   * (ex: PrismaTenantRepository), sem que o Use Case precise conhecê-lo.
   *
   * Padrão: Self-referential Factory via prototype chain.
   */
  withTx(tx: PrismaTransaction): this {
    // `this.constructor` aponta para a classe concreta em tempo de execução
    // ex: mesmo que `this` seja tipado como TenantRepository (abstrato),
    // `this.constructor` será PrismaTenantRepository (concreto)
    const ConcreteClass = this.constructor as new (tx: PrismaTransaction) => this;
    return new ConcreteClass(tx);
  }
}
