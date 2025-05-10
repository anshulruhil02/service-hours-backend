-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "orgName" DROP NOT NULL,
ALTER COLUMN "hours" DROP NOT NULL,
ALTER COLUMN "submissionDate" DROP NOT NULL;
