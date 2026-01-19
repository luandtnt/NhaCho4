# 🚀 CLICK TO RUN - Walk-in Booking Migration

## Cách 1: PowerShell Script (Khuyến nghị)

**Chỉ cần click run file này:**
```
run-migration-simple.ps1
```

Hoặc mở terminal và chạy:
```powershell
.\run-migration-simple.ps1
```

---

## Cách 2: Node.js Script

**Chạy lệnh này trong terminal:**
```bash
node apply-walk-in-migration.js
```

Sau đó:
```bash
cd apps/backend
npx prisma generate
cd ../..
```

---

## Cách 3: Manual (Nếu 2 cách trên lỗi)

### Bước 1: Chạy SQL trực tiếp
Mở file này và copy SQL:
```
apps/backend/prisma/migrations/20260117_walk_in_bookings/migration.sql
```

Paste vào database tool của bạn (pgAdmin, DBeaver, etc.) và execute.

### Bước 2: Generate Prisma
```bash
cd apps/backend
npx prisma generate
cd ../..
```

---

## Sau khi chạy xong

### 1. Restart Backend
```bash
cd apps/backend
npm run dev
```

### 2. Test Frontend
Mở browser:
- http://localhost:5173/quick-checkin
- http://localhost:5173/active-bookings

---

## Nếu gặp lỗi

### Lỗi: "Cannot find module '@prisma/client'"
```bash
cd apps/backend
npm install
npx prisma generate
```

### Lỗi: "Table 'bookings' doesn't exist"
Bạn cần tạo database schema trước. Chạy:
```bash
cd apps/backend
npx prisma migrate dev
```

### Lỗi: "Column already exists"
Migration đã chạy rồi. Skip và chỉ cần:
```bash
cd apps/backend
npx prisma generate
```

---

## Kiểm tra migration đã chạy chưa

Chạy lệnh này để kiểm tra:
```bash
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$queryRaw\`SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name IN ('actual_start_at','is_walk_in')\`.then(r => {console.log('Columns:', r); p.\$disconnect();})"
```

Nếu thấy `actual_start_at` và `is_walk_in` → Migration đã chạy ✅

---

## Support

Nếu vẫn lỗi, gửi cho tôi:
1. Error message đầy đủ
2. Output của lệnh: `node --version`
3. Output của lệnh: `npm --version`
