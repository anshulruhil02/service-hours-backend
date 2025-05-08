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
    @Get(':id/signature-upload-url') 
    async getSignatureUploadUrl(
        @Req() req: Request,
        // Extract the 'id' parameter from the URL path
        @Param('id' /* maybe add a validation Pipe here? */) submissionId: string 
    ): Promise<{ uploadUrl: string; key: string }> { // Return type matches service
         if (!req.localUser?.id) { 
             throw new InternalServerErrorException('Authenticated user ID not found on request.'); 
         }
         const userId = req.localUser.id;
         // Service method handles verifying user ownership of the submission
         return this.submissionsService.getSignatureUploadUrl(userId, submissionId);
    }

     // --- NEW: PATCH /submissions/:id/signature ---
    /**
     * Saves the reference (S3 key) of the uploaded signature 
     * to the submission record after the frontend uploads the file to S3.
     * ':id' refers to the ID of the submission record.
     */
    @Patch(':id/signature')
    // Apply validation pipe to ensure 'signatureKey' is present in the body
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })) 
    async saveSignatureReference(
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
         return this.submissionsService.saveSignatureReference(userId, submissionId, body.signatureKey);
    }
}