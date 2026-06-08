import { AuthProvider } from "../enums/auth-provider.enum";

export type OAuthUserProfile = {
  [x: string]: string | null;
  provider: AuthProvider;
  providerAccountId: string;
  email: string;
  emailVerified: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export abstract class OAuthProvider {
  abstract provider: AuthProvider;

  abstract getAuthorizationUrl(input: { state: string; redirectUri: string }): string;

  abstract getUserProfile(input: {
    code: string;
    redirectUri: string;
  }): Promise<OAuthUserProfile>;
}
