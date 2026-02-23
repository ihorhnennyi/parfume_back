import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderItemDocument = OrderItem & Document;


@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId; 

  @Prop({ type: String, required: true })
  productName: string; 

  @Prop({ type: String, default: null })
  productSlug?: string; 

  @Prop({ type: String, default: null })
  productImage?: string; 

  @Prop({ type: Number, required: true })
  quantity: number; 

  @Prop({ type: Number, required: true })
  price: number; 

  @Prop({ type: Number, default: 0 })
  discount: number; 

  @Prop({ type: Number, required: true })
  total: number; 

  @Prop({ type: String, default: null })
  variant?: string;

  @Prop({ type: String, default: null })
  variantName?: string;

  @Prop({ type: String, default: null })
  variantImage?: string; 

  @Prop({ type: Object, default: {} })
  attributes: Record<string, any>; 
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);




