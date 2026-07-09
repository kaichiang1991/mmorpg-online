import { UsernameTakenError, ValidationError } from '../domain/errors';
import { PasswordHasher } from '../domain/ports/password-hasher';
import { User } from '../domain/user';
import { UserRepository } from '../domain/ports/user.repository';
import { RegisterUserUseCase } from './register-user.use-case';

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

describe('RegisterUserUseCase', () => {
  let repo: FakeUserRepository;
  let register: RegisterUserUseCase;

  beforeEach(() => {
    repo = new FakeUserRepository();
    register = new RegisterUserUseCase(repo, new FakeHasher());
  });

  it('creates a user with a hashed password', async () => {
    const user = await register.execute('alice', 'password123');
    expect(user.username).toBe('alice');
    expect(user.passwordHash).toBe('hashed:password123');
    expect(await repo.findByUsername('alice')).not.toBeNull();
  });

  it('rejects a duplicate username', async () => {
    await register.execute('alice', 'password123');
    await expect(register.execute('alice', 'password456')).rejects.toThrow(UsernameTakenError);
  });

  it('rejects a short password', async () => {
    await expect(register.execute('alice', 'short')).rejects.toThrow(ValidationError);
  });

  it('rejects an invalid username', async () => {
    await expect(register.execute('a!', 'password123')).rejects.toThrow(ValidationError);
  });
});
