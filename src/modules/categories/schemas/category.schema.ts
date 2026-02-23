import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Translation, TranslationSchema } from '../../../common/schemas/translation.schema';

export type CategoryDocument = Category & Document;

@Schema({
  timestamps: true,
})
export class Category {
  @Prop({ type: TranslationSchema, required: true })
  name: Translation;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parent: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  parentCategories: Types.ObjectId[];

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: TranslationSchema, default: null })
  description: Translation | null;

  @Prop({ default: null })
  image: string | null;

  @Prop({ default: null })
  icon: string | null;

  @Prop({ type: TranslationSchema, default: null })
  metaTitle: Translation | null;

  @Prop({ type: TranslationSchema, default: null })
  metaDescription: Translation | null;

  @Prop({ type: TranslationSchema, default: null })
  metaKeywords: Translation | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);


CategorySchema.index({ parent: 1, order: 1 });
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ parentCategories: 1 });



