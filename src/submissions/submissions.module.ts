import { Module } from '@nestjs/common';
import { SubmissionsController } from './submission.controller';
import { SubmissionsService } from './submissions.service';
import { UsersService } from 'src/users/users.service';
// PrismaModule and AuthModule are likely global, no need to import if so

@Module({
  // imports: [], // Only if PrismaModule/AuthModule aren't global
  controllers: [SubmissionsController],
  providers: [SubmissionsService, UsersService],
  exports : [UsersService, SubmissionsService]
})
export class SubmissionsModule {}
