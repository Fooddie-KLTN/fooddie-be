import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
  // Define allowed origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fooddie-fe.onrender.com'
  ];

  // Add additional origins from environment variable if provided
  if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(',');
    allowedOrigins.push(...envOrigins);
  }

  const app: INestApplication = await NestFactory.create(
    AppModule, 
    new ExpressAdapter(),
    {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type', 
          'Authorization', 
          'Accept', 
          'Origin', 
          'X-Requested-With',
          'Access-Control-Allow-Headers',
          'Access-Control-Request-Method',
          'Access-Control-Request-Headers'
        ],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
      },
      logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'debug', 'error', 'verbose', 'warn'],
    }
  );

  // Optimized validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    })
  );

  // Only setup Swagger in development
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('FOODDIE API')
      .setDescription('The FOODDIE API description')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger documentation: http://localhost:${port}/api`);
    console.log('Allowed CORS origins:', allowedOrigins);
  }
}

bootstrap()
  .catch(error => {
    console.error('Error starting server:', error);
    process.exit(1);
  });