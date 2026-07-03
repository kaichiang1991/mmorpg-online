import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../domain/errors';
import { PASSWORD_HASHER, PasswordHasher } from '../domain/ports/password-hasher';
import { USER_REPOSITORY, UserRepository } from '../domain/ports/user.repository';
import { TOKEN_SERVICE, TokenService } from '../domain/ports/token.service';

export interface LoginResult {
  token: string;
  username: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(username: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByUsername(username);
    if (!user || !(await this.hasher.compare(password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }
    return {
      token: this.tokens.issue({ sub: user.id, username: user.username }),
      username: user.username,
    };
  }
}
