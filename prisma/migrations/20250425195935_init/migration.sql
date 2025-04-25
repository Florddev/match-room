-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stripeSessionId" TEXT;
