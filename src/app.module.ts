import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module'
import { UsersModule } from './users/users.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule, // <--- Add PrismaModule here
    // ... other modules like SubmissionsModule, UsersModule will go here later
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
