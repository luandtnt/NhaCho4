-- Get sample data for testing booking APIs

-- 1. Get a short-term rentable item (Homestay, Hotel, etc.)
SELECT 
    ri.id as rentable_item_id,
    ri.code,
    ri.property_category,
    ri.base_price,
    ri.price_unit,
    ri.instant_booking,
    ri.max_occupancy,
    ri.checkin_time,
    ri.checkout_time,
    ri.metadata
FROM rentable_item ri
WHERE ri.property_category IN ('HOMESTAY', 'HOTEL', 'GUESTHOUSE', 'VILLA_RESORT', 'SERVICED_APARTMENT_SHORT')
AND ri.status = 'AVAILABLE'
LIMIT 1;

-- 2. Get listing for this rentable item
SELECT 
    l.id as listing_id,
    l.title,
    l.org_id,
    lri.rentable_item_id
FROM listing l
JOIN listing_rentable_item lri ON l.id = lri.listing_id
WHERE l.status = 'PUBLISHED'
AND lri.rentable_item_id IN (
    SELECT id FROM rentable_item 
    WHERE property_category IN ('HOMESTAY', 'HOTEL', 'GUESTHOUSE')
    LIMIT 1
)
LIMIT 1;

-- 3. Get existing bookings for this item (to test conflicts)
SELECT 
    b.id,
    b.rentable_item_id,
    b.start_at,
    b.end_at,
    b.status,
    b.quantity
FROM booking b
WHERE b.rentable_item_id IN (
    SELECT id FROM rentable_item 
    WHERE property_category IN ('HOMESTAY', 'HOTEL', 'GUESTHOUSE')
    LIMIT 1
)
AND b.status IN ('PENDING', 'CONFIRMED')
ORDER BY b.start_at DESC
LIMIT 5;

-- 4. Get user info for authentication
SELECT 
    u.id as user_id,
    u.email,
    u.org_id
FROM "user" u
WHERE u.role = 'Tenant'
LIMIT 1;
