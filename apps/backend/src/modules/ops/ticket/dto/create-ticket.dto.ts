import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(['MAINTENANCE', 'REPAIR', 'COMPLAINT', 'REQUEST', 'EMERGENCY'])
  @IsOptional()
  category?: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: string;

  @IsUUID()
  @IsOptional()
  agreement_id?: string;

  @IsUUID()
  @IsOptional()
  asset_id?: string;

  @IsUUID()
  @IsOptional()
  space_node_id?: string;
}
