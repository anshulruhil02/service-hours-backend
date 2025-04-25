import { Get, Module, Req, UseGuards, Patch, InternalServerErrorException } from '@nestjs/common';

import { Controller, Post, Body, ValidationPipe, UsePipes } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'; 
import { User } from '@prisma/client';
import { Request } from 'express'; // Need Request type from express
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Need your guard

@Controller('users') // Route prefix: /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

    @Get('me') // Handles GET requests to /users/me
    @UseGuards(JwtAuthGuard) // Apply the guard HERE - This makes the endpoint protected
    getProfile(@Req() req: Request): User {
      // The JwtAuthGuard verifies the token AND attaches our local user record
      // to req.localUser based on the findOrCreate logic.
      // We can now safely return this user record.

      // Optional safety check - this shouldn't happen if guard works correctly
      if (!req.localUser) {
          throw new Error('User not found on request after authentication passed. Guard issue?'); 
      }
      console.log(req.localUser)
      return req.localUser; 
    }
  // POST /users
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) 
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    // IMPORTANT: No @UseGuards(JwtAuthGuard) here for this temporary endpoint!
    return this.usersService.create(createUserDto);
  }

  @Patch('me') 
  @UseGuards(JwtAuthGuard) 
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) 
  async updateProfile(
    @Req() req: Request, 
    @Body() updateUserProfileDto: UpdateUserProfileDto 
  ): Promise<User> {
      // req.localUser is attached by JwtAuthGuard and contains the user's internal DB ID
      if (!req.localUser || !req.localUser.id) {
        // This case should technically not be reachable if JwtAuthGuard works correctly,
        // but it handles the optional type and guards against unexpected issues.
        throw new InternalServerErrorException('Authenticated user not found on request.');
    }
      const userId = req.localUser.id; 
      return this.usersService.updateProfile(userId, updateUserProfileDto);
  }

  // Add other endpoints later (GET /users/me, etc.)
}