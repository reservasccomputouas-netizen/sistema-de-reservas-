import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — permite Angular frontend
  app.enableCors({
    origin: ['http://localhost:4200', 'https://lustrous-wisp-52d362.netlify.app'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Prefijo global
  app.setGlobalPrefix('api/v1');

  // Validaciones con DTOs
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  // Respuesta uniforme
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Manejo de errores
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Sistema de Apartado — API')
    .setDescription('REST API para gestión de sala de cómputo')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
  console.log(`API: http://localhost:${process.env.PORT ?? 3000}/api/v1`);
  console.log(`Docs: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
