# Agreement Module Enhancement Migration

## Mục Đích
Nâng cấp module Agreement để quản lý hợp đồng thuê hoàn chỉnh.

## Thay Đổi

### 1. Thêm Link Đến Rentable Item
- `rentable_item_id` - Link đến BĐS được thuê

### 2. Thêm Pricing Fields
- `base_price` - Giá thuê cơ bản (tháng/quý/năm)
- `deposit_amount` - Tiền cọc
- `service_fee` - Phí dịch vụ
- `building_mgmt_fee` - Phí quản lý tòa nhà

### 3. Thêm Utilities Billing
- `electricity_billing` - Cách tính tiền điện
- `water_billing` - Cách tính tiền nước

### 4. Thêm Price Increase Terms
- `price_increase_percent` - % tăng giá
- `price_increase_frequency` - Tần suất tăng (YEARLY)

### 5. Thêm Status Tracking
- `sent_at` - Thời điểm gửi cho tenant
- `confirmed_at` - Thời điểm tenant xác nhận
- `activated_at` - Thời điểm kích hoạt
- `terminated_at` - Thời điểm chấm dứt
- `expired_at` - Thời điểm hết hạn
- `rejected_at` - Thời điểm từ chối

### 6. Thêm Termination Info
- `termination_reason` - Lý do chấm dứt
- `termination_type` - Loại (EARLY, NATURAL, CANCELLED)
- `termination_penalty` - Phí phạt
- `deposit_refund_amount` - Số tiền hoàn cọc
- `rejection_reason` - Lý do từ chối

### 7. Thêm Renewal Tracking
- `renewal_of_agreement_id` - Link đến hợp đồng cũ
- `is_renewed` - Đã gia hạn chưa

### 8. Thêm Tenant Request Fields
- `pending_request_type` - Loại yêu cầu (RENEW, TERMINATE)
- `pending_request_data` - Dữ liệu yêu cầu
- `pending_request_at` - Thời điểm yêu cầu

### 9. Thêm Snapshots
- `snapshot_terms` - Snapshot điều khoản khi activate
- `snapshot_pricing` - Snapshot giá khi activate

### 10. Thêm Notes
- `landlord_notes` - Ghi chú của chủ nhà
- `tenant_notes` - Ghi chú của người thuê

## State Machine

```
DRAFT → SENT → PENDING_CONFIRM → ACTIVE → EXPIRED
                                    ↓
                                TERMINATED
                                    ↓
                                CANCELLED
```

## Cách Chạy

### Option 1: Dùng Script (Khuyến Nghị)
```powershell
.\run-agreement-migration.ps1
```

### Option 2: Thủ Công
```powershell
cd apps/backend
Get-Content prisma/migrations/20260117_enhance_agreements/migration.sql | psql $env:DATABASE_URL
npx prisma generate
```

## Rollback

Nếu cần rollback:
```powershell
cd apps/backend
Get-Content prisma/migrations/20260117_enhance_agreements/rollback.sql | psql $env:DATABASE_URL
npx prisma generate
```

## Kiểm Tra

Sau khi chạy migration, kiểm tra:
```sql
\d agreements
```

Bạn sẽ thấy tất cả các column mới đã được thêm vào.

## Next Steps

1. ✅ Chạy migration
2. ⏳ Implement Agreement Service
3. ⏳ Implement Agreement Controller
4. ⏳ Implement Frontend Pages

