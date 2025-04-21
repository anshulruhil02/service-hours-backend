import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Import PrismaService
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client'; // Import generated User type

@Injectable()
export class UsersService {
  // Inject PrismaService
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists (optional, but good practice)
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingByEmail) {
      throw new ConflictException('User with this email already exists');
    }
    const existingByAuthId = await this.prisma.user.findUnique({
      where: { authProviderId: createUserDto.authProviderId },
    });
    if (existingByAuthId) {
      throw new ConflictException('User with this authProviderId already exists');
    }

    // Create the user
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        authProviderId: createUserDto.authProviderId,
        name: createUserDto.name,
        role: createUserDto.role ?? 'student', // Default role if not provided
        schoolId: createUserDto.schoolId,
      },
    });
    return newUser;
  }

  // Add other methods later (findAll, findOne, etc.)
}