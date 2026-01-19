import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsEnum, IsObject, IsBoolean, IsInt, Min, Max } from 'class-validator';

export enum AgreementType {
  LEASE = 'lease', // Mid/Long term
  BOOKING = 'booking', // Short term
}

export enum PaymentCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum UtilityBilling {
  METER_PRIVATE = 'METER_PRIVATE',
  SHARED = 'SHARED',
  OWNER_RATE = 'OWNER_RATE',
  STATE_RATE = 'STATE_RATE',
  INCLUDED = 'INCLUDED',
}

export class CreateAgreementDto {
  // ===== Yêu cầu 1: Thông tin định danh =====
  @ApiPropertyOptional({ description: 'Tiêu đề hợp đồng', example: 'HĐ thuê căn 2PN Vinhomes Q9' })
  @IsString()
  @IsOptional()
  contract_title?: string;

  // ===== Yêu cầu 3: Thông tin người thuê =====
  @ApiProperty({ description: 'ID của tenant (người thuê)' })
  @IsString()
  @IsNotEmpty()
  tenant_party_id: string;

  @ApiPropertyOptional({ description: 'Số CCCD/Passport của tenant', example: '001234567890' })
  @IsString()
  @IsOptional()
  tenant_id_number?: string;

  // ===== Yêu cầu 2: Chọn đối tượng cho thuê =====
  @ApiProperty({ description: 'ID của rentable item (BĐS)' })
  @IsString()
  @IsNotEmpty()
  rentable_item_id: string;

  @ApiProperty({ enum: AgreementType, description: 'Loại hợp đồng' })
  @IsEnum(AgreementType)
  @IsNotEmpty()
  agreement_type: AgreementType;

  // ===== Yêu cầu 4: Thời hạn thuê & lịch thanh toán =====
  @ApiProperty({ description: 'Ngày bắt đầu', example: '2026-02-01T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  start_at: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc', example: '2027-02-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  end_at?: string;

  @ApiPropertyOptional({ description: 'Ngày chốt hóa đơn (1-28)', example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @Max(28)
  @IsOptional()
  billing_day?: number;

  @ApiPropertyOptional({ description: 'Hạn thanh toán (số ngày)', example: 5, default: 5 })
  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  payment_due_days?: number;

  // ===== Yêu cầu 5: Giá thuê & các khoản phí =====
  @ApiProperty({ description: 'Giá thuê cơ bản (VND/tháng)', example: 5000000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  base_price: number;

  @ApiPropertyOptional({ description: 'Tiền cọc (VND)', example: 10000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deposit_amount?: number;

  @ApiPropertyOptional({ description: 'Phí dịch vụ (VND)', example: 500000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  service_fee?: number;

  @ApiPropertyOptional({ description: 'Phí quản lý tòa nhà (VND)', example: 300000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  building_mgmt_fee?: number;

  @ApiPropertyOptional({ description: 'Phí gửi xe máy (VND/tháng)', example: 50000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  parking_fee_motorbike?: number;

  @ApiPropertyOptional({ description: 'Phí gửi ô tô (VND/tháng)', example: 500000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  parking_fee_car?: number;

  @ApiPropertyOptional({ description: 'Phí internet (VND/tháng)', example: 200000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  internet_fee?: number;

  // ===== Yêu cầu 6: Điện/Nước & chi phí vận hành =====
  @ApiPropertyOptional({ enum: UtilityBilling, description: 'Cách tính tiền điện' })
  @IsEnum(UtilityBilling)
  @IsOptional()
  electricity_billing?: UtilityBilling;

  @ApiPropertyOptional({ description: 'Giá điện (VND/kWh) - nếu OWNER_RATE', example: 3500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  electricity_rate?: number;

  @ApiPropertyOptional({ enum: UtilityBilling, description: 'Cách tính tiền nước' })
  @IsEnum(UtilityBilling)
  @IsOptional()
  water_billing?: UtilityBilling;

  @ApiPropertyOptional({ description: 'Giá nước (VND/m3) - nếu OWNER_RATE', example: 15000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  water_rate?: number;

  // Price increase (for LONG_TERM)
  @ApiPropertyOptional({ description: '% tăng giá hàng năm', example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price_increase_percent?: number;

  @ApiPropertyOptional({ description: 'Tần suất tăng giá', example: 'YEARLY' })
  @IsString()
  @IsOptional()
  price_increase_frequency?: string;

  // Payment
  @ApiPropertyOptional({ enum: PaymentCycle, description: 'Kỳ thanh toán', default: 'MONTHLY' })
  @IsEnum(PaymentCycle)
  @IsOptional()
  payment_cycle?: PaymentCycle;

  // ===== Yêu cầu 7: Điều khoản & nội quy =====
  @ApiPropertyOptional({ description: 'Nội quy chung' })
  @IsString()
  @IsOptional()
  house_rules?: string;

  @ApiPropertyOptional({ description: 'Điều khoản chấm dứt trước hạn' })
  @IsString()
  @IsOptional()
  termination_clause?: string;

  @ApiPropertyOptional({ description: 'Phí phạt vi phạm (VND)', example: 1000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  violation_penalty?: number;

  @ApiPropertyOptional({ description: 'Cho phép thú cưng', default: false })
  @IsBoolean()
  @IsOptional()
  allow_pets?: boolean;

  @ApiPropertyOptional({ description: 'Cho phép hút thuốc', default: false })
  @IsBoolean()
  @IsOptional()
  allow_smoking?: boolean;

  @ApiPropertyOptional({ description: 'Cho khách ở qua đêm', default: true })
  @IsBoolean()
  @IsOptional()
  allow_guests?: boolean;

  // ===== Yêu cầu 8: Bàn giao & tài sản =====
  @ApiPropertyOptional({ description: 'Ngày bàn giao', example: '2026-02-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  handover_date?: string;

  @ApiPropertyOptional({ description: 'Tình trạng hiện tại' })
  @IsString()
  @IsOptional()
  handover_condition?: string;

  @ApiPropertyOptional({ description: 'Danh sách nội thất (JSON)', example: [] })
  @IsOptional()
  furniture_list?: any;

  @ApiPropertyOptional({ description: 'Chỉ số điện ban đầu', example: 1234.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  initial_electricity?: number;

  @ApiPropertyOptional({ description: 'Chỉ số nước ban đầu', example: 567.8 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  initial_water?: number;

  @ApiPropertyOptional({ description: 'URL biên bản bàn giao' })
  @IsString()
  @IsOptional()
  handover_document_url?: string;

  // ===== Yêu cầu 9: File đính kèm =====
  @ApiPropertyOptional({ description: 'URL file hợp đồng (PDF/DOC)' })
  @IsString()
  @IsOptional()
  contract_document_url?: string;

  @ApiPropertyOptional({ description: 'URL CCCD tenant' })
  @IsString()
  @IsOptional()
  tenant_id_document_url?: string;

  @ApiPropertyOptional({ description: 'URL giấy tờ căn hộ' })
  @IsString()
  @IsOptional()
  property_document_url?: string;

  // Terms
  @ApiPropertyOptional({ description: 'Điều khoản hợp đồng (JSON)', example: {} })
  @IsObject()
  @IsOptional()
  terms_json?: any;

  @ApiPropertyOptional({ description: 'Ghi chú của landlord' })
  @IsString()
  @IsOptional()
  landlord_notes?: string;
}
