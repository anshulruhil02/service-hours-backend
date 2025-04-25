import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class UpdateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  oen: string;

  @IsString()
  @IsNotEmpty()
  schoolId: string;
}