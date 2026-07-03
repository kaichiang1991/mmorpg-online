export interface TokenPayload {
  sub: string;
  username: string;
}

/** Port: issue/verify auth tokens. Infrastructure adapter wraps JWT. */
export interface TokenService {
  issue(payload: TokenPayload): string;
  /** returns null when the token is invalid or expired */
  verify(token: string): TokenPayload | null;
}

export const TOKEN_SERVICE = Symbol('TokenService');
