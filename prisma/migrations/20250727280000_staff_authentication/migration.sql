-- Staff authentication: link staff records to auth users

ALTER TABLE "staff" ADD COLUMN "user_id" TEXT;

CREATE UNIQUE INDEX "staff_user_id_key" ON "staff"("user_id");

CREATE UNIQUE INDEX "staff_business_id_email_key" ON "staff"("business_id", "email");

ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
