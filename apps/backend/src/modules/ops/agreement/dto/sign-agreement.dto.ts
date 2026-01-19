import { IsString } from 'class-validator';

export class SignAgreementDto {
  @IsString()
  signer: string; // landlord, tenant

  @IsString()
  signature: string;
}
