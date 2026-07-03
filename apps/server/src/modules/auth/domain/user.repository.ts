import { User } from './user';

/** Port: persistence for users. Infrastructure provides the adapter. */
export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
