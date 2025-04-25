import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto'; 
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { User } from '@prisma/client';

// Type for data expected from Clerk token/user fetch
interface ClerkAuthData {
  authProviderId: string; 
  email: string;
  name: string; 
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  
  // Inject PrismaService
  constructor(private prisma: PrismaService) {}

  /**
   * Finds a user by their Clerk Auth Provider ID.
   * If the user doesn't exist, it creates a new user record.
   * @param authData Data obtained from the verified Clerk token payload/user fetch
   * @returns The found or newly created User record from your database
   */
  async findOrCreateUser(authData: ClerkAuthData): Promise<User> {
    if (!authData?.authProviderId) {
      this.logger.error('findOrCreateUser called without authProviderId');
      throw new Error('Auth Provider ID is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { authProviderId: authData.authProviderId },
    });

    if (user) {
      this.logger.log(`Found existing user ${user.id} for authProviderId ${authData.authProviderId}`);
      return user;
    }

    // User not found, create a new one
    this.logger.log(`Creating new user for authProviderId: ${authData.authProviderId}`);
    try {
      const newUser = await this.prisma.user.create({
        data: {
          authProviderId: authData.authProviderId,
          email: authData.email,
          name: authData.name
        },
      });
      this.logger.log(`Created new user ${newUser.id}`);
      return newUser;
    } catch (error) {
      if (error.code === 'P2002') { // Prisma unique constraint error
         this.logger.error(`Unique constraint failed for ${authData.email} or ${authData.authProviderId}`);
         // Attempt to find user by email in case authProviderId somehow differs but email matches
         const userByEmail = await this.prisma.user.findUnique({ where: { email: authData.email } });
         if (userByEmail) {
            this.logger.warn(`User with email ${authData.email} already exists with different authProviderId.`);
            // Decide how to handle this - maybe update existing user's authProviderId? Or throw error?
            // Throwing error is safer initially.
             throw new ConflictException(`User with email ${authData.email} already exists.`);
         }
         throw new ConflictException('User creation failed due to unique constraint.');
      }
      this.logger.error(`Error creating user for authProviderId ${authData.authProviderId}:`, error);
      throw error; 
    }
  }

  // Service method for the temporary POST /users endpoint
  async create(createUserDto: CreateUserDto): Promise<User> {
     // Re-use findOrCreate logic or keep separate simple create? 
     // Keeping separate for clarity of the temporary endpoint's function.
     // Add similar duplicate checks as above if desired.
     this.logger.log(`Attempting to create user via temporary endpoint: ${createUserDto.email}`);
     return this.prisma.user.create({
       data: {
         email: createUserDto.email,
         authProviderId: createUserDto.authProviderId,
         name: createUserDto.name,
         schoolId: createUserDto.schoolId,
         oen: createUserDto.oen
       },
     });
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
        // Optional: throw NotFoundException or return null based on use case
        // throw new NotFoundException(`User with ID ${id} not found`);
        return null; 
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto): Promise<User> {
    this.logger.log(`Updating profile for user ID: ${userId}`);
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          oen: dto.oen,
          schoolId: dto.schoolId,
          // add other updatable fields here later if needed
        },
      });
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update profile for user ${userId}:`, error);
      if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${userId} not found for update.`);
      }
      throw error; // Re-throw other errors
    }
  }
  // Add other methods later (findAll, findOne, etc.)
}