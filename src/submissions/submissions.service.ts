import { Inject, Injectable, Logger, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionDto } from '../users/dto/create-submission.dto';
import { Submission } from '@prisma/client';
import { ConfigService } from '@nestjs/config'; 
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; 
import { randomUUID } from 'crypto';

@Injectable()
export class SubmissionsService {
    private readonly logger = new Logger(SubmissionsService.name)
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly awsRegion: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService
    ) {
        // Initialize S3 Client 
        this.awsRegion = this.configService.getOrThrow<string>('AWS_REGION');
        this.s3Client = new S3Client({ 
            region: this.awsRegion,
         });
        this.bucketName = this.configService.getOrThrow<string>('S3_SIGNATURE_BUCKET_NAME');
        this.logger.log(`S3 Client Initialized for region ${this.awsRegion} and bucket ${this.bucketName}`);
    }

    async findAllForUser(userId: string): Promise<Submission[]> {
        try {
            const submissions = await this.prisma.submission.findMany({
                where: {
                    student: {
                        id: userId
                    }
                },
                orderBy: {
                    submissionDate: 'desc'
                }
            })
            return submissions
        } catch(error) {
            this.logger.error(`Failed to find submissions for user ${userId}:`, error); 
            throw error
        }
    }
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
            this.logger.error(`Failed to create submission for user ${userId}:`, error);    
            throw error
        }
    }

    async getSignatureUploadUrl(userId: string, submissionId: string): Promise<{ uploadUrl: string; key: string }> {
        this.logger.log(`Generating signature upload URL for submission ${submissionId} by user ${userId}`);
        
        // Verify the user owns the submission (important security check!)
        const submission = await this.prisma.submission.findUnique({
            where: { id: submissionId },
        });
        if (!submission) {
            throw new NotFoundException(`Submission with ID ${submissionId} not found.`);
        }
        if (submission.studentId !== userId) {
             this.logger.warn(`User ${userId} attempted to get upload URL for submission ${submissionId} they don't own.`);
            throw new ForbiddenException(`User does not own submission ${submissionId}.`); 
        }

        // Generate a unique key for the S3 object
        // Structure: signatures/<userId>/<submissionId>/<randomUUID>.png
        const key = `signatures/${userId}/${submissionId}/${randomUUID()}.png`; 

        // Create the command for PutObject
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: 'image/png', // Set expected content type
        });

        try {
            // Generate the pre-signed URL (valid for 5 minutes)
            const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 }); 
            this.logger.log(`Generated pre-signed URL for key: ${key}`);
            // Return both the URL the client needs to PUT to, and the key to save later
            return { uploadUrl, key }; 
        } catch (error) {
            this.logger.error(`Failed to generate pre-signed URL for ${key}:`, error.stack);
            throw new InternalServerErrorException('Could not prepare signature upload.');
        }
    }

    async saveSignatureReference(userId: string, submissionId: string, signatureKey: string): Promise<Submission> {
        this.logger.log(`Saving signature reference for submission ${submissionId} by user ${userId}. Key: ${signatureKey}`);

       // Verify the user owns the submission again (defense in depth)
       const submission = await this.prisma.submission.findFirst({ // Use findFirst or findUniqueOrThrow
           where: { 
               id: submissionId,
               studentId: userId // Ensure user owns it
           },
       });
       if (!submission) {
            this.logger.warn(`Submission ${submissionId} not found or not owned by user ${userId} during save reference.`);
           throw new NotFoundException(`Submission with ID ${submissionId} not found for this user.`);
       }
      
       // Construct the full S3 URL (or just store the key)
       // Storing the key is often more flexible
       const signatureUrl = `https://${this.bucketName}.s3.${this.awsRegion}.amazonaws.com/${signatureKey}`;
       // const signatureUrl = signatureKey; // Alternative: Store just the key

       try {
           const updatedSubmission = await this.prisma.submission.update({
               where: { id: submissionId } ,
               data: {
                   signatureUrl: signatureUrl, // Save the URL (or key)
               },
           });
           this.logger.log(`Successfully saved signature reference for submission ${submissionId}`);
           return updatedSubmission;
       } catch (error) {
            this.logger.error(`Failed to save signature reference for submission ${submissionId}:`, error.stack);
            // Prisma throws P2025 if record to update is not found based on `where`
            if (error.code === 'P2025') { 
                 throw new NotFoundException(`Submission with ID ${submissionId} not found for update.`);
            }
            throw new InternalServerErrorException('Could not save signature reference.');
       }
   }
}