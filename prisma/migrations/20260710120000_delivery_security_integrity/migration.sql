-- Bring the migration history in sync with the delivery models in schema.prisma.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'driver';
ALTER TYPE "SubOrderStatus" ADD VALUE IF NOT EXISTS 'preparing';

CREATE TYPE "DeliveryJobStatus" AS ENUM (
  'pending', 'broadcasted', 'accepted', 'picked_up', 'on_the_way',
  'delivered', 'cancelled', 'expired', 'failed_delivery', 'returned_to_vendor'
);
CREATE TYPE "WalletOwnerType" AS ENUM ('driver', 'vendor', 'platform');
CREATE TYPE "WalletTransactionType" AS ENUM ('credit', 'debit', 'cod_collected', 'cod_settled');

ALTER TABLE "users" ADD COLUMN "expo_push_token" VARCHAR(100);
ALTER TABLE "vendors" ADD COLUMN "address" TEXT;
ALTER TABLE "vendors" ADD COLUMN "latitude" DECIMAL(10,8);
ALTER TABLE "vendors" ADD COLUMN "longitude" DECIMAL(11,8);

CREATE TABLE "delivery_drivers" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "vehicle_type" VARCHAR(50) NOT NULL,
  "max_weight_capacity_kg" DECIMAL(6,2),
  "status" VARCHAR(20) NOT NULL DEFAULT 'offline',
  "current_lat" DECIMAL(10,8),
  "current_lng" DECIMAL(11,8),
  "wallet_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "cash_on_hand_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "cash_limit" DECIMAL(10,2) NOT NULL DEFAULT 1000,
  "rating" DECIMAL(3,2),
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "delivery_drivers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_jobs" (
  "id" UUID NOT NULL,
  "sub_order_id" UUID NOT NULL,
  "driver_id" UUID,
  "status" "DeliveryJobStatus" NOT NULL DEFAULT 'pending',
  "delivery_fee" DECIMAL(10,2) NOT NULL,
  "driver_earning" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "platform_commission_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "is_cod" BOOLEAN NOT NULL DEFAULT false,
  "cod_amount_to_collect" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "distance_km" DECIMAL(6,2),
  "pickup_address" TEXT NOT NULL,
  "dropoff_address" TEXT NOT NULL,
  "pickup_lat" DECIMAL(10,8),
  "pickup_lng" DECIMAL(11,8),
  "dropoff_lat" DECIMAL(10,8),
  "dropoff_lng" DECIMAL(11,8),
  "pickup_otp" VARCHAR(10),
  "delivery_otp" VARCHAR(10),
  "assignment_attempt" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 0,
  "cancellation_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "picked_up_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  CONSTRAINT "delivery_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_transactions" (
  "id" UUID NOT NULL,
  "wallet_owner_type" "WalletOwnerType" NOT NULL,
  "wallet_owner_id" UUID NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "balance_after" DECIMAL(10,2) NOT NULL,
  "related_delivery_job_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_ratings" (
  "id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "delivery_job_id" UUID NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "delivery_ratings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "type" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_drivers_user_id_key" ON "delivery_drivers"("user_id");
CREATE INDEX "delivery_drivers_status_idx" ON "delivery_drivers"("status");
CREATE UNIQUE INDEX "delivery_jobs_sub_order_id_key" ON "delivery_jobs"("sub_order_id");
CREATE INDEX "delivery_jobs_status_idx" ON "delivery_jobs"("status");
CREATE INDEX "delivery_jobs_driver_id_idx" ON "delivery_jobs"("driver_id");
CREATE UNIQUE INDEX "delivery_jobs_one_active_per_driver_idx"
  ON "delivery_jobs"("driver_id")
  WHERE "driver_id" IS NOT NULL AND "status" IN ('accepted', 'picked_up', 'on_the_way');
CREATE INDEX "wallet_transactions_wallet_owner_id_wallet_owner_type_idx" ON "wallet_transactions"("wallet_owner_id", "wallet_owner_type");
CREATE INDEX "delivery_ratings_driver_id_idx" ON "delivery_ratings"("driver_id");
CREATE UNIQUE INDEX "delivery_ratings_delivery_job_id_key" ON "delivery_ratings"("delivery_job_id");
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

ALTER TABLE "delivery_drivers" ADD CONSTRAINT "delivery_drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_jobs" ADD CONSTRAINT "delivery_jobs_sub_order_id_fkey" FOREIGN KEY ("sub_order_id") REFERENCES "sub_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_jobs" ADD CONSTRAINT "delivery_jobs_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "delivery_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_related_delivery_job_id_fkey" FOREIGN KEY ("related_delivery_job_id") REFERENCES "delivery_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "delivery_ratings" ADD CONSTRAINT "delivery_ratings_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "delivery_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_ratings" ADD CONSTRAINT "delivery_ratings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_ratings" ADD CONSTRAINT "delivery_ratings_delivery_job_id_fkey" FOREIGN KEY ("delivery_job_id") REFERENCES "delivery_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Database-level invariants that Prisma cannot express in the schema.
ALTER TABLE "products" ADD CONSTRAINT "chk_products_price" CHECK ("price" > 0);
ALTER TABLE "products" ADD CONSTRAINT "chk_products_stock" CHECK ("stock_quantity" >= 0);
ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variants_stock" CHECK ("stock_quantity" >= 0);
ALTER TABLE "cart_items" ADD CONSTRAINT "chk_cart_items_quantity" CHECK ("quantity" > 0);
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_total" CHECK ("total_amount" >= 0);
ALTER TABLE "sub_orders" ADD CONSTRAINT "chk_sub_orders_amounts" CHECK ("subtotal" >= 0 AND "commission_amount" >= 0 AND "vendor_payout_amount" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "chk_order_items_values" CHECK ("quantity" > 0 AND "unit_price" >= 0 AND "total_price" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "chk_payments_amount" CHECK ("amount" > 0);
ALTER TABLE "reviews" ADD CONSTRAINT "chk_reviews_rating" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "delivery_ratings" ADD CONSTRAINT "chk_delivery_ratings_rating" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "delivery_jobs" ADD CONSTRAINT "chk_delivery_jobs_amounts" CHECK ("delivery_fee" >= 0 AND "driver_earning" >= 0 AND "platform_commission_amount" >= 0 AND "cod_amount_to_collect" >= 0);
ALTER TABLE "delivery_drivers" ADD CONSTRAINT "chk_delivery_driver_balances" CHECK ("wallet_balance" >= 0 AND "cash_on_hand_balance" >= 0 AND "cash_limit" >= 0);
