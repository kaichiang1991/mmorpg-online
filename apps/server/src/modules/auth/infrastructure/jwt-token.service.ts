import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload, TokenService } from '../application/token.service';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwt: JwtService) {}

  issue(payload: TokenPayload): string {
    return this.jwt.sign(payload);
  }

  verify(token: string): TokenPayload | null {
    try {
      const decoded = this.jwt.verify<TokenPayload & { iat: number; exp: number }>(token);
      return { sub: decoded.sub, username: decoded.username };
    } catch {
      return null;
    }
  }
}
