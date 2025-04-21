import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Assuming you'll use this soon
import { ConfigService } from '@nestjs/config'; // To get port from env

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000); 

  // Apply global validation pipe (good practice)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties not in DTO
    transform: true, // Automatically transform payloads to DTO instances
  }));

  // Enable CORS if needed for your frontend (adjust origin later)
  app.enableCors(); 

  // Enable shutdown hooks to ensure OnModuleDestroy is called
  app.enableShutdownHooks(); // <--- Add this line

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();