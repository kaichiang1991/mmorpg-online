import { InvalidCredentialsError } from '../domain/errors';
import { PasswordHasher } from '../domain/ports/password-hasher';
import { User } from '../domain/user';
import { UserRepository } from '../domain/ports/user.repository';
import { LoginUseCase } from './login.use-case';
import { RegisterUserUseCase } from './register-user.use-case';
import { TokenPayload, TokenService } from '../domain/ports/token.service';

class FakeUserRepository implements UserRepository {
  private byName = new Map<string, User>();
  async findByUsername(username: string): Promise<User | null> {
    return this.byName.get(username) ?? null;
  }
  async save(user: User): Promise<void> {
    this.byName.set(user.username, user);
  }
}

class FakeHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

class FakeTokenService implements TokenService {
  issue(payload: TokenPayload): string {
    return `token:${payload.username}`;
  }
  verify(token: string): TokenPayload | null {
    const username = token.replace(/^token:/, '');
    return token.startsWith('token:') ? { sub: 'id', username } : null;
  }
}

describe('LoginUseCase', () => {
  let repo: FakeUserRepository;
  let login: LoginUseCase;

  beforeEach(async () => {
    repo = new FakeUserRepository();
    const hasher = new FakeHasher();
    login = new LoginUseCase(repo, hasher, new FakeTokenService());
    await new RegisterUserUseCase(repo, hasher).execute('alice', 'password123');
  });

  it('returns a token for valid credentials', async () => {
    const result = await login.execute('alice', 'password123');
    expect(result).toEqual({ token: 'token:alice', username: 'alice' });
  });

  it('rejects a wrong password', async () => {
    await expect(login.execute('alice', 'wrong-password')).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('rejects an unknown user', async () => {
    await expect(login.execute('bob', 'password123')).rejects.toThrow(InvalidCredentialsError);
  });
});
