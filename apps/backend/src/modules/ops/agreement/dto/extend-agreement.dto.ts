import { IsInt, Min } from 'class-validator';

export class ExtendAgreementDto {
  @IsInt()
  @Min(1)
  extend_months: number;
}
