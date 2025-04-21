import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Make PrismaService available globally without importing PrismaModule everywhere
@Module({
  providers: [PrismaService], // Create an instance of PrismaService
  exports: [PrismaService],   // Export PrismaService so other modules can inject it
})
export class PrismaModule {}