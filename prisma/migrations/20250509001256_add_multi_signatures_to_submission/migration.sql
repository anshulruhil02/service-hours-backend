/*
  Warnings:

  - You are about to drop the column `signatureUrl` on the `Submission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "signatureUrl",
ADD COLUMN     "preApprovedSignatureUrl" TEXT,
ADD COLUMN     "supervisorSignatureUrl" TEXT;
