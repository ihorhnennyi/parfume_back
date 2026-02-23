import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum SupportedLanguage {
  UA = 'ua',
  RU = 'ru',
  EN = 'en',
}

@Schema({ _id: false })
export class Translation {
  @Prop({ type: String, default: null })
  ua?: string | null;

  @Prop({ type: String, default: null })
  ru?: string | null;

  @Prop({ type: String, default: null })
  en?: string | null;
}

export const TranslationSchema = SchemaFactory.createForClass(Translation);


