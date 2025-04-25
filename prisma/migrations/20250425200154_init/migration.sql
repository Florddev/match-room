/*
  Warnings:

  - The `status` column on the `bookings` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "BookingStatus";
