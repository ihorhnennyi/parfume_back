import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductPriceDto } from './product-price.dto';
import { TranslationDto } from '../../../common/dto/translation.dto';

export class ProductVariantDto {
  @ApiProperty({ description: 'Название варианта (мультиязычное)', type: TranslationDto, example: { ua: 'Розмір: XL, Колір: Червоний', ru: 'Размер: XL, Цвет: Красный', en: 'Size: XL, Color: Red' } })
  @ValidateNested()
  @Type(() => TranslationDto)
  name: TranslationDto;

  @ApiProperty({ description: 'Цена варианта', type: ProductPriceDto })
  @ValidateNested()
  @Type(() => ProductPriceDto)
  price: ProductPriceDto;

  @ApiPropertyOptional({ description: 'Артикул варианта', example: 'PROD-XL-RED-001' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Количество на складе', example: 10, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ description: 'Активен ли вариант', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'URL изображения варианта (напр. для каждого милитража)', example: '/uploads/products/xxx/variants/0/abc.jpg' })
  @IsString()
  @IsOptional()
  image?: string;
}



