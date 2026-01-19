# Quản lý Trạng thái Chính sách Giá

## Tổng quan

Hệ thống quản lý chính sách giá với 3 trạng thái và các chuyển đổi trạng thái linh hoạt.

## Các trạng thái

### 1. DRAFT (Nháp)
- Chính sách mới tạo mặc định ở trạng thái này
- Có thể chỉnh sửa tự do
- Chưa áp dụng cho hợp đồng/tin đăng nào
- **Màu**: Xám

### 2. ACTIVE (Đang hoạt động)
- Chính sách đang được áp dụng
- Chỉ có 1 chính sách ACTIVE cùng loại tại một thời điểm
- Khi kích hoạt chính sách mới, các chính sách ACTIVE cũ sẽ tự động chuyển sang ARCHIVED
- **Màu**: Xanh lá

### 3. ARCHIVED (Đã lưu trữ)
- Chính sách không còn sử dụng
- Vẫn giữ lại để tham khảo lịch sử
- Không thể áp dụng cho hợp đồng mới
- **Màu**: Vàng

## Sơ đồ chuyển đổi trạng thái

```
DRAFT ──────────────> ACTIVE ──────────────> DRAFT
  │                      │                      
  │                      │                      
  └──────> ARCHIVED <────┘                      
  │                      │
  │                      │
  └────> [XÓA] <─────────┘
```

**Lưu ý**: Chỉ có thể xóa chính sách ở trạng thái DRAFT hoặc ARCHIVED. Không thể xóa chính sách ACTIVE.

## Các chức năng

### 1. Kích hoạt (DRAFT → ACTIVE)
**Nút**: ✓ Kích hoạt (màu xanh lá)

**Điều kiện**: Chính sách đang ở trạng thái DRAFT

**Hành động**:
- Chuyển chính sách sang ACTIVE
- Tự động chuyển các chính sách ACTIVE khác sang ARCHIVED
- Chính sách có thể được áp dụng cho hợp đồng/tin đăng mới

**API**: `POST /api/v1/pricing-policies/:id/activate`

### 2. Vô hiệu hóa (ACTIVE → DRAFT)
**Nút**: ⏸ Vô hiệu hóa (màu vàng)

**Điều kiện**: Chính sách đang ở trạng thái ACTIVE

**Hành động**:
- Chuyển chính sách về DRAFT
- Chính sách không còn được áp dụng cho hợp đồng mới
- Có thể chỉnh sửa và kích hoạt lại sau

**API**: `POST /api/v1/pricing-policies/:id/deactivate`

**Validation**:
- Chỉ chính sách ACTIVE mới có thể vô hiệu hóa
- Backend trả về lỗi nếu trạng thái không hợp lệ

### 3. Lưu trữ (DRAFT/ACTIVE → ARCHIVED)
**Nút**: 📦 Lưu trữ (màu cam)

**Điều kiện**: Chính sách đang ở trạng thái DRAFT hoặc ACTIVE

**Hành động**:
- Chuyển chính sách sang ARCHIVED
- Chính sách không thể sử dụng cho hợp đồng mới
- Giữ lại để tham khảo lịch sử

**API**: `POST /api/v1/pricing-policies/:id/archive`

**Lưu ý**: 
- Nên kiểm tra xem chính sách có đang được sử dụng không trước khi lưu trữ
- Trong production, cần validate dependencies

### 4. Chỉnh sửa
**Nút**: ✏️ Sửa (màu xanh dương)

**Điều kiện**: Có thể chỉnh sửa ở mọi trạng thái

**Hành động**:
- Mở modal chỉnh sửa
- Cập nhật thông tin chính sách
- Không thay đổi trạng thái

**API**: `PUT /api/v1/pricing-policies/:id`

### 5. Xóa vĩnh viễn
**Nút**: 🗑️ Xóa vĩnh viễn (màu đỏ)

**Điều kiện**: Chỉ chính sách DRAFT hoặc ARCHIVED

**Hành động**:
- Xóa hoàn toàn chính sách khỏi hệ thống
- **KHÔNG THỂ HOÀN TÁC**
- Hiển thị cảnh báo nghiêm trọng trước khi xóa

**API**: `DELETE /api/v1/pricing-policies/:id`

**Validation**:
- Frontend: Kiểm tra trạng thái, hiển thị alert nếu là ACTIVE
- Backend: Throw error nếu chính sách đang ACTIVE
- Backend: Kiểm tra dependencies (TODO trong production)

**Message cảnh báo**:
```
⚠️ XÓA VĨNH VIỄN chính sách giá này?

Hành động này KHÔNG THỂ HOÀN TÁC!

Bạn có chắc chắn muốn tiếp tục?
```

## UI/UX

### Card chính sách - Trạng thái DRAFT
```
┌─────────────────────────────────┐
│ Thuê theo tháng        [DRAFT]  │
│ Version 1                       │
│                                 │
│ Giá: 5,000,000 ₫               │
│ Đơn vị: Tháng                  │
│                                 │
│ [✓ Kích hoạt]                  │
│ [✏️ Sửa] [📦 Lưu trữ]          │
│ [🗑️ Xóa vĩnh viễn]             │
└─────────────────────────────────┘
```

### Card chính sách - Trạng thái ACTIVE
```
┌─────────────────────────────────┐
│ Thuê theo tháng       [ACTIVE]  │
│ Version 1                       │
│                                 │
│ Giá: 5,000,000 ₫               │
│ Đơn vị: Tháng                  │
│                                 │
│ [⏸ Vô hiệu hóa]                │
│ [✏️ Sửa] [📦 Lưu trữ]          │
│ (Không có nút xóa)              │
└─────────────────────────────────┘
```

### Card chính sách - Trạng thái ARCHIVED
```
┌─────────────────────────────────┐
│ Thuê theo tháng     [ARCHIVED]  │
│ Version 1                       │
│                                 │
│ Giá: 5,000,000 ₫               │
│ Đơn vị: Tháng                  │
│                                 │
│ [✏️ Sửa]                        │
│ [🗑️ Xóa vĩnh viễn]             │
└─────────────────────────────────┘
```

## Luồng sử dụng thực tế

### Kịch bản 1: Tạo và kích hoạt chính sách mới
1. Tạo chính sách mới → Trạng thái: DRAFT
2. Kiểm tra thông tin
3. Click "✓ Kích hoạt" → Trạng thái: ACTIVE
4. Chính sách sẵn sàng áp dụng

### Kịch bản 2: Tạm dừng chính sách
1. Chính sách đang ACTIVE
2. Click "⏸ Vô hiệu hóa" → Trạng thái: DRAFT
3. Chỉnh sửa nếu cần
4. Kích hoạt lại khi sẵn sàng

### Kịch bản 3: Cập nhật chính sách với versioning
1. Chính sách cũ đang ACTIVE
2. Tạo chính sách mới (version 2) → Trạng thái: DRAFT
3. Click "✓ Kích hoạt" chính sách mới
4. Chính sách cũ tự động chuyển sang ARCHIVED
5. Hợp đồng cũ vẫn giữ version cũ, hợp đồng mới dùng version mới

### Kịch bản 4: Lưu trữ chính sách không dùng
1. Chính sách không còn cần thiết
2. Click "📦 Lưu trữ" → Trạng thái: ARCHIVED
3. Chính sách được giữ lại để tham khảo

### Kịch bản 5: Xóa chính sách không cần thiết
1. Chính sách ở trạng thái DRAFT hoặc ARCHIVED
2. Chắc chắn không cần giữ lại
3. Click "🗑️ Xóa vĩnh viễn"
4. Xác nhận cảnh báo
5. Chính sách bị xóa hoàn toàn

**Lưu ý**: Không thể xóa chính sách ACTIVE. Phải vô hiệu hóa hoặc lưu trữ trước.

## Backend Implementation

### Controller
```typescript
@Post(':id/activate')
activate(@Request() req, @Param('id') id: string)

@Post(':id/deactivate')
deactivate(@Request() req, @Param('id') id: string)

@Post(':id/archive')
archive(@Request() req, @Param('id') id: string)

@Delete(':id')
remove(@Request() req, @Param('id') id: string)
```

### Service Logic

**activate()**:
- Tìm chính sách theo ID
- Chuyển tất cả chính sách ACTIVE khác sang ARCHIVED
- Cập nhật chính sách hiện tại thành ACTIVE

**deactivate()**:
- Kiểm tra chính sách đang ACTIVE
- Throw error nếu không phải ACTIVE
- Cập nhật thành DRAFT

**archive()**:
- Tìm chính sách theo ID
- Cập nhật thành ARCHIVED
- (TODO: Kiểm tra dependencies trong production)

**remove()**:
- Kiểm tra chính sách KHÔNG phải ACTIVE
- Throw error nếu đang ACTIVE: "Cannot delete ACTIVE policy"
- (TODO: Kiểm tra dependencies - contracts/listings đang sử dụng)
- Xóa chính sách khỏi database
- Return success message

## Best Practices

1. **Versioning**: Luôn tạo chính sách mới thay vì sửa chính sách ACTIVE
2. **Testing**: Test chính sách ở DRAFT trước khi kích hoạt
3. **Documentation**: Ghi chú rõ lý do thay đổi trong tên chính sách
4. **Audit Trail**: Giữ lại chính sách ARCHIVED để audit (không nên xóa)
5. **Dependencies**: Kiểm tra xem chính sách có đang được sử dụng trước khi xóa
6. **Xóa thận trọng**: Chỉ xóa chính sách test hoặc tạo nhầm. Nên dùng ARCHIVED thay vì xóa

## Quy tắc xóa

### ✅ Có thể xóa:
- Chính sách DRAFT (chưa từng kích hoạt)
- Chính sách ARCHIVED (đã lưu trữ và không còn dùng)
- Chính sách test/tạo nhầm

### ❌ KHÔNG thể xóa:
- Chính sách ACTIVE (đang hoạt động)
- Chính sách đang được sử dụng trong contracts/listings (TODO: implement check)

### 💡 Khuyến nghị:
- Ưu tiên dùng **ARCHIVED** thay vì xóa để giữ lại lịch sử
- Chỉ xóa khi thực sự chắc chắn không cần dữ liệu
- Trong production, nên có soft delete thay vì hard delete

## Roadmap

- [ ] Thêm validation dependencies trước khi archive
- [ ] Thêm audit log cho mọi thay đổi trạng thái
- [ ] Thêm khả năng restore từ ARCHIVED
- [ ] Thêm bulk operations (archive nhiều chính sách cùng lúc)
- [ ] Thêm preview impact khi thay đổi trạng thái
