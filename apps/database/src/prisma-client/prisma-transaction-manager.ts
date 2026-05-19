/**
 * Implementação Prisma do TransactionManager.
 *
 * Toda a "sujeira" do Prisma ($transaction, PrismaTransaction)
 * fica isolada aqui — longe do domínio.
 *
 * @Injectable() → registrado no módulo de infraestrutura
 */

import { TransactionManager } from "../transaction/transaction-manager";
import { PrismaDatabase } from "./prisma";
import { PrismaTransaction } from "./prisma-transaction";

export class PrismaTransactionManager implements TransactionManager {
  protected readonly prisma: PrismaDatabase;

  constructor(prisma: PrismaDatabase) {
    this.prisma = prisma;
  }

  /**
   * Delega para o mecanismo de transação nativo do Prisma.
   * Rollback automático em qualquer exceção lançada dentro do `work`.
   */
  async run<T>(work: (tx: PrismaTransaction) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => work(tx));
  }
}
