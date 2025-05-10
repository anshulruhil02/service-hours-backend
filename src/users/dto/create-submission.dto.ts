import { 
    IsString,
    IsEnum, 
    IsNotEmpty, 
    IsNumber, 
    IsPositive, 
    IsISO8601, // Use IsISO8601 for date strings from JSON
    IsOptional,
    MaxLength,
    IsUrl 
} from 'class-validator';


export class CreateSubmissionDto {
    @IsString()
    @IsOptional()
    @MaxLength(200) // Example max length
    orgName?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    hours?: number;

    @IsISO8601({ strict: true }) // Validate YYYY-MM-DDTHH:mm:ss.sssZ format
    @IsOptional()
    submissionDate?: string; // Receive as ISO 8601 string

    @IsEnum(['DRAFT', 'SUBMITTED'])
    @IsOptional()
    status?: 'DRAFT' | 'SUBMITTED';

    @IsString()
    @IsOptional()
    @MaxLength(1000) // Example max length
    description?: string;
}