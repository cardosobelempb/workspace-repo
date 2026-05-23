// ============================================================
// Padronização das chaves Redis
// ============================================================

export class CacheKeyFactory {
  // --------------------------------------------------------
  // Users
  // --------------------------------------------------------

  static userById(id: string) {
    return `users:id:${id}`;
  }

  static userByEmail(email: string) {
    return `users:email:${email.toLowerCase()}`;
  }

  static usersPage(params: unknown) {
    return `users:page:${JSON.stringify(params)}`;
  }

  static usersPrefix() {
    return "users:";
  }

  // --------------------------------------------------------
  // Organizations
  // --------------------------------------------------------

  static organizationBySlug(slug: string) {
    return `organizations:slug:${slug}`;
  }

  // --------------------------------------------------------
  // Portal
  // --------------------------------------------------------

  static portalBySlug(slug: string) {
    return `portal:${slug}`;
  }
}
