/** Base class for domain rule violations. Presentation layer maps these to HTTP codes. */
export class DomainError extends Error {}

export class ValidationError extends DomainError {}

export class UsernameTakenError extends DomainError {
  constructor(username: string) {
    super(`username "${username}" is already taken`);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('invalid username or password');
  }
}
