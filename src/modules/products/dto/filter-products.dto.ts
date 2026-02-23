import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsMongoId, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortField {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  CREATED_AT_ASC = 'createdAt_asc',
  CREATED_AT_DESC = 'createdAt_desc',
  VIEWS_DESC = 'views_desc',
  SALES_DESC = 'sales_desc',
  ORDER_ASC = 'order_asc',
}

export class FilterProductsDto {
  @ApiPropertyOptional({ description: 'Номер страницы', example: 1, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Количество элементов на странице', example: 10, default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Поиск по названию или описанию' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'ID основной категории' })
  @IsMongoId()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'ID дополнительных категорий', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ description: 'Минимальная цена', example: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Максимальная цена', example: 10000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Только товары в наличии', default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'Только новые товары', default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isNew?: boolean;

  @ApiPropertyOptional({ description: 'Только рекомендуемые товары', default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Только товары со скидкой', default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isOnSale?: boolean;

  @ApiPropertyOptional({ 
    description: 'Поле для сортировки',
    enum: SortField,
    example: SortField.PRICE_ASC
  })
  @IsEnum(SortField)
  @IsOptional()
  sortBy?: SortField = SortField.ORDER_ASC;

  @ApiPropertyOptional({ description: 'Включить неактивные товары', default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean = false;
}

