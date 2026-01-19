/*
  Warnings:

  - The primary key for the `amenities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `booking_price_snapshots` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `voucher_code` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `voucher_discount` on the `bookings` table. All the data in the column will be lost.
  - The primary key for the `invoice_line_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `pricing_policies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `pricing_policy_versions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `property_categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `voucher_usages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vouchers` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `is_renewed` on table `agreements` required. This step will fail if there are existing NULL values in that column.
  - Made the column `applicable_to` on table `amenities` required. This step will fail if there are existing NULL values in that column.
  - Made the column `display_order` on table `amenities` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_walk_in` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `qty` on table `invoice_line_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metadata` on table `invoice_line_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `invoice_line_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `invoice_line_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `invoice_code` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subtotal_amount` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `balance_due` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tax_enabled` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tax_rate` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tax_amount` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `display_order` on table `property_categories` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metadata` on table `rentable_items` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "agreements" DROP CONSTRAINT "fk_agreements_renewal";

-- DropForeignKey
ALTER TABLE "agreements" DROP CONSTRAINT "fk_agreements_rentable_item";

-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_landlord_party_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_price_snapshots" DROP CONSTRAINT "booking_price_snapshots_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_price_snapshots" DROP CONSTRAINT "booking_price_snapshots_pricing_policy_fkey";

-- DropForeignKey
ALTER TABLE "invoice_line_items" DROP CONSTRAINT "fk_invoice_line_items_invoice";

-- DropForeignKey
ALTER TABLE "pricing_policies" DROP CONSTRAINT "pricing_policies_created_by_fkey";

-- DropForeignKey
ALTER TABLE "pricing_policies" DROP CONSTRAINT "pricing_policies_org_id_fkey";

-- DropForeignKey
ALTER TABLE "pricing_policies" DROP CONSTRAINT "pricing_policies_superseded_by_fkey";

-- DropForeignKey
ALTER TABLE "pricing_policy_versions" DROP CONSTRAINT "pricing_policy_versions_changed_by_fkey";

-- DropForeignKey
ALTER TABLE "pricing_policy_versions" DROP CONSTRAINT "pricing_policy_versions_policy_id_fkey";

-- DropForeignKey
ALTER TABLE "rentable_items" DROP CONSTRAINT "rentable_items_pricing_policy_fkey";

-- DropForeignKey
ALTER TABLE "space_nodes" DROP CONSTRAINT "space_nodes_landlord_party_id_fkey";

-- DropForeignKey
ALTER TABLE "voucher_usages" DROP CONSTRAINT "voucher_usages_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "voucher_usages" DROP CONSTRAINT "voucher_usages_voucher_id_fkey";

-- DropForeignKey
ALTER TABLE "vouchers" DROP CONSTRAINT "vouchers_org_id_fkey";

-- DropIndex
DROP INDEX "idx_agreements_state";

-- DropIndex
DROP INDEX "bookings_voucher_code_idx";

-- DropIndex
DROP INDEX "idx_invoices_state";

-- DropIndex
DROP INDEX "idx_rentable_items_amenities";

-- DropIndex
DROP INDEX "idx_rentable_items_amenities_gin";

-- DropIndex
DROP INDEX "idx_rentable_items_metadata_gin";

-- DropIndex
DROP INDEX "idx_rentable_items_pricing_unit";

-- AlterTable
ALTER TABLE "agreements" ALTER COLUMN "state" SET DEFAULT 'DRAFT',
ALTER COLUMN "sent_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "confirmed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "activated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "terminated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expired_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "is_renewed" SET NOT NULL,
ALTER COLUMN "pending_request_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "rejected_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "contract_code" SET DATA TYPE TEXT,
ALTER COLUMN "contract_title" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id_number" SET DATA TYPE TEXT,
ALTER COLUMN "handover_date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "amenities" DROP CONSTRAINT "amenities_pkey",
ALTER COLUMN "code" SET DATA TYPE TEXT,
ALTER COLUMN "name_vi" SET DATA TYPE TEXT,
ALTER COLUMN "name_en" SET DATA TYPE TEXT,
ALTER COLUMN "icon" SET DATA TYPE TEXT,
ALTER COLUMN "category" SET DATA TYPE TEXT,
ALTER COLUMN "applicable_to" SET NOT NULL,
ALTER COLUMN "display_order" SET NOT NULL,
ADD CONSTRAINT "amenities_pkey" PRIMARY KEY ("code");

-- AlterTable
ALTER TABLE "booking_price_snapshots" DROP CONSTRAINT "booking_price_snapshots_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "pricing_policy_id" SET DATA TYPE TEXT,
ALTER COLUMN "price_unit" SET DATA TYPE TEXT,
ALTER COLUMN "calculated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "calculated_by" SET DATA TYPE TEXT,
ADD CONSTRAINT "booking_price_snapshots_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "voucher_code",
DROP COLUMN "voucher_discount",
ALTER COLUMN "actual_start_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "actual_end_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "is_walk_in" SET NOT NULL;

-- AlterTable
ALTER TABLE "invoice_line_items" DROP CONSTRAINT "invoice_line_items_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "invoice_id" SET DATA TYPE TEXT,
ALTER COLUMN "type" SET DATA TYPE TEXT,
ALTER COLUMN "qty" SET NOT NULL,
ALTER COLUMN "metadata" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'ISSUED',
ALTER COLUMN "tenant_party_id" SET DATA TYPE TEXT,
ALTER COLUMN "rentable_item_id" SET DATA TYPE TEXT,
ALTER COLUMN "booking_id" SET DATA TYPE TEXT,
ALTER COLUMN "invoice_code" SET NOT NULL,
ALTER COLUMN "invoice_code" SET DATA TYPE TEXT,
ALTER COLUMN "issued_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "due_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "subtotal_amount" SET NOT NULL,
ALTER COLUMN "balance_due" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "state" SET DATA TYPE TEXT,
ALTER COLUMN "tax_enabled" SET NOT NULL,
ALTER COLUMN "tax_rate" SET NOT NULL,
ALTER COLUMN "tax_amount" SET NOT NULL;

-- AlterTable
ALTER TABLE "pricing_policies" DROP CONSTRAINT "pricing_policies_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DATA TYPE TEXT,
ALTER COLUMN "effective_from" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "effective_to" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "property_category" SET DATA TYPE TEXT,
ALTER COLUMN "rental_duration_type" SET DATA TYPE TEXT,
ALTER COLUMN "scope_province" SET DATA TYPE TEXT,
ALTER COLUMN "scope_district" SET DATA TYPE TEXT,
ALTER COLUMN "pricing_mode" SET DATA TYPE TEXT,
ALTER COLUMN "price_unit" SET DATA TYPE TEXT,
ALTER COLUMN "electricity_billing" SET DATA TYPE TEXT,
ALTER COLUMN "water_billing" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "superseded_by" SET DATA TYPE TEXT,
ADD CONSTRAINT "pricing_policies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "pricing_policy_versions" DROP CONSTRAINT "pricing_policy_versions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "policy_id" SET DATA TYPE TEXT,
ALTER COLUMN "changed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "change_type" SET DATA TYPE TEXT,
ADD CONSTRAINT "pricing_policy_versions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "property_categories" DROP CONSTRAINT "property_categories_pkey",
ALTER COLUMN "code" SET DATA TYPE TEXT,
ALTER COLUMN "name_vi" SET DATA TYPE TEXT,
ALTER COLUMN "name_en" SET DATA TYPE TEXT,
ALTER COLUMN "duration_type" SET DATA TYPE TEXT,
ALTER COLUMN "icon" SET DATA TYPE TEXT,
ALTER COLUMN "typical_pricing_unit" SET DATA TYPE TEXT,
ALTER COLUMN "display_order" SET NOT NULL,
ADD CONSTRAINT "property_categories_pkey" PRIMARY KEY ("code");

-- AlterTable
ALTER TABLE "rentable_items" ALTER COLUMN "property_category" SET DATA TYPE TEXT,
ALTER COLUMN "rental_duration_type" SET DATA TYPE TEXT,
ALTER COLUMN "pricing_unit" SET DATA TYPE TEXT,
ALTER COLUMN "cancellation_policy" SET DATA TYPE TEXT,
ALTER COLUMN "province" SET DATA TYPE TEXT,
ALTER COLUMN "district" SET DATA TYPE TEXT,
ALTER COLUMN "ward" SET DATA TYPE TEXT,
ALTER COLUMN "currency" SET DATA TYPE TEXT,
ALTER COLUMN "checkin_time" SET DATA TYPE TEXT,
ALTER COLUMN "checkout_time" SET DATA TYPE TEXT,
ALTER COLUMN "metadata" SET NOT NULL,
ALTER COLUMN "pricing_policy_id" SET DATA TYPE TEXT,
ALTER COLUMN "pricing_snapshot_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "phone" SET DATA TYPE TEXT,
ALTER COLUMN "emergency_contact" SET DATA TYPE TEXT,
ALTER COLUMN "id_number" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "voucher_usages";

-- DropTable
DROP TABLE "vouchers";

-- CreateIndex
CREATE INDEX "invoices_org_id_state_idx" ON "invoices"("org_id", "state");

-- CreateIndex
CREATE INDEX "rentable_items_base_price_idx" ON "rentable_items"("base_price");

-- CreateIndex
CREATE INDEX "rentable_items_bedrooms_idx" ON "rentable_items"("bedrooms");

-- CreateIndex
CREATE INDEX "rentable_items_furnishing_level_idx" ON "rentable_items"("furnishing_level");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_landlord_party_id_fkey" FOREIGN KEY ("landlord_party_id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_nodes" ADD CONSTRAINT "space_nodes_landlord_party_id_fkey" FOREIGN KEY ("landlord_party_id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentable_items" ADD CONSTRAINT "rentable_items_pricing_policy_id_fkey" FOREIGN KEY ("pricing_policy_id") REFERENCES "pricing_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_policies" ADD CONSTRAINT "pricing_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_policies" ADD CONSTRAINT "pricing_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_policies" ADD CONSTRAINT "pricing_policies_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "pricing_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_policy_versions" ADD CONSTRAINT "pricing_policy_versions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "pricing_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_policy_versions" ADD CONSTRAINT "pricing_policy_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_price_snapshots" ADD CONSTRAINT "booking_price_snapshots_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_price_snapshots" ADD CONSTRAINT "booking_price_snapshots_pricing_policy_id_fkey" FOREIGN KEY ("pricing_policy_id") REFERENCES "pricing_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_rentable_item_id_fkey" FOREIGN KEY ("rentable_item_id") REFERENCES "rentable_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_renewal_of_agreement_id_fkey" FOREIGN KEY ("renewal_of_agreement_id") REFERENCES "agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_party_id_fkey" FOREIGN KEY ("tenant_party_id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_rentable_item_id_fkey" FOREIGN KEY ("rentable_item_id") REFERENCES "rentable_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_agreements_contract_code" RENAME TO "agreements_contract_code_idx";

-- RenameIndex
ALTER INDEX "idx_agreements_dates" RENAME TO "agreements_start_at_end_at_idx";

-- RenameIndex
ALTER INDEX "idx_agreements_landlord" RENAME TO "agreements_landlord_party_id_idx";

-- RenameIndex
ALTER INDEX "idx_agreements_rentable_item" RENAME TO "agreements_rentable_item_id_idx";

-- RenameIndex
ALTER INDEX "idx_agreements_tenant" RENAME TO "agreements_tenant_party_id_idx";

-- RenameIndex
ALTER INDEX "idx_amenities_category" RENAME TO "amenities_category_idx";

-- RenameIndex
ALTER INDEX "idx_booking_price_snapshots_booking_id" RENAME TO "booking_price_snapshots_booking_id_idx";

-- RenameIndex
ALTER INDEX "idx_booking_price_snapshots_policy" RENAME TO "booking_price_snapshots_pricing_policy_id_pricing_policy_ve_idx";

-- RenameIndex
ALTER INDEX "idx_bookings_actual_end_at" RENAME TO "bookings_actual_end_at_idx";

-- RenameIndex
ALTER INDEX "idx_bookings_actual_start_at" RENAME TO "bookings_actual_start_at_idx";

-- RenameIndex
ALTER INDEX "idx_bookings_is_walk_in" RENAME TO "bookings_is_walk_in_idx";

-- RenameIndex
ALTER INDEX "idx_bookings_status_start_at" RENAME TO "bookings_status_start_at_idx";

-- RenameIndex
ALTER INDEX "idx_invoice_line_items_invoice" RENAME TO "invoice_line_items_invoice_id_idx";

-- RenameIndex
ALTER INDEX "idx_invoice_line_items_type" RENAME TO "invoice_line_items_type_idx";

-- RenameIndex
ALTER INDEX "idx_invoices_booking" RENAME TO "invoices_booking_id_idx";

-- RenameIndex
ALTER INDEX "idx_invoices_due_at" RENAME TO "invoices_due_at_idx";

-- RenameIndex
ALTER INDEX "idx_invoices_invoice_code" RENAME TO "invoices_invoice_code_idx";

-- RenameIndex
ALTER INDEX "idx_invoices_invoice_code_unique" RENAME TO "invoices_invoice_code_key";

-- RenameIndex
ALTER INDEX "idx_invoices_rentable_item" RENAME TO "invoices_rentable_item_id_idx";

-- RenameIndex
ALTER INDEX "idx_invoices_tenant_party" RENAME TO "invoices_tenant_party_id_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policies_effective_dates" RENAME TO "pricing_policies_effective_from_effective_to_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policies_org_id" RENAME TO "pricing_policies_org_id_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policies_property_category" RENAME TO "pricing_policies_property_category_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policies_rental_duration_type" RENAME TO "pricing_policies_rental_duration_type_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policies_scope" RENAME TO "pricing_policies_scope_province_scope_district_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policies_status" RENAME TO "pricing_policies_status_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policies_superseded_by" RENAME TO "pricing_policies_superseded_by_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policies_version" RENAME TO "pricing_policies_version_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policy_versions_changed_at" RENAME TO "pricing_policy_versions_changed_at_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policy_versions_policy_id" RENAME TO "pricing_policy_versions_policy_id_idx";

-- RenameIndex
ALTER INDEX "idx_pricing_policy_versions_version" RENAME TO "pricing_policy_versions_policy_id_version_idx";

-- RenameIndex
ALTER INDEX "pricing_policy_versions_unique_version" RENAME TO "pricing_policy_versions_policy_id_version_key";

-- RenameIndex
ALTER INDEX "idx_property_categories_duration" RENAME TO "property_categories_duration_type_idx";

-- RenameIndex
ALTER INDEX "idx_rentable_items_category" RENAME TO "rentable_items_property_category_idx";

-- RenameIndex
ALTER INDEX "idx_rentable_items_district" RENAME TO "rentable_items_district_idx";

-- RenameIndex
ALTER INDEX "idx_rentable_items_duration" RENAME TO "rentable_items_rental_duration_type_idx";

-- RenameIndex
ALTER INDEX "idx_rentable_items_pricing_policy" RENAME TO "rentable_items_pricing_policy_id_pricing_policy_version_idx";

-- RenameIndex
ALTER INDEX "idx_rentable_items_province" RENAME TO "rentable_items_province_idx";

-- RenameIndex
ALTER INDEX "idx_rentable_items_search" RENAME TO "rentable_items_property_category_rental_duration_type_statu_idx";

-- RenameIndex
ALTER INDEX "idx_rentable_items_ward" RENAME TO "rentable_items_ward_idx";
