import { Controller, Post, Body, UseGuards, GoneException, Patch, Param, Req, UsePipes, ValidationPipe, InternalServerErrorException, Get } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from '../users/dto/create-submission.dto';
import { SaveSignatureDto } from '../users/dto/save-signature.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Your authentication guard
import { Request } from 'express'; // Use Request type declared in guard
import { Submission } from '@prisma/client';



@Controller('submissions') // Route prefix: /submissions
@UseGuards(JwtAuthGuard) // Protect ALL routes in this controller
export class SubmissionsController {
    constructor(private readonly submissionsService: SubmissionsService) {}

    @Get()
    async findAllForUser(@Req() req: Request): Promise<Submission[]> {
        if (!req.localUser?.id) {
            throw new InternalServerErrorException('Authenticated user not found on request.');
        }

        const userId = req.localUser.id;
        return this.submissionsService.findAllForUser(userId);
    }

    @Post()
    // Use global validation pipe (if configured in main.ts) OR apply specifically:
    // @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) 
    async create(
        @Req() req: Request, // Get the request object to access the authenticated user
        @Body() createSubmissionDto: CreateSubmissionDto // Get validated body data
    ): Promise<Submission> {
        // req.localUser is attached by JwtAuthGuard and contains the user's internal DB ID
        if (!req.localUser || !req.localUser.id) {
            // This case should technically not be reachable if JwtAuthGuard works correctly,
            // but it handles the optional type and guards against unexpected issues.
            throw new Error('Authenticated user not found on request.');
        }
        
        const userId = req.localUser.id; 
        return this.submissionsService.create(userId, createSubmissionDto);
    }

    /**
     * Generates a pre-signed URL for uploading a signature image to S3.
     * The frontend calls this BEFORE uploading the signature file.
     * ':id' refers to the ID of the submission record.
     */
    @Get(':id/supervisor-signature-upload-url') 
    async getSupervisorSignatureUploadUrl(
        @Req() req: Request,
        // Extract the 'id' parameter from the URL path
        @Param('id' /* maybe add a validation Pipe here? */) submissionId: string 
    ): Promise<{ uploadUrl: string; key: string }> { // Return type matches service
         if (!req.localUser?.id) { 
             throw new InternalServerErrorException('Authenticated user ID not found on request.'); 
         }
         const userId = req.localUser.id;
         // Service method handles verifying user ownership of the submission
         return this.submissionsService.getSupervisorSignatureUploadUrl(userId, submissionId);
    }

    @Patch(':id/supervisor-signature')
    // Apply validation pipe to ensure 'signatureKey' is present in the body
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })) 
    async saveSupervisorSignatureReference(
         @Req() req: Request,
         @Param('id' /* Add ID validation Pipe here if needed */) submissionId: string,
         // Validate the incoming request body against SaveSignatureDto
         @Body() body: SaveSignatureDto 
    ): Promise<Submission> { // Return the updated submission record
         if (!req.localUser?.id) { 
             throw new InternalServerErrorException('Authenticated user ID not found on request.'); 
         }
         const userId = req.localUser.id;
         // Service method handles verifying user ownership and updating the record
         return this.submissionsService.saveSupervisorSignatureReference(userId, submissionId, body.signatureKey);
    }

    @Get(':id/supervisor-signature') 
    async getSupervisorSignatureViewUrl(
        @Req() req: Request,
        @Param('id' /* Add ID validation Pipe */) submissionId: string 
    ): Promise<{ viewUrl: string | null }> { // Return type matches service
         if (!req.localUser?.id) { 
             throw new InternalServerErrorException('Auth user not found'); 
         }
         const userId = req.localUser.id;
         // Service method handles verifying ownership and checking if signature exists
         const result = await this.submissionsService.getSupervisorSignatureViewUrl(userId, submissionId);
         return result; 
    }

    
    @Get(':id/pre-approved-signature-upload-url') 
    async getPreApprovedSignatureUploadUrl(
        @Req() req: Request,
        // Extract the 'id' parameter from the URL path
        @Param('id' /* maybe add a validation Pipe here? */) submissionId: string 
    ): Promise<{ uploadUrl: string; key: string }> { // Return type matches service
         if (!req.localUser?.id) { 
             throw new InternalServerErrorException('Authenticated user ID not found on request.'); 
         }
         const userId = req.localUser.id;
         // Service method handles verifying user ownership of the submission
         return this.submissionsService.getPreApprovedignatureUploadUrl(userId, submissionId);
    }

    @Patch(':id/pre-approved-signature')
    // Apply validation pipe to ensure 'signatureKey' is present in the body
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })) 
    async savePreApprovedSignatureReference(
         @Req() req: Request,
         @Param('id' /* Add ID validation Pipe here if needed */) submissionId: string,
         // Validate the incoming request body against SaveSignatureDto
         @Body() body: SaveSignatureDto 
    ): Promise<Submission> { // Return the updated submission record
         if (!req.localUser?.id) { 
             throw new InternalServerErrorException('Authenticated user ID not found on request.'); 
         }
         const userId = req.localUser.id;
         // Service method handles verifying user ownership and updating the record
         return this.submissionsService.savePreApprovedSignatureReference(userId, submissionId, body.signatureKey);
    }

    @Get(':id/pre-approved-signature') 
    async getPreApprovedSignatureViewUrl(
        @Req() req: Request,
        @Param('id' /* Add ID validation Pipe */) submissionId: string 
    ): Promise<{ viewUrl: string | null }> { // Return type matches service
         if (!req.localUser?.id) { 
             throw new InternalServerErrorException('Auth user not found'); 
         }
         const userId = req.localUser.id;
         // Service method handles verifying ownership and checking if signature exists
         const result = await this.submissionsService.getPreApprovedSignatureViewUrl(userId, submissionId);
         return result; 
    }

}