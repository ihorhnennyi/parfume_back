import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsMongoId,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { ProductPriceDto } from './product-price.dto';
import { ProductAttributeDto } from './product-attribute.dto';
import { ProductVariantDto } from './product-variant.dto';
import { TranslationDto } from '../../../common/dto/translation.dto';

export class CreateProductDto {
  @ApiProperty({ description: 'Название товара (мультиязычное)', type: TranslationDto, example: { ua: 'Смартфон Samsung Galaxy S21', ru: 'Смартфон Samsung Galaxy S21', en: 'Samsung Galaxy S21 Smartphone' } })
  @ValidateNested()
  @Type(() => TranslationDto)
  name: TranslationDto;

  @ApiPropertyOptional({ description: 'URL-дружественный идентификатор (автогенерация если не указан)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Описание товара (мультиязычное)', type: TranslationDto })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  description?: TranslationDto | null;

  @ApiPropertyOptional({ description: 'Краткое описание товара (мультиязычное)', type: TranslationDto })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  shortDescription?: TranslationDto | null;

  @ApiPropertyOptional({ description: 'ID основной категории' })
  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return Types.ObjectId.isValid(trimmed) && trimmed !== '' ? trimmed : null;
  })
  @IsMongoId()
  @IsOptional()
  category?: string | null;

  @ApiPropertyOptional({ description: 'ID дополнительных категорий', type: [String] })
  @IsArray()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return [];
    return value.filter((id: any) => {
      if (typeof id !== 'string') return false;
      return Types.ObjectId.isValid(id) && id.trim() !== '';
    });
  })
  @IsMongoId({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({ description: 'Цена товара', type: ProductPriceDto })
  @ValidateNested()
  @Type(() => ProductPriceDto)
  price: ProductPriceDto;

  @ApiPropertyOptional({ description: 'Варианты товара', type: [ProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({ description: 'Атрибуты/характеристики товара', type: [ProductAttributeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  @IsOptional()
  attributes?: ProductAttributeDto[];

  @ApiPropertyOptional({ description: 'Артикул товара' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Количество на складе', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ description: 'Порядок сортировки', default: 0 })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Активен ли товар', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Новый товар', default: false })
  @IsBoolean()
  @IsOptional()
  isNew?: boolean;

  @ApiPropertyOptional({ description: 'Рекомендуемый товар', default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Товар со скидкой', default: false })
  @IsBoolean()
  @IsOptional()
  isOnSale?: boolean;

  
  @ApiPropertyOptional({ description: 'SEO заголовок (мультиязычный)', type: TranslationDto })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  metaTitle?: TranslationDto | null;

  @ApiPropertyOptional({ description: 'SEO описание (мультиязычное)', type: TranslationDto })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  metaDescription?: TranslationDto | null;

  @ApiPropertyOptional({ description: 'SEO ключевые слова (мультиязычное)', type: TranslationDto })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  metaKeywords?: TranslationDto | null;

  
  @ApiPropertyOptional({ description: 'Произвольные дополнительные поля', type: Object })
  @IsOptional()
  customFields?: Record<string, any>;
}



