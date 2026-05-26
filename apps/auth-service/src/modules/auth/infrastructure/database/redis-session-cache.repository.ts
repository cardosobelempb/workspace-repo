import { CacheKeyFactory, CacheService } from "@repo/cache";
import { TOKENS } from "@repo/common";
import { PrismaDatabase } from "@repo/database";

import { SessionEntity } from "../../domain/entities/session.entity";
import { SessionRepository } from "../../domain/repositoties/session.repository";
import { PrismaSessionMapper } from "../mappers/session.mapper";

const SESSION_CACHE_TTL_SECONDS = 60 * 15; // 15 minutos

export class RedisSessionCacheRepository extends SessionRepository {
  static inject = [TOKENS.PRISMA_CLIENT, TOKENS.REDIS_CLIENT];

  constructor(
    protected readonly prisma: PrismaDatabase,
    private readonly cache: CacheService,
  ) {
    super(prisma);
  }

  async findValidByTokenHash(sessionTokenHash: string): Promise<SessionEntity | null> {
    const key = CacheKeyFactory.sessionByTokenHash(sessionTokenHash);

    const cached = await this.cache.get<SessionEntity>(key);
    if (cached) return cached;

    const raw = await this.prisma.session.findFirst({
      where: {
        sessionToken: sessionTokenHash,
        expires: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!raw) return null;

    const session = PrismaSessionMapper.toDomain(raw);

    await this.cache.set(key, session, SESSION_CACHE_TTL_SECONDS);
    await this.cache.set(
      CacheKeyFactory.sessionById(session.id.getValue()),
      session,
      SESSION_CACHE_TTL_SECONDS,
    );

    return session;
  }

  async findBySessionToken(sessionToken: string): Promise<SessionEntity | null> {
    const key = CacheKeyFactory.sessionByTokenHash(sessionToken);

    const cached = await this.cache.get<SessionEntity>(key);
    if (cached) return cached;

    const raw = await this.prisma.session.findFirst({
      where: {
        sessionToken,
        deletedAt: null,
      },
    });

    if (!raw) return null;

    const session = PrismaSessionMapper.toDomain(raw);

    await this.cache.set(key, session, SESSION_CACHE_TTL_SECONDS);
    await this.cache.set(
      CacheKeyFactory.sessionById(session.id.getValue()),
      session,
      SESSION_CACHE_TTL_SECONDS,
    );

    return session;
  }

  async findById(id: string): Promise<SessionEntity | null> {
    const key = CacheKeyFactory.sessionById(id);

    const cached = await this.cache.get<SessionEntity>(key);
    if (cached) return cached;

    const raw = await this.prisma.session.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!raw) return null;

    const session = PrismaSessionMapper.toDomain(raw);

    await this.cache.set(key, session, SESSION_CACHE_TTL_SECONDS);

    return session;
  }

  async findActiveByUserId(userId: string): Promise<SessionEntity[]> {
    const key = CacheKeyFactory.sessionsActiveByUserId(userId);

    const cached = await this.cache.get<SessionEntity[]>(key);
    if (cached) return cached;

    const raws = await this.prisma.session.findMany({
      where: {
        userId,
        expires: { gt: new Date() },
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const sessions = raws.map(PrismaSessionMapper.toDomain);

    await this.cache.set(key, sessions, SESSION_CACHE_TTL_SECONDS);

    return sessions;
  }

  async findManyByIds(ids: string[]): Promise<SessionEntity[]> {
    if (ids.length === 0) return [];

    const cached = await Promise.all(
      ids.map((id) => this.cache.get<SessionEntity>(CacheKeyFactory.sessionById(id))),
    );

    const cachedMap = new Map(
      cached
        .filter((session): session is SessionEntity => session !== null)
        .map((session) => [session.id.getValue(), session]),
    );

    const missingIds = ids.filter((id) => !cachedMap.has(id));

    if (missingIds.length === 0) {
      return ids.map((id) => cachedMap.get(id)!);
    }

    const raws = await this.prisma.session.findMany({
      where: {
        id: { in: missingIds },
        deletedAt: null,
      },
    });

    const freshSessions = raws.map(PrismaSessionMapper.toDomain);

    await Promise.all(
      freshSessions.map((session) =>
        this.cache.set(
          CacheKeyFactory.sessionById(session.id.getValue()),
          session,
          SESSION_CACHE_TTL_SECONDS,
        ),
      ),
    );

    const resultMap = new Map(cachedMap);

    for (const session of freshSessions) {
      resultMap.set(session.id.getValue(), session);
    }

    return ids
      .map((id) => resultMap.get(id))
      .filter((session): session is SessionEntity => Boolean(session));
  }

  async exists(id: string): Promise<boolean> {
    const key = CacheKeyFactory.sessionExistsById(id);

    const cached = await this.cache.get<boolean>(key);
    if (cached !== null) return cached;

    const count = await this.prisma.session.count({
      where: {
        id,
        deletedAt: null,
        expires: { gt: new Date() },
      },
    });

    const exists = count > 0;

    await this.cache.set(key, exists, 60);

    return exists;
  }

  async create(entity: SessionEntity): Promise<SessionEntity> {
    const session = await this.prisma.session.create({
      data: PrismaSessionMapper.toPrisma(entity),
    });

    const domain = PrismaSessionMapper.toDomain(session);

    await this.invalidateUserSessions(domain.userId.getValue());

    await this.cache.set(
      CacheKeyFactory.sessionById(domain.id.getValue()),
      domain,
      SESSION_CACHE_TTL_SECONDS,
    );

    return domain;
  }

  async save(entity: SessionEntity): Promise<SessionEntity> {
    const session = await this.prisma.session.update({
      where: {
        id: entity.id.getValue(),
      },
      data: PrismaSessionMapper.toPrisma(entity),
    });

    const domain = PrismaSessionMapper.toDomain(session);

    await this.invalidateSession(domain);
    await this.invalidateUserSessions(domain.userId.getValue());

    await this.cache.set(
      CacheKeyFactory.sessionById(domain.id.getValue()),
      domain,
      SESSION_CACHE_TTL_SECONDS,
    );

    return domain;
  }

  async delete(entity: SessionEntity): Promise<void> {
    await this.prisma.session.delete({
      where: {
        id: entity.id.getValue(),
      },
    });

    await this.invalidateSession(entity);
    await this.invalidateUserSessions(entity.userId.getValue());
  }

  async revoke(sessionId: string): Promise<void> {
    const session = await this.findById(sessionId);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.cache.delete(CacheKeyFactory.sessionById(sessionId));
    await this.cache.delete(CacheKeyFactory.sessionExistsById(sessionId));

    if (session) {
      await this.invalidateUserSessions(session.userId.getValue());
    }
  }

  async revokeByTokenHash(sessionTokenHash: string): Promise<void> {
    const session = await this.findValidByTokenHash(sessionTokenHash);

    await this.prisma.session.updateMany({
      where: {
        sessionToken: sessionTokenHash,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.cache.delete(CacheKeyFactory.sessionByTokenHash(sessionTokenHash));

    if (session) {
      await this.invalidateSession(session);
      await this.invalidateUserSessions(session.userId.getValue());
    }
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    const sessions = await this.findActiveByUserId(userId);

    await this.prisma.session.updateMany({
      where: {
        userId,
        deletedAt: null,
        expires: { gt: new Date() },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await Promise.all(sessions.map((session) => this.invalidateSession(session)));

    await this.invalidateUserSessions(userId);
  }

  private async invalidateSession(session: SessionEntity): Promise<void> {
    await Promise.all([
      this.cache.delete(CacheKeyFactory.sessionById(session.id.getValue())),
      this.cache.delete(CacheKeyFactory.sessionExistsById(session.id.getValue())),
      this.cache.delete(CacheKeyFactory.sessionByTokenHash(session.sessionToken)),
    ]);
  }

  private async invalidateUserSessions(userId: string): Promise<void> {
    await this.cache.delete(CacheKeyFactory.sessionsActiveByUserId(userId));
  }
}
