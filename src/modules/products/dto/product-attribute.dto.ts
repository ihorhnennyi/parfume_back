import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TranslationDto } from '../../../common/dto/translation.dto';

export class ProductAttributeDto {
  @ApiProperty({ description: 'Название атрибута (мультиязычное)', type: TranslationDto, example: { ua: 'Колір', ru: 'Цвет', en: 'Color' } })
  @ValidateNested()
  @Type(() => TranslationDto)
  name: TranslationDto;

  @ApiProperty({ description: 'Значение атрибута (мультиязычное)', type: TranslationDto, example: { ua: 'Червоний', ru: 'Красный', en: 'Red' } })
  @ValidateNested()
  @Type(() => TranslationDto)
  value: TranslationDto;

  @ApiPropertyOptional({ description: 'Единица измерения', example: 'кг' })
  @IsString()
  @IsOptional()
  unit?: string;
}



