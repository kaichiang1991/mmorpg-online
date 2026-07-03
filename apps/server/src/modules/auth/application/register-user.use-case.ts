import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UsernameTakenError } from '../domain/errors';
import { PASSWORD_HASHER, PasswordHasher } from '../domain/password-hasher';
import { User } from '../domain/user';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(username: string, password: string): Promise<User> {
    User.assertValidPassword(password);
    if (await this.users.findByUsername(username)) {
      throw new UsernameTakenError(username);
    }
    const user = User.create(randomUUID(), username, await this.hasher.hash(password));
    await this.users.save(user);
    return user;
  }
}
