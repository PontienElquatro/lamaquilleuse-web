// src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe }         from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule }              from './app.module';
import { TransformInterceptor }   from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter }  from './common/filters/global-exception.filter';
import { JwtAuthGuard }           from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // ─── Préfixe global ──────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── CORS ────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') ?? '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ─── Validation globale ───────────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({
    whitelist:            true,
    forbidNonWhitelisted: true,
    transform:            true,
    transformOptions:     { enableImplicitConversion: true },
  }));

  // ─── Interceptors & Filters ───────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ─── JWT Guard global (sauf routes @Public()) ─────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // ─── Swagger (dev seulement) ──────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('LaMaquilleuse API')
      .setDescription('API Backend — Plateforme SaaS pour maquilleuses professionnelles')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth',    'Authentification et gestion des sessions')
      .addTag('users',   'Profils utilisateurs et marketplace')
      .addTag('services', 'Gestion des prestations')
      .addTag('bookings', 'Système de réservation')
      .addTag('payments', 'Paiements Stripe')
      .addTag('agenda',   'Calendrier et disponibilités')
      .addTag('messages', 'Messagerie temps réel')
      .addTag('social',   'Réseau social et publications')
      .addTag('reviews',  'Avis et évaluations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    console.log(`📚 Swagger: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 LaMaquilleuse API démarrée sur http://localhost:${port}/api/v1`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap();
