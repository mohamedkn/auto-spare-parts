CREATE TYPE "InquiryStatus" AS ENUM ('under_review', 'open', 'bidding_closed', 'accepted', 'cancelled', 'expired');
CREATE TYPE "BidStatus" AS ENUM ('active', 'accepted', 'rejected', 'withdrawn', 'expired');

ALTER TABLE "products" ADD COLUMN "is_private" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "inquiries" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "category_id" UUID,
  "description" TEXT NOT NULL,
  "image_url" TEXT,
  "vin" VARCHAR(50),
  "ai_parsed_data" JSONB,
  "admin_notes" TEXT,
  "status" "InquiryStatus" NOT NULL DEFAULT 'under_review',
  "bidding_starts_at" TIMESTAMP(3),
  "bidding_ends_at" TIMESTAMP(3),
  "accepted_bid_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bids" (
  "id" UUID NOT NULL,
  "inquiry_id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "product_id" UUID,
  "price" DECIMAL(10,2) NOT NULL,
  "condition" "ProductCondition" NOT NULL,
  "notes" TEXT,
  "status" "BidStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bids_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bids_price_positive" CHECK ("price" > 0)
);

CREATE UNIQUE INDEX "inquiries_accepted_bid_id_key" ON "inquiries"("accepted_bid_id");
CREATE INDEX "inquiries_user_id_created_at_idx" ON "inquiries"("user_id", "created_at");
CREATE INDEX "inquiries_status_bidding_ends_at_idx" ON "inquiries"("status", "bidding_ends_at");
CREATE UNIQUE INDEX "bids_product_id_key" ON "bids"("product_id");
CREATE UNIQUE INDEX "bids_inquiry_id_vendor_id_key" ON "bids"("inquiry_id", "vendor_id");
CREATE INDEX "bids_inquiry_id_status_price_idx" ON "bids"("inquiry_id", "status", "price");
CREATE INDEX "bids_vendor_id_created_at_idx" ON "bids"("vendor_id", "created_at");

ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bids" ADD CONSTRAINT "bids_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bids" ADD CONSTRAINT "bids_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bids" ADD CONSTRAINT "bids_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_accepted_bid_id_fkey" FOREIGN KEY ("accepted_bid_id") REFERENCES "bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;
