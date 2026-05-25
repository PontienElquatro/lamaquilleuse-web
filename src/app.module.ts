// src/app.module.ts
import { Module }             from '@nestjs/common';
import { ConfigModule }       from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD }          from '@nestjs/core';
import { PrismaModule }       from './prisma/prisma.module';
import { AuthModule }         from './auth/auth.module';
import { UsersModule }        from './users/users.module';
import { MailModule }         from './mail/mail.module';

@Module({
  imports: [
    // Config globale
    ConfigModule.forRoot({
      isGlobal:  true,
      envFilePath: '.env',
    }),

    // Rate limiting global
    ThrottlerModule.forRoot([{
      ttl:   60_000,
      limit: 100,
    }]),

    // Infrastructure
    PrismaModule,
    MailModule,

    // Modules métier
    AuthModule,
    UsersModule,

    // TODO: à ajouter au fur et à mesure
    // ServicesModule,
    // BookingsModule,
    // AgendaModule,
    // PaymentsModule,
    // MessagesModule,
    // SocialModule,
    // ReviewsModule,
  ],
  providers: [
    // Rate limiting appliqué globalement
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
