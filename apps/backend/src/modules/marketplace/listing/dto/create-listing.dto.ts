import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({ description: 'Listing title', example: 'Modern 2BR Apartment in District 1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  title: string;

  @ApiProperty({ description: 'Listing description', example: 'Beautiful apartment with city view...', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Media URLs', 
    example: [{ url: 'https://example.com/image1.jpg', type: 'image' }],
    required: false 
  })
  @IsArray()
  @IsOptional()
  media?: any[];

  @ApiProperty({ description: 'Tags for categorization', example: ['apartment', 'monthly', 'furnished'], required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ 
    description: 'Pricing display info', 
    example: { from_amount: 12000000, currency: 'VND', unit: 'month' },
    required: false 
  })
  @IsObject()
  @IsOptional()
  pricing_display?: any;

  @ApiProperty({ description: 'Rentable item IDs', example: ['uuid1', 'uuid2'], type: [String], required: false })
  @IsArray()
  @IsOptional()
  rentable_item_ids?: string[];
}
