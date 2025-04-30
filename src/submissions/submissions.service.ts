import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { Submission } from '@prisma/client';

@Injectable()
export class SubmissionsService {
    private readonly logger = new Logger(SubmissionsService.name)
    constructor(private prisma: PrismaService) {}

    async create(userId: string, createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
        try {
            const newSubmission = await this.prisma.submission.create({
                data: {
                    orgName: createSubmissionDto.orgName,
                    hours: createSubmissionDto.hours,
                    // Convert ISO string date from DTO to JavaScript Date object for Prisma
                    submissionDate: new Date(createSubmissionDto.submissionDate), 
                    description: createSubmissionDto.description,
                    // proofUrl: createSubmissionDto.proofUrl, // Add later with file uploads
                    student: {
                        // Connect the submission to the user using their internal ID
                        connect: { id: userId } 
                    }
                }
            });

            return newSubmission
        } catch(error) {
            throw error
        }
    }
}