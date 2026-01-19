import { PartialType } from '@nestjs/swagger';
import { CreateRentableItemDto } from './create-rentable-item.dto';

export class UpdateRentableItemDto extends PartialType(CreateRentableItemDto) {}
