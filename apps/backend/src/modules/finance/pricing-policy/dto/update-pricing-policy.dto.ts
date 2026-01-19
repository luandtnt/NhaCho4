import { PartialType } from '@nestjs/swagger';
import { CreatePricingPolicyDto } from './create-pricing-policy.dto';

export class UpdatePricingPolicyDto extends PartialType(CreatePricingPolicyDto) {}
