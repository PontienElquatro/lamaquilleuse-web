-- ================================================================
-- LaMaquilleuse — Migration initiale
-- Supabase → SQL Editor → New query → colle ce fichier → Run
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE "Role" AS ENUM ('ARTIST', 'CLIENT', 'ADMIN');
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');
CREATE TYPE "ServiceCategory" AS ENUM ('MARIAGE','SOIREE','SHOOTING','EDITORIAL','SFX','BEAUTE_QUOTIDIENNE','SCENE_SPECTACLE','AUTRE');
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE','INACTIVE','DRAFT');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING','CONFIRMED','PAID','IN_PROGRESS','COMPLETED','CANCELLED','REJECTED','EXPIRED');

-- User
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT,
  "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
  "providerId" TEXT,
  "role" "Role" NOT NULL DEFAULT 'CLIENT',
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT,
  "avatar" TEXT,
  "bio" TEXT,
  "city" TEXT,
  "specialties" TEXT[] DEFAULT '{}',
  "yearsOfExp" INTEGER,
  "instagramUrl" TEXT,
  "websiteUrl" TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "refreshToken" TEXT,
  "resetPasswordToken" TEXT,
  "resetPasswordExpiry" TIMESTAMPTZ,
  "emailVerifyToken" TEXT,
  "isEmailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_city_idx" ON "User"("city");

-- Service
CREATE TABLE "Service" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "ServiceCategory" NOT NULL,
  "status" "ServiceStatus" NOT NULL DEFAULT 'DRAFT',
  "duration" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "isHomeService" BOOLEAN NOT NULL DEFAULT FALSE,
  "travelFee" INTEGER,
  "maxBookingsPerDay" INTEGER NOT NULL DEFAULT 3,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "tags" TEXT[] DEFAULT '{}',
  "artistId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);
CREATE INDEX "Service_artistId_idx" ON "Service"("artistId");
CREATE INDEX "Service_category_idx" ON "Service"("category");
CREATE INDEX "Service_status_idx" ON "Service"("status");
CREATE INDEX "Service_slug_idx" ON "Service"("slug");

-- ServiceImage
CREATE TABLE "ServiceImage" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "url" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "serviceId" UUID NOT NULL REFERENCES "Service"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "ServiceImage_serviceId_idx" ON "ServiceImage"("serviceId");

-- Booking
CREATE TABLE "Booking" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "requestedDate" TIMESTAMPTZ NOT NULL,
  "requestedTime" TEXT NOT NULL,
  "location" TEXT,
  "notes" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "stripePaymentIntentId" TEXT,
  "clientId" UUID NOT NULL REFERENCES "User"("id"),
  "artistId" UUID NOT NULL REFERENCES "User"("id"),
  "serviceId" UUID NOT NULL REFERENCES "Service"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Booking_clientId_idx" ON "Booking"("clientId");
CREATE INDEX "Booking_artistId_idx" ON "Booking"("artistId");
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- Review
CREATE TABLE "Review" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "rating" INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "comment" TEXT,
  "reply" TEXT,
  "bookingId" UUID NOT NULL UNIQUE REFERENCES "Booking"("id"),
  "clientId" UUID NOT NULL REFERENCES "User"("id"),
  "artistId" UUID NOT NULL REFERENCES "User"("id"),
  "serviceId" UUID NOT NULL REFERENCES "Service"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);
CREATE INDEX "Review_artistId_idx" ON "Review"("artistId");
CREATE INDEX "Review_clientId_idx" ON "Review"("clientId");

-- Notification
CREATE TABLE "Notification" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- Auto-update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW."updatedAt" = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "User_updatedAt" BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER "Service_updatedAt" BEFORE UPDATE ON "Service" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER "Booking_updatedAt" BEFORE UPDATE ON "Booking" FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Bucket Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lamaquilleuse','lamaquilleuse',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'lamaquilleuse');
CREATE POLICY "Auth upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lamaquilleuse' AND auth.role() = 'authenticated');
CREATE POLICY "Owner delete" ON storage.objects FOR DELETE USING (bucket_id = 'lamaquilleuse');

-- Seed
INSERT INTO "User" ("email","firstName","lastName","role","provider","isEmailVerified","password")
VALUES ('admin@lamaquilleuse.fr','Admin','LaMaquilleuse','ADMIN','LOCAL',TRUE,'$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK6e');

INSERT INTO "User" ("email","firstName","lastName","role","provider","isEmailVerified","password","city","bio","specialties","yearsOfExp")
VALUES ('sophie@lamaquilleuse.fr','Sophie','Martin','ARTIST','LOCAL',TRUE,'$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK6e','Paris','Maquilleuse professionnelle depuis 8 ans.',ARRAY['MARIAGE','SHOOTING','SOIREE'],8);

INSERT INTO "User" ("email","firstName","lastName","role","provider","isEmailVerified","password")
VALUES ('emma@test.fr','Emma','Dubois','CLIENT','LOCAL',TRUE,'$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK6e');

INSERT INTO "Service" ("slug","title","description","category","status","duration","price","currency","isHomeService","travelFee","artistId")
SELECT 'maquillage-mariage-complet','Maquillage Mariée Complet','Maquillage longue tenue pour votre jour J.','MARIAGE','ACTIVE',120,25000,'EUR',TRUE,5000,id
FROM "User" WHERE email = 'sophie@lamaquilleuse.fr';

SELECT 'Migration LaMaquilleuse terminee' AS status;
