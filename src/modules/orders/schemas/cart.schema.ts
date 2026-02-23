import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;


@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId; 

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number; 

  @Prop({ type: String, default: null })
  variant?: string; 

  @Prop({ type: Object, default: {} })
  attributes: Record<string, any>; 
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);


@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: String, unique: true, index: true })
  sessionId?: string; 

  @Prop({ type: Types.ObjectId, ref: 'Admin', default: null, index: true })
  userId?: Types.ObjectId; 

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[]; 

  @Prop({ type: String, default: null })
  promoCode?: string; 

  @Prop({ type: Date, default: Date.now, expires: 2592000 }) 
  expiresAt: Date; 
}

export const CartSchema = SchemaFactory.createForClass(Cart);


CartSchema.index({ sessionId: 1 });
CartSchema.index({ userId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });




