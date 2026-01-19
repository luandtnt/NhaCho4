import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum AgreementState {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PENDING_CONFIRM = 'PENDING_CONFIRM',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  CANCELLED = 'CANCELLED',
}

export class QueryAgreementDto {
  @ApiPropertyOptional({ description: 'Trang', example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Số lượng/trang', example: 20 })
  @IsOptional()
  page_size?: number;

  @ApiPropertyOptional({ enum: AgreementState, description: 'Trạng thái' })
  @IsEnum(AgreementState)
  @IsOptional()
  state?: AgreementState;

  @ApiPropertyOptional({ description: 'ID tenant' })
  @IsString()
  @IsOptional()
  tenant_party_id?: string;

  @ApiPropertyOptional({ description: 'ID rentable item' })
  @IsString()
  @IsOptional()
  rentable_item_id?: string;

  @ApiPropertyOptional({ description: 'Tìm kiếm (mã HĐ, tên tenant, địa chỉ)' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Loại hợp đồng', example: 'lease' })
  @IsString()
  @IsOptional()
  agreement_type?: string;

  @ApiPropertyOptional({ description: 'Sắp xếp', example: 'newest' })
  @IsString()
  @IsOptional()
  sort?: string; // newest, expiring_soon, price_high, price_low
}
