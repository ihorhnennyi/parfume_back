import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEmail,
  IsArray,
  ValidateNested,
  Min,
  MinLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Клиент в формате фронта (ORDER_PAYLOAD): fullName, address, city, comment */
export class OrderPayloadCustomerDto {
  @ApiPropertyOptional({ description: 'Повне ім\'я', example: 'Andrii Kovalenko' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ description: 'Email', example: 'andrii.kovalenko@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Телефон', example: '+380671234567' })
  @IsString()
  @MinLength(1)
  phone: string;

  @ApiPropertyOptional({ description: 'Адреса доставки (одним рядком)', example: 'Khreshchatyk Street 15, Apartment 24' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Місто', example: 'Kyiv' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Коментар до замовлення' })
  @IsString()
  @IsOptional()
  comment?: string;
}

/** Варіант товару в позиції (з фронту) */
export class OrderPayloadVariantDto {
  @ApiPropertyOptional({ description: 'Назва варіанта (напр. об\'єм)', example: { ua: '50', ru: '50', en: '50' } })
  @IsObject()
  @IsOptional()
  name?: { ua?: string; ru?: string; en?: string };

  @ApiPropertyOptional({ description: 'Ціна варіанта' })
  @IsObject()
  @IsOptional()
  price?: { current?: number; old?: number | null; currency?: string };

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  stock?: number;
}

/** Позиція замовлення в форматі фронту (ORDER_PAYLOAD) */
export class OrderPayloadItemDto {
  @ApiProperty({ description: 'ID товару' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'Назва товару' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Кількість', example: 1 })
  @IsNumber()
  @Min(1)
  qty: number;

  @ApiPropertyOptional({ description: 'Ціна за одиницю' })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Сума по позиції' })
  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Валюта', default: 'UAH' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'URL зображення' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ description: 'Варіант (об\'єм тощо)' })
  @ValidateNested()
  @Type(() => OrderPayloadVariantDto)
  @IsOptional()
  variant?: OrderPayloadVariantDto;
}

/** Підсумок замовлення з фронту */
export class OrderPayloadSummaryDto {
  @ApiPropertyOptional({ description: 'Кількість позицій' })
  @IsNumber()
  @IsOptional()
  totalItems?: number;

  @ApiPropertyOptional({ description: 'Загальна сума' })
  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @ApiPropertyOptional({ description: 'Валюта', default: 'UAH' })
  @IsString()
  @IsOptional()
  currency?: string;
}

/** Тіло замовлення в форматі ORDER_PAYLOAD (від магазину/фронту) */
export class CreateOrderPayloadDto {
  @ApiProperty({ description: 'Дані клієнта', type: OrderPayloadCustomerDto })
  @ValidateNested()
  @Type(() => OrderPayloadCustomerDto)
  customer: OrderPayloadCustomerDto;

  @ApiProperty({ description: 'Позиції замовлення', type: [OrderPayloadItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderPayloadItemDto)
  items: OrderPayloadItemDto[];

  @ApiPropertyOptional({ description: 'Підсумок', type: OrderPayloadSummaryDto })
  @ValidateNested()
  @Type(() => OrderPayloadSummaryDto)
  @IsOptional()
  summary?: OrderPayloadSummaryDto;
}
