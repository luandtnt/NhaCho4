-- Migration: Add Multi-Property Type Support
-- Date: 2026-01-15
-- Description: Add columns for property categorization, amenities, and booking settings

-- Step 1: Add new columns to rentable_items (all nullable or with defaults for backward compatibility)
ALTER TABLE "rentable_items" 
  ADD COLUMN "property_category" VARCHAR(50),
  ADD COLUMN "rental_duration_type" VARCHAR(20),
  ADD COLUMN "min_rental_days" INTEGER DEFAULT 1,
  ADD COLUMN "max_rental_days" INTEGER,
  ADD COLUMN "pricing_unit" VARCHAR(20) DEFAULT 'PER_MONTH',
  ADD COLUMN "area_sqm" DECIMAL(10,2),
  ADD COLUMN "bedrooms" INTEGER,
  ADD COLUMN "bathrooms" INTEGER,
  ADD COLUMN "floor_number" INTEGER,
  ADD COLUMN "amenities" JSONB DEFAULT '[]',
  ADD COLUMN "house_rules" JSONB DEFAULT '[]',
  ADD COLUMN "instant_booking" BOOLEAN DEFAULT false,
  ADD COLUMN "advance_booking_days" INTEGER DEFAULT 1,
  ADD COLUMN "cancellation_policy" VARCHAR(20) DEFAULT 'MODERATE';

-- Step 2: Create indexes for better query performance
CREATE INDEX "idx_rentable_items_category" ON "rentable_items"("property_category");
CREATE INDEX "idx_rentable_items_duration" ON "rentable_items"("rental_duration_type");
CREATE INDEX "idx_rentable_items_amenities" ON "rentable_items" USING GIN("amenities");
CREATE INDEX "idx_rentable_items_pricing_unit" ON "rentable_items"("pricing_unit");

-- Step 3: Migrate existing data (set defaults for old records)
UPDATE "rentable_items" 
SET 
  "property_category" = 'APARTMENT',
  "rental_duration_type" = 'MEDIUM_TERM',
  "pricing_unit" = 'PER_MONTH',
  "min_rental_days" = 30,
  "amenities" = '[]',
  "house_rules" = '[]'
WHERE "property_category" IS NULL;

-- Step 4: Create property_categories reference table
CREATE TABLE "property_categories" (
  "code" VARCHAR(50) PRIMARY KEY,
  "name_vi" VARCHAR(100) NOT NULL,
  "name_en" VARCHAR(100) NOT NULL,
  "duration_type" VARCHAR(20) NOT NULL,
  "icon" VARCHAR(50),
  "description" TEXT,
  "typical_pricing_unit" VARCHAR(20),
  "typical_min_days" INTEGER,
  "display_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 5: Create amenities reference table
CREATE TABLE "amenities" (
  "code" VARCHAR(50) PRIMARY KEY,
  "name_vi" VARCHAR(100) NOT NULL,
  "name_en" VARCHAR(100) NOT NULL,
  "icon" VARCHAR(50),
  "category" VARCHAR(50),
  "applicable_to" JSONB DEFAULT '[]',
  "display_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 6: Seed property categories
INSERT INTO "property_categories" ("code", "name_vi", "name_en", "duration_type", "icon", "description", "typical_pricing_unit", "typical_min_days", "display_order") VALUES
-- Short-term
('HOMESTAY', 'Homestay', 'Homestay', 'SHORT_TERM', '🏠', 'Nhà dân cho thuê ngắn hạn với trải nghiệm địa phương', 'PER_NIGHT', 1, 1),
('GUESTHOUSE', 'Nhà nghỉ', 'Guesthouse', 'SHORT_TERM', '🏘️', 'Phòng đơn giản với tiện nghi cơ bản', 'PER_NIGHT', 1, 2),
('HOTEL', 'Khách sạn', 'Hotel', 'SHORT_TERM', '🏨', 'Khách sạn chuyên nghiệp với dịch vụ đầy đủ', 'PER_NIGHT', 1, 3),
('SERVICED_APARTMENT_SHORT', 'Căn hộ dịch vụ ngắn hạn', 'Serviced Apartment (Short)', 'SHORT_TERM', '🏢', 'Căn hộ đầy đủ tiện nghi cho thuê ngắn hạn', 'PER_NIGHT', 3, 4),
('VILLA_RESORT', 'Villa nghỉ dưỡng', 'Villa Resort', 'SHORT_TERM', '🏖️', 'Biệt thự cao cấp với hồ bơi, sân vườn', 'PER_NIGHT', 2, 5),
('AIRBNB_ROOM', 'Phòng Airbnb', 'Airbnb Room', 'SHORT_TERM', '🛏️', 'Phòng riêng trong nhà dân', 'PER_NIGHT', 1, 6),
('COLIVING_SHORT', 'Co-living ngắn hạn', 'Co-living (Short)', 'SHORT_TERM', '👥', 'Không gian chia sẻ cho digital nomad', 'PER_NIGHT', 1, 7),
-- Medium-term
('PRIVATE_HOUSE', 'Nhà riêng', 'Private House', 'MEDIUM_TERM', '🏡', 'Nhà độc lập hoặc liền kề', 'PER_MONTH', 30, 8),
('ROOM_RENTAL', 'Phòng trọ', 'Room Rental', 'MEDIUM_TERM', '🛏️', 'Phòng trọ cho sinh viên, công nhân', 'PER_MONTH', 30, 9),
('APARTMENT', 'Chung cư', 'Apartment', 'MEDIUM_TERM', '🏢', 'Căn hộ chung cư với tiện ích', 'PER_MONTH', 30, 10),
('SERVICED_APARTMENT_MEDIUM', 'Căn hộ dịch vụ trung hạn', 'Serviced Apartment (Medium)', 'MEDIUM_TERM', '🏢', 'Căn hộ dịch vụ cho expat, công tác', 'PER_MONTH', 30, 11),
('WHOLE_HOUSE', 'Nhà nguyên căn', 'Whole House', 'MEDIUM_TERM', '🏠', 'Toàn bộ nhà cho thuê', 'PER_MONTH', 30, 12),
('RETAIL_SPACE_SMALL', 'Mặt bằng nhỏ', 'Small Retail Space', 'MEDIUM_TERM', '🏪', 'Mặt bằng kinh doanh nhỏ', 'PER_MONTH', 30, 13),
('WAREHOUSE_TEMP', 'Kho tạm', 'Temporary Warehouse', 'MEDIUM_TERM', '📦', 'Kho lưu trữ tạm thời', 'PER_MONTH', 30, 14),
-- Long-term
('OFFICE', 'Văn phòng', 'Office', 'LONG_TERM', '🏢', 'Văn phòng làm việc chuyên nghiệp', 'PER_SQM_MONTH', 365, 15),
('LAND', 'Đất nền', 'Land', 'LONG_TERM', '🌾', 'Đất trống cho đầu tư hoặc nông nghiệp', 'PER_MONTH', 365, 16),
('WAREHOUSE', 'Nhà xưởng', 'Warehouse', 'LONG_TERM', '🏭', 'Nhà xưởng sản xuất, kho bãi lớn', 'PER_SQM_MONTH', 365, 17),
('COMMERCIAL_SPACE', 'Mặt bằng thương mại', 'Commercial Space', 'LONG_TERM', '🏬', 'Mặt bằng lớn cho siêu thị, trung tâm thương mại', 'PER_MONTH', 365, 18),
('LUXURY_APARTMENT', 'Chung cư cao cấp', 'Luxury Apartment', 'LONG_TERM', '🏙️', 'Căn hộ cao cấp với tiện ích đầy đủ', 'PER_MONTH', 180, 19),
('VILLA', 'Biệt thự', 'Villa', 'LONG_TERM', '🏰', 'Biệt thự cao cấp với đất rộng', 'PER_MONTH', 365, 20),
('SHOPHOUSE', 'Nhà phố kinh doanh', 'Shophouse', 'LONG_TERM', '🏪', 'Nhà mặt phố kết hợp ở và kinh doanh', 'PER_MONTH', 365, 21);

-- Step 7: Seed amenities
INSERT INTO "amenities" ("code", "name_vi", "name_en", "icon", "category", "applicable_to", "display_order") VALUES
-- Basic amenities
('wifi', 'Wifi', 'Wifi', '📶', 'BASIC', '["HOMESTAY","HOTEL","APARTMENT","OFFICE","ROOM_RENTAL"]', 1),
('ac', 'Điều hòa', 'Air Conditioning', '❄️', 'BASIC', '["HOMESTAY","HOTEL","APARTMENT","OFFICE","ROOM_RENTAL"]', 2),
('heating', 'Sưởi ấm', 'Heating', '🔥', 'BASIC', '["HOMESTAY","HOTEL","APARTMENT"]', 3),
('tv', 'TV', 'Television', '📺', 'BASIC', '["HOMESTAY","HOTEL","APARTMENT","ROOM_RENTAL"]', 4),
('washing_machine', 'Máy giặt', 'Washing Machine', '🧺', 'BASIC', '["HOMESTAY","APARTMENT","WHOLE_HOUSE"]', 5),
-- Kitchen
('kitchen', 'Bếp', 'Kitchen', '🍳', 'KITCHEN', '["HOMESTAY","APARTMENT","WHOLE_HOUSE"]', 6),
('refrigerator', 'Tủ lạnh', 'Refrigerator', '🧊', 'KITCHEN', '["HOMESTAY","APARTMENT","WHOLE_HOUSE"]', 7),
('microwave', 'Lò vi sóng', 'Microwave', '📻', 'KITCHEN', '["HOMESTAY","APARTMENT"]', 8),
('cooking_utensils', 'Dụng cụ nấu ăn', 'Cooking Utensils', '🍴', 'KITCHEN', '["HOMESTAY","APARTMENT"]', 9),
-- Bathroom
('water_heater', 'Nước nóng', 'Water Heater', '🚿', 'BATHROOM', '["HOMESTAY","HOTEL","APARTMENT","ROOM_RENTAL"]', 10),
('bathtub', 'Bồn tắm', 'Bathtub', '🛁', 'BATHROOM', '["HOTEL","LUXURY_APARTMENT","VILLA"]', 11),
('private_bathroom', 'Phòng tắm riêng', 'Private Bathroom', '🚽', 'BATHROOM', '["HOMESTAY","HOTEL","APARTMENT","ROOM_RENTAL"]', 12),
-- Entertainment
('pool', 'Hồ bơi', 'Swimming Pool', '🏊', 'ENTERTAINMENT', '["HOTEL","VILLA_RESORT","LUXURY_APARTMENT","VILLA"]', 13),
('gym', 'Phòng gym', 'Gym', '💪', 'ENTERTAINMENT', '["HOTEL","APARTMENT","LUXURY_APARTMENT"]', 14),
('garden', 'Sân vườn', 'Garden', '🌳', 'ENTERTAINMENT', '["VILLA_RESORT","PRIVATE_HOUSE","VILLA"]', 15),
('balcony', 'Ban công', 'Balcony', '🪴', 'ENTERTAINMENT', '["APARTMENT","HOMESTAY"]', 16),
('bbq', 'Khu BBQ', 'BBQ Area', '🍖', 'ENTERTAINMENT', '["VILLA_RESORT","PRIVATE_HOUSE","VILLA"]', 17),
-- Safety & Security
('security', 'Bảo vệ 24/7', 'Security 24/7', '🔒', 'SAFETY', '["APARTMENT","OFFICE","WAREHOUSE","LUXURY_APARTMENT"]', 18),
('cctv', 'Camera an ninh', 'CCTV', '📹', 'SAFETY', '["APARTMENT","OFFICE","WAREHOUSE"]', 19),
('fire_alarm', 'Báo cháy', 'Fire Alarm', '🚨', 'SAFETY', '["HOTEL","APARTMENT","OFFICE"]', 20),
('first_aid', 'Hộp sơ cứu', 'First Aid Kit', '🩹', 'SAFETY', '["HOTEL","HOMESTAY"]', 21),
-- Transportation
('parking', 'Bãi đỗ xe', 'Parking', '🅿️', 'TRANSPORTATION', '["HOTEL","APARTMENT","OFFICE","WAREHOUSE"]', 22),
('elevator', 'Thang máy', 'Elevator', '🛗', 'TRANSPORTATION', '["APARTMENT","OFFICE","HOTEL"]', 23),
('bike_parking', 'Chỗ để xe đạp', 'Bike Parking', '🚲', 'TRANSPORTATION', '["APARTMENT","OFFICE"]', 24),
-- Work
('desk', 'Bàn làm việc', 'Desk', '🪑', 'WORK', '["HOMESTAY","APARTMENT","OFFICE"]', 25),
('meeting_room', 'Phòng họp', 'Meeting Room', '👔', 'WORK', '["OFFICE","COWORKING"]', 26),
('printer', 'Máy in', 'Printer', '🖨️', 'WORK', '["OFFICE"]', 27),
('high_speed_internet', 'Internet tốc độ cao', 'High-speed Internet', '⚡', 'WORK', '["OFFICE","APARTMENT"]', 28),
-- Pet-friendly
('pet_friendly', 'Cho phép thú cưng', 'Pet Friendly', '🐕', 'PET', '["HOMESTAY","APARTMENT","PRIVATE_HOUSE"]', 29),
-- Accessibility
('wheelchair_accessible', 'Tiếp cận xe lăn', 'Wheelchair Accessible', '♿', 'ACCESSIBILITY', '["HOTEL","APARTMENT","OFFICE"]', 30);

-- Step 8: Create indexes for reference tables
CREATE INDEX "idx_property_categories_duration" ON "property_categories"("duration_type");
CREATE INDEX "idx_amenities_category" ON "amenities"("category");

-- Migration complete
