/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Added the required column `oen` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `schoolId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "oen" TEXT NOT NULL,
ALTER COLUMN "schoolId" SET NOT NULL;
