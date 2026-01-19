import { IsString, IsOptional } from 'class-validator';

export class AssignTicketDto {
  @IsString()
  @IsOptional()
  assigned_to?: string;

  @IsString()
  @IsOptional()
  assigned_to_user_id?: string;
}
