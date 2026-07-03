/** Port: password hashing. Infrastructure provides the adapter (bcrypt, argon2...). */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PasswordHasher');
