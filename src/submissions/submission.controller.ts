import { Controller, Post, Body, UseGuards, Req, UsePipes, ValidationPipe, InternalServerErrorException, Get } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
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
}