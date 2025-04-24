import { IsEmail, IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  // You'll need to get this ID from your Clerk test user dashboard later
  // Or generate a unique placeholder for initial testing
  @IsString()
  @IsNotEmpty()
  authProviderId: string; 

  @IsString()
  @IsNotEmpty()
  name: string; // Keeping name mandatory as dcreate-user.dto.tsecided

  @IsOptional()
  @IsString()
  schoolId: string;

  @IsOptional()
  @IsString()
  oen: string;
}