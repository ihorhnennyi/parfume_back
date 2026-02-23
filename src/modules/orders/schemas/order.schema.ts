import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderItem, OrderItemSchema } from './order-item.schema';

export type OrderDocument = Order & Document;


export enum OrderStatus {
  PENDING = 'pending', 
  CONFIRMED = 'confirmed', 
  PROCESSING = 'processing', 
  SHIPPED = 'shipped', 
  DELIVERED = 'delivered', 
  CANCELLED = 'cancelled', 
  REFUNDED = 'refunded', 
}


export enum PaymentMethod {
  CASH = 'cash', 
  CARD = 'card', 
  ONLINE = 'online', 
  BANK_TRANSFER = 'bank_transfer', 
}


export enum DeliveryMethod {
  PICKUP = 'pickup', 
  COURIER = 'courier', 
  POST = 'post', 
  EXPRESS = 'express', 
}


@Schema({ _id: false })
export class CustomerInfo {
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, default: null })
  company?: string;
}

export const CustomerInfoSchema = SchemaFactory.createForClass(CustomerInfo);


@Schema({ _id: false })
export class DeliveryAddress {
  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  street: string;

  @Prop({ type: String, default: null })
  building?: string;

  @Prop({ type: String, default: null })
  apartment?: string;

  @Prop({ type: String, default: null })
  postalCode?: string;

  @Prop({ type: String, default: null })
  notes?: string; 
}

export const DeliveryAddressSchema = SchemaFactory.createForClass(DeliveryAddress);


@Schema({ timestamps: true })
export class Order {
  @Prop({ type: String, required: true, unique: true, index: true })
  orderNumber: string; 

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[]; 

  @Prop({ type: CustomerInfoSchema, required: true })
  customer: CustomerInfo; 

  @Prop({ type: DeliveryAddressSchema, default: null })
  deliveryAddress?: DeliveryAddress; 

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING, index: true })
  status: OrderStatus; 

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod; 

  @Prop({ type: String, enum: DeliveryMethod, required: true })
  deliveryMethod: DeliveryMethod; 

  
  @Prop({ type: Number, required: true })
  subtotal: number; 

  @Prop({ type: Number, default: 0 })
  discount: number; 

  @Prop({ type: Number, default: 0 })
  deliveryCost: number; 

  @Prop({ type: String, default: 'UAH' })
  currency: string; 

  @Prop({ type: Number, required: true })
  total: number; 

  
  @Prop({ type: String, default: null })
  notes?: string; 

  @Prop({ type: String, default: null })
  promoCode?: string; 

  @Prop({ type: Boolean, default: false })
  isPaid: boolean; 

  @Prop({ type: Date, default: null })
  paidAt?: Date; 

  @Prop({ type: Boolean, default: false })
  isSentToTelegram: boolean; 

  @Prop({ type: Date, default: null })
  sentToTelegramAt?: Date; 

  @Prop({ type: String, default: null })
  trackingNumber?: string; 

  @Prop({ type: Date, default: null })
  shippedAt?: Date; 

  @Prop({ type: Date, default: null })
  deliveredAt?: Date; 

  
  @Prop({ type: String, default: null })
  ipAddress?: string; 

  @Prop({ type: String, default: null })
  userAgent?: string; 

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>; 
}

export const OrderSchema = SchemaFactory.createForClass(Order);


OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ 'customer.phone': 1 });
OrderSchema.index({ createdAt: -1 });




