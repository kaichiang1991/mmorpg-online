import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@mmo/shared';
import { LoginUseCase } from '../application/login.use-case';
import { RegisterUserUseCase } from '../application/register-user.use-case';
import {
  InvalidCredentialsError,
  UsernameTakenError,
  ValidationError,
} from '../domain/errors';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly login: LoginUseCase,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterRequest): Promise<AuthResponse> {
    this.assertCredentialsShape(body);
    try {
      await this.registerUser.execute(body.username, body.password);
      return await this.login.execute(body.username, body.password);
    } catch (err) {
      throw this.toHttp(err);
    }
  }

  @Post('login')
  @HttpCode(200)
  async doLogin(@Body() body: LoginRequest): Promise<AuthResponse> {
    this.assertCredentialsShape(body);
    try {
      return await this.login.execute(body.username, body.password);
    } catch (err) {
      throw this.toHttp(err);
    }
  }

  private assertCredentialsShape(body: unknown): asserts body is LoginRequest {
    const b = body as Record<string, unknown> | null;
    if (typeof b?.username !== 'string' || typeof b?.password !== 'string') {
      throw new BadRequestException('username and password are required');
    }
  }

  private toHttp(err: unknown): Error {
    if (err instanceof ValidationError) return new BadRequestException(err.message);
    if (err instanceof UsernameTakenError) return new ConflictException(err.message);
    if (err instanceof InvalidCredentialsError) return new UnauthorizedException(err.message);
    return err as Error;
  }
}
