import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import CorsOrigin from './common/models/cors.config';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './filter/http.exception.filter';
import { TypeOrmExceptionFilter } from './filter/typeorm.exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);

  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const configuredOrigins = configService
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const allowedOrigins = new Set(
    configuredOrigins.map((origin) => {
      let parsedOrigin: URL;

      try {
        parsedOrigin = new URL(origin);
      } catch {
        throw new Error(`CORS_ORIGINS contiene un origen invalido: ${origin}`);
      }

      if (
        !['http:', 'https:'].includes(parsedOrigin.protocol) ||
        parsedOrigin.username ||
        parsedOrigin.password ||
        parsedOrigin.pathname !== '/' ||
        parsedOrigin.search ||
        parsedOrigin.hash ||
        (isProduction && parsedOrigin.protocol !== 'https:')
      ) {
        throw new Error(`CORS_ORIGINS contiene un origen no seguro: ${origin}`);
      }

      return parsedOrigin.origin;
    }),
  );

  const originChecker: CorsOrigin = (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin)) return callback(null, true);

    return callback(new Error('Origin not allowed by CORS'), false);
  };

  app.enableCors({
    origin: originChecker,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    exposedHeaders: ['Idempotent-Replayed'],
    credentials: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalFilters(new HttpExceptionFilter(), new TypeOrmExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
        exposeDefaultValues: true,
      },
    }),
  );

  app.setGlobalPrefix('api');

  if (configService.get<string>('NODE_ENV') === 'develop') {
    const config = new DocumentBuilder()
      .setTitle('nest-app-template')
      .setDescription('Documentación de la API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
}
void bootstrap();
