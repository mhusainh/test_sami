-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowongan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "placement" VARCHAR(255) NOT NULL,
    "qualification" TEXT NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowongan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_stages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_terminal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "registration_code" VARCHAR(50) NOT NULL,
    "lowongan_id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "periode" VARCHAR(20) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "nik" VARCHAR(20) NOT NULL,
    "kk_number" VARCHAR(20) NOT NULL,
    "mother_name" VARCHAR(255) NOT NULL,
    "phone1" VARCHAR(30) NOT NULL,
    "phone2" VARCHAR(30),
    "birth_place" VARCHAR(255) NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" VARCHAR(20) NOT NULL,
    "info_source" VARCHAR(50) NOT NULL,
    "disability" VARCHAR(50) NOT NULL,
    "worked_yazaki" BOOLEAN NOT NULL DEFAULT false,
    "marital_status" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "religion" VARCHAR(50) NOT NULL,
    "education" VARCHAR(50) NOT NULL,
    "major" VARCHAR(255) NOT NULL,
    "school_name" VARCHAR(255) NOT NULL,
    "gpa" VARCHAR(50) NOT NULL,
    "province" VARCHAR(255) NOT NULL,
    "regency" VARCHAR(255) NOT NULL,
    "district" VARCHAR(255) NOT NULL,
    "village" VARCHAR(255) NOT NULL,
    "postal_code" VARCHAR(10) NOT NULL,
    "address" TEXT NOT NULL,
    "cv_url" TEXT,
    "cv_public_id" TEXT,
    "ijazah_url" TEXT,
    "ijazah_public_id" TEXT,
    "foto_url" TEXT,
    "foto_public_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengalaman_kerja" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "position" VARCHAR(255) NOT NULL,
    "year_range" VARCHAR(50),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengalaman_kerja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_scores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "from_stage_id" UUID,
    "to_stage_id" UUID NOT NULL,
    "changed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "lowongan_code_key" ON "lowongan"("code");

-- CreateIndex
CREATE INDEX "lowongan_is_active_sort_order_idx" ON "lowongan"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "application_stages_order_idx" ON "application_stages"("order");

-- CreateIndex
CREATE UNIQUE INDEX "applications_registration_code_key" ON "applications"("registration_code");

-- CreateIndex
CREATE INDEX "applications_lowongan_id_idx" ON "applications"("lowongan_id");

-- CreateIndex
CREATE INDEX "applications_stage_id_idx" ON "applications"("stage_id");

-- CreateIndex
CREATE INDEX "applications_created_at_idx" ON "applications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "pengalaman_kerja_application_id_idx" ON "pengalaman_kerja"("application_id");

-- CreateIndex
CREATE INDEX "application_scores_stage_id_idx" ON "application_scores"("stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_scores_application_id_stage_id_key" ON "application_scores"("application_id", "stage_id");

-- CreateIndex
CREATE INDEX "application_logs_application_id_idx" ON "application_logs"("application_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_lowongan_id_fkey" FOREIGN KEY ("lowongan_id") REFERENCES "lowongan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "application_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengalaman_kerja" ADD CONSTRAINT "pengalaman_kerja_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_scores" ADD CONSTRAINT "application_scores_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_scores" ADD CONSTRAINT "application_scores_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "application_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_scores" ADD CONSTRAINT "application_scores_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_logs" ADD CONSTRAINT "application_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_logs" ADD CONSTRAINT "application_logs_from_stage_id_fkey" FOREIGN KEY ("from_stage_id") REFERENCES "application_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_logs" ADD CONSTRAINT "application_logs_to_stage_id_fkey" FOREIGN KEY ("to_stage_id") REFERENCES "application_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_logs" ADD CONSTRAINT "application_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
