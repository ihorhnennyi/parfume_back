import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class TranslationDto {
  @ApiPropertyOptional({ description: 'Украинский перевод' })
  @IsString()
  @IsOptional()
  ua?: string | null;

  @ApiPropertyOptional({ description: 'Русский перевод' })
  @IsString()
  @IsOptional()
  ru?: string | null;

  @ApiPropertyOptional({ description: 'Английский перевод' })
  @IsString()
  @IsOptional()
  en?: string | null;
}


