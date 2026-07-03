import { ValidationError } from './errors';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_MIN_LENGTH = 8;

/** Aggregate root for an account. Invariants enforced at construction. */
export class User {
  private constructor(
    readonly id: string,
    readonly username: string,
    readonly passwordHash: string,
  ) {}

  static create(id: string, username: string, passwordHash: string): User {
    if (!USERNAME_RE.test(username)) {
      throw new ValidationError('username must be 3-20 chars of a-z, A-Z, 0-9 or _');
    }
    return new User(id, username, passwordHash);
  }

  /** Rehydrate from storage without re-validating (data was valid when persisted). */
  static restore(id: string, username: string, passwordHash: string): User {
    return new User(id, username, passwordHash);
  }

  static assertValidPassword(plain: string): void {
    if (plain.length < PASSWORD_MIN_LENGTH) {
      throw new ValidationError(`password must be at least ${PASSWORD_MIN_LENGTH} chars`);
    }
  }
}
