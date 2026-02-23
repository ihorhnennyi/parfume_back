import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Translation, TranslationSchema } from '../../../common/schemas/translation.schema';

export type ProductDocument = Product & Document;


@Schema({ _id: false })
export class ProductPrice {
  @Prop({ type: Number, required: true })
  current: number; 

  @Prop({ type: Number, default: null })
  old?: number; 

  @Prop({ type: String, default: 'UAH' })
  currency: string; 
}

export const ProductPriceSchema = SchemaFactory.createForClass(ProductPrice);


@Schema({ _id: false })
export class ProductAttribute {
  @Prop({ type: TranslationSchema, required: true })
  name: Translation; 

  @Prop({ type: TranslationSchema, required: true })
  value: Translation; 

  @Prop({ type: String, default: null })
  unit?: string; 
}

export const ProductAttributeSchema = SchemaFactory.createForClass(ProductAttribute);


@Schema({ _id: false })
export class ProductImage {
  @Prop({ type: String, required: true })
  url: string; 

  @Prop({ type: String, default: null })
  alt?: string; 

  @Prop({ type: Number, default: 0 })
  order: number; 

  @Prop({ type: Boolean, default: false })
  isMain: boolean; 
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);


@Schema({ _id: false })
export class ProductVariant {
  @Prop({ type: TranslationSchema, required: true })
  name: Translation; 

  @Prop({ type: ProductPriceSchema, required: true })
  price: ProductPrice; 

  @Prop({ type: String, default: null })
  sku?: string; 

  @Prop({ type: Number, default: 0 })
  stock: number; 

  @Prop({ type: Boolean, default: true })
  isActive: boolean; 

  /** URL изображения варианта (напр. для каждого милитража — своя картинка) */
  @Prop({ type: String, default: null })
  image?: string; 
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);


@Schema({ timestamps: true })
export class Product {
  @Prop({ type: TranslationSchema, required: true, index: true })
  name: Translation; 

  @Prop({ type: String, required: true, unique: true, index: true })
  slug: string; 

  @Prop({ type: TranslationSchema, default: null })
  description?: Translation | null; 

  @Prop({ type: TranslationSchema, default: null })
  shortDescription?: Translation | null; 

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null, index: true })
  category?: Types.ObjectId; 

  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  categories: Types.ObjectId[]; 

  @Prop({ type: ProductPriceSchema, required: true })
  price: ProductPrice; 

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[]; 

  @Prop({ type: [ProductAttributeSchema], default: [] })
  attributes: ProductAttribute[]; 

  @Prop({ type: [ProductImageSchema], default: [] })
  images: ProductImage[]; 

  @Prop({ type: String, default: null })
  sku?: string; 

  @Prop({ type: Number, default: 0 })
  stock: number; 

  @Prop({ type: Number, default: 0 })
  order: number; 

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean; 

  @Prop({ type: Boolean, default: false })
  isNew: boolean; 

  @Prop({ type: Boolean, default: false })
  isFeatured: boolean; 

  @Prop({ type: Boolean, default: false })
  isOnSale: boolean; 

  @Prop({ type: Number, default: 0 })
  views: number; 

  @Prop({ type: Number, default: 0 })
  sales: number; 

  @Prop({ type: Number, default: 0 })
  rating: number; 

  @Prop({ type: Number, default: 0 })
  reviewsCount: number; 

  
  @Prop({ type: TranslationSchema, default: null })
  metaTitle?: Translation | null;

  @Prop({ type: TranslationSchema, default: null })
  metaDescription?: Translation | null;

  @Prop({ type: TranslationSchema, default: null })
  metaKeywords?: Translation | null;

  
  @Prop({ type: Object, default: {} })
  customFields: Record<string, any>; 
}

export const ProductSchema = SchemaFactory.createForClass(Product);


ProductSchema.index({ 'name.ua': 'text', 'name.ru': 'text', 'name.en': 'text', 'description.ua': 'text', 'description.ru': 'text', 'description.en': 'text', 'shortDescription.ua': 'text', 'shortDescription.ru': 'text', 'shortDescription.en': 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ 'price.current': 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ isOnSale: 1, isActive: 1 });



