import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Translation, TranslationSchema } from '../../../common/schemas/translation.schema';

export type MenuDocument = Menu & Document;

@Schema({
  timestamps: true,
})
export class Menu {
  @Prop({ type: TranslationSchema, required: true })
  name: Translation;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Menu', default: null })
  parent: Types.ObjectId | null;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  url: string | null;

  @Prop({ default: null })
  icon: string | null;

  @Prop({ type: TranslationSchema, default: null })
  description: Translation | null;

  @Prop({ 
    type: String, 
    enum: ['internal', 'external', 'divider', 'header'],
    default: 'internal'
  })
  type: string;

  @Prop({ default: false })
  isNewTab: boolean;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);


MenuSchema.index({ parent: 1, order: 1 });
MenuSchema.index({ slug: 1 }, { unique: true });
MenuSchema.index({ isActive: 1 });



