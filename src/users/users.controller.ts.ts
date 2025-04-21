import { Module } from '@nestjs/common';

import { Controller, Post, Body, ValidationPipe, UsePipes } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';

@Controller('users') // Route prefix: /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /users
  @Post()
  // Apply validation pipe specifically here if not global, 
  // or rely on global pipe if set up in main.ts
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) 
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    // IMPORTANT: No @UseGuards(JwtAuthGuard) here for this temporary endpoint!
    return this.usersService.create(createUserDto);
  }

  // Add other endpoints later (GET /users/me, etc.)
}