import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { PrismaClient } from '@prisma/client';

import { AppModule } from './app.module';

 


async function bootstrap() {
  // Run migrations in production
  if (process.env['NODE_ENV'] === 'production') {
    const { execSync } = await import('child_process');

    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
      });
      console.log('Migrations complete');
    } catch (e) {
      console.error('Migration failed:', e);
    }
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Enable trust proxy to use x-forwarded-* headers
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: [
      process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Autonomous DevOps Engineer API')
      .setDescription('AI-powered infrastructure generation platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();

  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();


void bootstrap();