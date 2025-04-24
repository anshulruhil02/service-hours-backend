import { 
    Injectable, 
    CanActivate, 
    ExecutionContext, 
    UnauthorizedException,
    Logger,
    InternalServerErrorException,
    ConflictException
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { Clerk } from '@clerk/clerk-sdk-node';
  import { UsersService } from '../users/users.service'; // Import UsersService
  import type { User } from '@prisma/client'; // Import Prisma User type
  import { Request } from 'express'; 

  // Extend Express Request interface to add our custom user property
  // Define this in a central types file (e.g., src/types/express.d.ts) eventually
  declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
      interface Request {
        localUser?: User; // Our user record from DB
        auth?: { // Structure based on Clerk's usual verified payload
            userId: string; // Clerk User ID (maps to authProviderId)
            sessionId: string;
            // ... other potential claims from Clerk token
        };
      }
    }
  }
  
  
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    private clerkClient;
    private readonly logger = new Logger(JwtAuthGuard.name);
  
    constructor(
      private configService: ConfigService,
      private usersService: UsersService, // Inject UsersService
    ) {
      const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
      if (!secretKey) {
        this.logger.error('CLERK_SECRET_KEY is not defined!');
        throw new Error('CLERK_SECRET_KEY is not defined in environment variables');
      }
      this.clerkClient = Clerk({ secretKey: secretKey });
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const authHeader = request.headers.authorization;
      try {
        const token = authHeader?.split(' ')[1]; // Extract token after 'Bearer '

      // --- ADD MORE LOGGING ---
      this.logger.debug(`Extracted Token String: [${token}]`); // Log extracted token
      // --- END LOGGING ---

      if (!token) {
          this.logger.warn('Authentication required: No token extracted from header.');
          throw new UnauthorizedException('Authentication required: No token provided.');
      }
        // Verify token using Clerk SDK - attaches 'auth' to request if valid
        // Use verifySessionToken for Bearer tokens or authenticateRequest for broader check
        const authObject = await this.clerkClient.verifyToken(
            request.headers.authorization?.split(' ')[1] // Extract token after 'Bearer '
        );
        
        // Re-attach standard structure if needed, or use authenticateRequest which does this
        // For simplicity with verifyToken, let's assume payload structure matches:
        request.auth = { userId: authObject.sub, sessionId: authObject.sid }; // Adjust based on actual payload
  
        if (!request.auth?.userId) { 
           this.logger.warn('Clerk token verified but no userId (sub) found in payload.');
           throw new UnauthorizedException('Authentication failed: User ID missing in token.');
        }
  
        // --- User Sync/Creation Logic ---
        // Fetch full user details from Clerk API using the verified userId
        const clerkUser = await this.clerkClient.users.getUser(request.auth.userId);
        const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unnamed User'; // Construct name
        const schooldId = clerkUser.unsafeMetadata.schoolId || '';
        const oen = clerkUser.unsafeMetadata.oen || '';

        if (!primaryEmail) {
          this.logger.warn(`Could not find primary email for Clerk user ${request.auth.userId}`);
          throw new UnauthorizedException('Authentication failed: User email missing from Clerk profile.');
        }
  
        // Find or create the user in the local database
        const localDbUser = await this.usersService.findOrCreateUser({
          authProviderId: request.auth.userId,
          email: primaryEmail,
          name: name
        });
  
        // Attach OUR local user record to the request
        request.localUser = localDbUser; 
        // --- End User Sync ---
  
        this.logger.log(`User ${localDbUser.id} (ClerkID: ${request.auth.userId}) authenticated successfully.`);
        return true; // Allow access
  
      } catch (error) {
        // Handle specific Clerk errors if needed, otherwise treat as unauthorized
        this.logger.error(`Clerk authentication/sync error: ${error.message || error}`);
        if (error.status === 401 || error.name === 'TokenVerificationError') {
            throw new UnauthorizedException('Authentication required: Invalid token.');
        }
      
        // Fallback for other errors
        throw new InternalServerErrorException('An authentication error occurred.');
      }
    }
  }