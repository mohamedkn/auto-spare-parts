CREATE TYPE "VehicleMarket" AS ENUM ('german', 'korean', 'japanese', 'american', 'chinese', 'european', 'other');

ALTER TABLE "vendors" ADD COLUMN "specialties" "VehicleMarket"[] NOT NULL DEFAULT ARRAY[]::"VehicleMarket"[];
ALTER TABLE "vehicle_makes" ADD COLUMN "market" "VehicleMarket" NOT NULL DEFAULT 'other';
ALTER TABLE "inquiries" ADD COLUMN "vehicle_markets" "VehicleMarket"[] NOT NULL DEFAULT ARRAY[]::"VehicleMarket"[];

UPDATE "vehicle_makes" SET "market" = 'german' WHERE lower("name") IN ('bmw', 'mercedes', 'mercedes-benz', 'audi', 'volkswagen', 'vw', 'opel', 'porsche', 'mini', 'seat', 'skoda');
UPDATE "vehicle_makes" SET "market" = 'korean' WHERE lower("name") IN ('hyundai', 'kia', 'daewoo', 'ssangyong', 'genesis');
UPDATE "vehicle_makes" SET "market" = 'japanese' WHERE lower("name") IN ('toyota', 'nissan', 'honda', 'mazda', 'mitsubishi', 'suzuki', 'subaru', 'lexus', 'infiniti', 'isuzu', 'daihatsu');
UPDATE "vehicle_makes" SET "market" = 'american' WHERE lower("name") IN ('ford', 'chevrolet', 'jeep', 'chrysler', 'dodge', 'gmc', 'cadillac', 'tesla');
UPDATE "vehicle_makes" SET "market" = 'chinese' WHERE lower("name") IN ('chery', 'byd', 'geely', 'mg', 'jac', 'baic', 'bestune', 'jetour', 'haval', 'dongfeng', 'chang-an', 'changan');
UPDATE "vehicle_makes" SET "market" = 'european' WHERE lower("name") IN ('renault', 'peugeot', 'citroen', 'fiat', 'alfa romeo', 'volvo', 'land rover', 'jaguar');

CREATE INDEX "vendors_specialties_idx" ON "vendors" USING GIN ("specialties");
CREATE INDEX "vehicle_makes_market_idx" ON "vehicle_makes"("market");
CREATE INDEX "inquiries_vehicle_markets_idx" ON "inquiries" USING GIN ("vehicle_markets");
