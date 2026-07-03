import { Injectable } from '@nestjs/common';
import { User } from '../domain/user';
import { UserRepository } from '../domain/ports/user.repository';

/**
 * Dev/test adapter. Swap for a PostgreSQL adapter when persistence lands —
 * nothing outside this file changes (that is the point of the port).
 */
@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly byUsername = new Map<string, User>();

  async findByUsername(username: string): Promise<User | null> {
    return this.byUsername.get(username) ?? null;
  }

  async save(user: User): Promise<void> {
    this.byUsername.set(user.username, user);
  }
}
