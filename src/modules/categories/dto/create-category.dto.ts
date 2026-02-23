import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TranslationDto } from '../../../common/dto/translation.dto';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Название категории (мультиязычное)',
    type: TranslationDto,
    example: { ua: 'Електроніка', ru: 'Электроника', en: 'Electronics' },
  })
  @ValidateNested()
  @Type(() => TranslationDto)
  name: TranslationDto;

  @ApiPropertyOptional({
    description: 'Slug (автоматически генерируется из названия, если не указан)',
    example: 'elektronika',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'ID родительской категории (для создания подкатегории)',
    example: null,
  })
  @IsString()
  @IsOptional()
  parent?: string | null;

  @ApiPropertyOptional({
    description: 'Массив ID дополнительных родительских категорий (для общих подкатегорий)',
    example: [],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  parentCategories?: string[];

  @ApiPropertyOptional({
    description: 'Порядок сортировки',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    description: 'Описание категории (мультиязычное)',
    type: TranslationDto,
    example: { ua: 'Категорія електронних товарів', ru: 'Категория электронных товаров', en: 'Electronics category' },
  })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  description?: TranslationDto | null;

  @ApiPropertyOptional({
    description: 'Иконка категории',
    example: 'electronics-icon',
  })
  @IsString()
  @IsOptional()
  icon?: string | null;

  @ApiPropertyOptional({
    description: 'SEO заголовок (мультиязычный)',
    type: TranslationDto,
    example: { ua: 'Електроніка - купити в інтернет-магазині', ru: 'Электроника - купить в интернет-магазине', en: 'Electronics - buy online' },
  })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  metaTitle?: TranslationDto | null;

  @ApiPropertyOptional({
    description: 'SEO описание (мультиязычное)',
    type: TranslationDto,
    example: { ua: 'Широкий вибір електроніки за вигідними цінами', ru: 'Широкий выбор электроники по выгодным ценам', en: 'Wide selection of electronics at competitive prices' },
  })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  metaDescription?: TranslationDto | null;

  @ApiPropertyOptional({
    description: 'SEO ключевые слова (мультиязычное)',
    type: TranslationDto,
    example: { ua: 'електроніка, техніка, гаджети', ru: 'электроника, техника, гаджеты', en: 'electronics, technology, gadgets' },
  })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  metaKeywords?: TranslationDto | null;

  @ApiPropertyOptional({
    description: 'Активность категории',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}



