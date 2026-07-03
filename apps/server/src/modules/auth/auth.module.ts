import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from './application/login.use-case';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { TOKEN_SERVICE } from './domain/ports/token.service';
import { PASSWORD_HASHER } from './domain/ports/password-hasher';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { InMemoryUserRepository } from './infrastructure/in-memory-user.repository';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUseCase,
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [TOKEN_SERVICE],
})
export class AuthModule {}
