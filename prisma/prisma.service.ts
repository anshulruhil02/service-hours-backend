// Service that manages the Prisma Client lifecycle
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService 
  extends PrismaClient // Inherit all Prisma Client methods (findUnique, create, etc.)
  implements OnModuleInit, OnModuleDestroy { // Implement lifecycle hooks

  constructor() {
    super({
      // Optionally configure Prisma Client logging here
      // log: ['query', 'info', 'warn', 'error'],
    });
    console.log('PrismaService Initialized');
  }

  // Automatically connect Prisma Client when the module initializes
  async onModuleInit() {
    console.log('Connecting Prisma Client...');
    await this.$connect();
    console.log('Prisma Client Connected.');
  }

  // Automatically disconnect Prisma Client when the application shuts down
  async onModuleDestroy() {
    console.log('Disconnecting Prisma Client...');
    await this.$disconnect();
    console.log('Prisma Client Disconnected.');
  }
}
