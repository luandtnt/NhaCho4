# API Documentation - Multi-Property Type System

**Version**: 1.0  
**Last Updated**: 2026-01-15

---

## Table of Contents

1. [Property Categories API](#property-categories-api)
2. [Amenities API](#amenities-api)
3. [Rentable Items API](#rentable-items-api)
4. [Pricing Calculator API](#pricing-calculator-api)

---

## Property Categories API

### Get All Property Categories

**Endpoint**: `GET /api/v1/property-categories`

**Description**: Retrieve all property categories, optionally filtered by duration type.

**Query Parameters**:
- `duration_type` (optional): Filter by duration type (`SHORT_TERM`, `MEDIUM_TERM`, `LONG_TERM`)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "HOMESTAY",
      "name": "Homestay",
      "name_vi": "Nhà dân",
      "duration_type": "SHORT_TERM",
      "icon": "🏠",
      "description": "Nhà dân hoặc căn hộ được thiết kế như nhà ở địa phương",
      "typical_pricing_unit": "PER_NIGHT",
      "typical_min_days": 1,
      "display_order": 1
    }
  ],
  "meta": {
    "total": 21
  }
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/v1/property-categories?duration_type=SHORT_TERM" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get Categories by Duration Type

**Endpoint**: `GET /api/v1/property-categories/by-duration`

**Description**: Get property categories grouped by duration type.

**Response**:
```json
{
  "SHORT_TERM": [
    {
      "id": "uuid",
      "code": "HOMESTAY",
      "name": "Homestay",
      "duration_type": "SHORT_TERM"
    }
  ],
  "MEDIUM_TERM": [...],
  "LONG_TERM": [...]
}
```

---

## Amenities API

### Get All Amenities

**Endpoint**: `GET /api/v1/amenities`

**Description**: Retrieve all amenities, optionally filtered by category.

**Query Parameters**:
- `category` (optional): Filter by category (`BASIC`, `KITCHEN`, `BATHROOM`, `ENTERTAINMENT`, `SAFETY`, `TRANSPORTATION`, `WORK`, `OTHER`)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "wifi",
      "name": "Wifi",
      "name_vi": "Wifi",
      "category": "BASIC",
      "icon": "📶",
      "description": "High-speed internet connection",
      "display_order": 1
    }
  ],
  "meta": {
    "total": 30
  }
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/v1/amenities?category=BASIC" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get Amenities by Category

**Endpoint**: `GET /api/v1/amenities/by-category`

**Description**: Get amenities grouped by category.

**Response**:
```json
{
  "BASIC": [
    {
      "id": "uuid",
      "code": "wifi",
      "name": "Wifi",
      "category": "BASIC"
    }
  ],
  "KITCHEN": [...],
  "BATHROOM": [...]
}
```

---

## Rentable Items API

### Create Rentable Item

**Endpoint**: `POST /api/v1/rentable-items`

**Description**: Create a new rentable item with property type information.

**Request Body**:
```json
{
  "code": "HOMESTAY-001",
  "space_node_id": "uuid",
  "allocation_type": "exclusive",
  "property_category": "HOMESTAY",
  "rental_duration_type": "SHORT_TERM",
  "min_rental_days": 1,
  "max_rental_days": 30,
  "pricing_unit": "PER_NIGHT",
  "area_sqm": 50.5,
  "bedrooms": 2,
  "bathrooms": 1,
  "floor_number": 3,
  "amenities": ["wifi", "ac", "kitchen"],
  "house_rules": ["no_smoking", "no_pets"],
  "instant_booking": true,
  "advance_booking_days": 1,
  "cancellation_policy": "FLEXIBLE"
}
```

**Response**:
```json
{
  "id": "uuid",
  "code": "HOMESTAY-001",
  "property_category": "HOMESTAY",
  "rental_duration_type": "SHORT_TERM",
  "amenities": ["wifi", "ac", "kitchen"],
  "status": "ACTIVE",
  "created_at": "2026-01-15T10:00:00Z"
}
```

**Example**:
```bash
curl -X POST "http://localhost:3000/api/v1/rentable-items" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "HOMESTAY-001",
    "space_node_id": "uuid",
    "allocation_type": "exclusive",
    "property_category": "HOMESTAY",
    "amenities": ["wifi", "ac"]
  }'
```

---

### Get Rentable Items with Filters

**Endpoint**: `GET /api/v1/rentable-items`

**Description**: Get rentable items with advanced filtering.

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 20)
- `property_category` (optional): Filter by property category
- `rental_duration_type` (optional): Filter by duration type
- `min_bedrooms` (optional): Minimum number of bedrooms
- `min_bathrooms` (optional): Minimum number of bathrooms
- `min_area` (optional): Minimum area in sqm
- `max_area` (optional): Maximum area in sqm
- `amenities` (optional): Comma-separated amenity codes
- `instant_booking` (optional): Filter by instant booking (true/false)
- `status` (optional): Filter by status
- `space_node_id` (optional): Filter by space node
- `asset_id` (optional): Filter by asset

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "HOMESTAY-001",
      "property_category": "HOMESTAY",
      "rental_duration_type": "SHORT_TERM",
      "bedrooms": 2,
      "bathrooms": 1,
      "area_sqm": 50.5,
      "amenities": ["wifi", "ac", "kitchen"],
      "instant_booking": true,
      "space_node": {
        "id": "uuid",
        "name": "Room 101",
        "asset": {
          "id": "uuid",
          "name": "Building A"
        }
      }
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/v1/rentable-items?property_category=HOMESTAY&min_bedrooms=2&amenities=wifi,ac&instant_booking=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Pricing Calculator API

### Calculate Price

**Endpoint**: `POST /api/v1/pricing/calculate`

**Description**: Calculate rental price based on duration and pricing policy.

**Request Body**:

**For Short-Term (per night)**:
```json
{
  "rentable_item_id": "uuid",
  "pricing_policy_id": "uuid",
  "start_date": "2026-01-20",
  "end_date": "2026-01-25",
  "guests": 2
}
```

**For Medium-Term (per month)**:
```json
{
  "rentable_item_id": "uuid",
  "pricing_policy_id": "uuid",
  "start_date": "2026-02-01",
  "months": 3
}
```

**For Long-Term (per year)**:
```json
{
  "rentable_item_id": "uuid",
  "pricing_policy_id": "uuid",
  "start_date": "2026-03-01",
  "years": 2
}
```

**Response (Short-Term)**:
```json
{
  "rentable_item": {
    "id": "uuid",
    "code": "HOMESTAY-001",
    "property_category": "HOMESTAY",
    "rental_duration_type": "SHORT_TERM"
  },
  "pricing_policy": {
    "id": "uuid",
    "name": "Giá homestay mùa cao điểm"
  },
  "calculation": {
    "base_price": 5000000,
    "cleaning_fee": 200000,
    "service_fee": 250000,
    "total_price": 5450000,
    "nights": 5,
    "breakdown": {
      "per_night_avg": 1000000,
      "discount_applied": 0
    }
  }
}
```

**Response (Medium-Term)**:
```json
{
  "calculation": {
    "monthly_price": 10000000,
    "total_months": 3,
    "total_price": 30000000,
    "deposit_amount": 20000000,
    "first_payment": 50000000,
    "breakdown": {
      "discount_applied": 0
    }
  }
}
```

**Response (Long-Term)**:
```json
{
  "calculation": {
    "base_monthly_price": 10000000,
    "total_years": 2,
    "yearly_prices": [120000000, 126000000],
    "total_price": 246000000,
    "deposit_amount": 30000000,
    "breakdown": {
      "annual_increase_percent": 5
    }
  }
}
```

**Example**:
```bash
curl -X POST "http://localhost:3000/api/v1/pricing/calculate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rentable_item_id": "uuid",
    "pricing_policy_id": "uuid",
    "start_date": "2026-01-20",
    "end_date": "2026-01-25"
  }'
```

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**400 Bad Request**:
```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid input data"
}
```

**404 Not Found**:
```json
{
  "error_code": "NOT_FOUND",
  "message": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Authentication

All API endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

To obtain an access token, use the login endpoint:

```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

## Rate Limiting

API requests are rate-limited to:
- 100 requests per minute per user
- 1000 requests per hour per organization

---

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api/docs
```

---

**For more information, contact the development team.**
