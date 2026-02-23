import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TranslationDto } from '../../../common/dto/translation.dto';

export class UpdateMenuDto {
  @ApiPropertyOptional({
    description: 'Название меню (мультиязычное)',
    type: TranslationDto,
    example: { ua: 'Головна', ru: 'Главная', en: 'Home' },
  })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  name?: TranslationDto;

  @ApiPropertyOptional({
    description: 'Slug',
    example: 'glavnaya',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'ID родительского меню',
    example: null,
  })
  @IsString()
  @IsOptional()
  parent?: string | null;

  @ApiPropertyOptional({
    description: 'Порядок сортировки',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    description: 'URL ссылки',
    example: '/home',
  })
  @IsString()
  @IsOptional()
  url?: string | null;

  @ApiPropertyOptional({
    description: 'Иконка',
    example: 'home-icon',
  })
  @IsString()
  @IsOptional()
  icon?: string | null;

  @ApiPropertyOptional({
    description: 'Описание меню (мультиязычное)',
    type: TranslationDto,
    example: { ua: 'Головна сторінка сайту', ru: 'Главная страница сайта', en: 'Home page' },
  })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsOptional()
  description?: TranslationDto | null;

  @ApiPropertyOptional({
    description: 'Тип меню',
    enum: ['internal', 'external', 'divider', 'header'],
    example: 'internal',
  })
  @IsEnum(['internal', 'external', 'divider', 'header'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Открывать ссылку в новой вкладке',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isNewTab?: boolean;

  @ApiPropertyOptional({
    description: 'Активность меню',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}



