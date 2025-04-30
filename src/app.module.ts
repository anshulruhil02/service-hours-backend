import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module'
import { UsersModule } from './users/users.module';
import { SubmissionsModule } from './submissions/submissions.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    SubmissionsModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
