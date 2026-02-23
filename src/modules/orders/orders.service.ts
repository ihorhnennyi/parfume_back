import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentMethod, DeliveryMethod } from './schemas/order.schema';
import { Cart, CartDocument, CartItem } from './schemas/cart.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { NotFoundException } from '../../common/exceptions';
import { TelegramService } from '../integrations/services/telegram.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { IntegrationType } from '../integrations/schemas/integration.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private telegramService: TelegramService,
    private integrationsService: IntegrationsService,
  ) {}

  
  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  
  async create(createOrderDto: CreateOrderDto, sessionId?: string, ipAddress?: string, userAgent?: string): Promise<Order> {
    
    const productIds = createOrderDto.items.map(item => new Types.ObjectId(item.product));
    const products = await this.productModel.find({ _id: { $in: productIds } }).exec();

    if (products.length !== createOrderDto.items.length) {
      throw new BadRequestException('Some products not found');
    }

    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    
    const orderItems = createOrderDto.items.map(item => {
      const product = productMap.get(item.product);
      if (!product) {
        throw new BadRequestException(`Product ${item.product} not found`);
      }

      const variantIndex = item.variant != null && item.variant !== ''
        ? parseInt(String(item.variant), 10)
        : -1;
      const variant = variantIndex >= 0 && product.variants?.length > variantIndex
        ? product.variants[variantIndex]
        : null;

      const price = variant?.price?.current != null
        ? variant.price.current
        : product.price?.current ?? 0;
      const total = price * item.quantity;

      const variantNameStr = variant?.name
        ? (variant.name.ua || variant.name.ru || variant.name.en || '')
        : null;
      const variantImageUrl = variant?.image || null;
      const productImageUrl = variantImageUrl
        || (product.images && product.images.length > 0 ? product.images[0].url : null);

      const productNameStr = product.name && typeof product.name === 'object'
        ? (product.name.ua || product.name.ru || product.name.en || '')
        : String(product.name ?? '');

      return {
        product: new Types.ObjectId(item.product),
        productName: productNameStr,
        productSlug: product.slug,
        productImage: productImageUrl,
        quantity: item.quantity,
        price: price,
        total: total,
        variant: item.variant || null,
        variantName: variantNameStr || null,
        variantImage: variantImageUrl,
        attributes: item.attributes || {},
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCost = createOrderDto.deliveryCost || 0;
    const total = subtotal + deliveryCost;

    const order = new this.orderModel({
      orderNumber: this.generateOrderNumber(),
      items: orderItems,
      customer: createOrderDto.customer,
      deliveryAddress: createOrderDto.deliveryAddress || null,
      status: OrderStatus.PENDING,
      paymentMethod: createOrderDto.paymentMethod,
      deliveryMethod: createOrderDto.deliveryMethod,
      subtotal: subtotal,
      deliveryCost: deliveryCost,
      currency: createOrderDto.currency || 'UAH',
      total: total,
      notes: createOrderDto.notes || null,
      promoCode: createOrderDto.promoCode || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    const savedOrder = await order.save();

    
    await this.sendOrderToTelegram(savedOrder);

    
    if (sessionId) {
      await this.cartModel.deleteOne({ sessionId }).exec();
    }

    return savedOrder;
  }

  
  private async sendOrderToTelegram(order: OrderDocument): Promise<void> {
    try {
      
      const telegramIntegrations = await this.integrationsService.findActiveByType(IntegrationType.TELEGRAM);
      
      if (telegramIntegrations.length === 0) {
        console.warn('No active Telegram integration found');
        return;
      }

      
      const integration = telegramIntegrations[0];

      
      const message = this.formatOrderMessage(order);

      
      await this.telegramService.sendMessage(
        integration as any,
        message,
        undefined,
        { parseMode: 'HTML' },
      );

      
      order.isSentToTelegram = true;
      order.sentToTelegramAt = new Date();
      await order.save();
    } catch (error) {
      console.error('Failed to send order to Telegram:', error);
      
    }
  }

  
  private formatOrderMessage(order: OrderDocument): string {
    const items = order.items.map((item, index) => {
      return `${index + 1}. <b>${item.productName}</b>\n   Количество: ${item.quantity}\n   Цена: ${item.price} ${order.currency}\n   Итого: ${item.total} ${order.currency}`;
    }).join('\n\n');

    const customer = order.customer;
    const address = order.deliveryAddress 
      ? `\n<b>Адрес доставки:</b>\n${order.deliveryAddress.country}, ${order.deliveryAddress.city}\n${order.deliveryAddress.street}${order.deliveryAddress.building ? ', ' + order.deliveryAddress.building : ''}${order.deliveryAddress.apartment ? ', кв. ' + order.deliveryAddress.apartment : ''}${order.deliveryAddress.postalCode ? '\nИндекс: ' + order.deliveryAddress.postalCode : ''}${order.deliveryAddress.notes ? '\nПримечание: ' + order.deliveryAddress.notes : ''}`
      : '';

    return `
🛒 <b>Новый заказ #${order.orderNumber}</b>

<b>Товары:</b>
${items}

<b>Клиент:</b>
Имя: ${customer.firstName} ${customer.lastName}
Email: ${customer.email}
Телефон: ${customer.phone}
${customer.company ? 'Компания: ' + customer.company : ''}${address}

<b>Оплата:</b> ${this.getPaymentMethodName(order.paymentMethod)}
<b>Доставка:</b> ${this.getDeliveryMethodName(order.deliveryMethod)}

<b>Сумма:</b>
Товары: ${order.subtotal} ${order.currency}
Доставка: ${order.deliveryCost} ${order.currency}
<b>Итого: ${order.total} ${order.currency}</b>

${order.notes ? `\n<b>Комментарий:</b> ${order.notes}` : ''}
${order.promoCode ? `\n<b>Промокод:</b> ${order.promoCode}` : ''}

Статус: ${this.getStatusName(order.status)}
    `.trim();
  }

  private getPaymentMethodName(method: PaymentMethod): string {
    const names = {
      [PaymentMethod.CASH]: 'Наличные',
      [PaymentMethod.CARD]: 'Карта',
      [PaymentMethod.ONLINE]: 'Онлайн',
      [PaymentMethod.BANK_TRANSFER]: 'Банковский перевод',
    };
    return names[method] || method;
  }

  private getDeliveryMethodName(method: DeliveryMethod): string {
    const names = {
      [DeliveryMethod.PICKUP]: 'Самовывоз',
      [DeliveryMethod.COURIER]: 'Курьер',
      [DeliveryMethod.POST]: 'Почта',
      [DeliveryMethod.EXPRESS]: 'Экспресс доставка',
    };
    return names[method] || method;
  }

  private getStatusName(status: OrderStatus): string {
    const names = {
      [OrderStatus.PENDING]: 'Ожидает обработки',
      [OrderStatus.CONFIRMED]: 'Подтвержден',
      [OrderStatus.PROCESSING]: 'В обработке',
      [OrderStatus.SHIPPED]: 'Отправлен',
      [OrderStatus.DELIVERED]: 'Доставлен',
      [OrderStatus.CANCELLED]: 'Отменен',
      [OrderStatus.REFUNDED]: 'Возвращен',
    };
    return names[status] || status;
  }

  
  async findAll(includeInactive = false): Promise<Order[]> {
    const query = includeInactive ? {} : { status: { $ne: OrderStatus.CANCELLED } };
    return this.orderModel
      .find(query)
      .populate('items.product', 'name slug images')
      .sort({ createdAt: -1 })
      .exec();
  }

  
  async findOne(id: string): Promise<Order> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findById(id)
      .populate('items.product', 'name slug images')
      .exec();

    if (!order) {
      throw new NotFoundException('Order', { id });
    }

    return order;
  }

  
  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderModel
      .findOne({ orderNumber })
      .populate('items.product', 'name slug images')
      .exec();

    if (!order) {
      throw new NotFoundException('Order', { orderNumber });
    }

    return order;
  }

  
  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Order', { id });
    }

    return this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .populate('items.product', 'name slug images')
      .exec();
  }

  
  async remove(id: string): Promise<Order> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Order', { id });
    }

    return this.orderModel.findByIdAndDelete(id).exec();
  }

  
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const [total, orders] = await Promise.all([
      this.orderModel.countDocuments().exec(),
      this.orderModel.find().exec(),
    ]);

    const byStatus: Record<string, number> = {};
    let totalRevenue = 0;

    orders.forEach(order => {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      if (order.isPaid) {
        totalRevenue += order.total;
      }
    });

    const averageOrderValue = total > 0 ? totalRevenue / total : 0;

    return {
      total,
      byStatus,
      totalRevenue,
      averageOrderValue,
    };
  }

  

  
  async getOrCreateCart(sessionId?: string, userId?: string): Promise<CartDocument> {
    const query: any = {};
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    } else if (sessionId) {
      query.sessionId = sessionId;
    } else {
      throw new BadRequestException('Session ID or User ID is required');
    }

    let cart = await this.cartModel.findOne(query).exec();

    if (!cart) {
      cart = new this.cartModel({
        sessionId: sessionId || undefined,
        userId: userId ? new Types.ObjectId(userId) : undefined,
        items: [],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
      });
      await cart.save();
    }

    return cart;
  }

  
  async addToCart(sessionId: string, addToCartDto: AddToCartDto, userId?: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(sessionId, userId);

    
    const product = await this.productModel.findById(addToCartDto.product).exec();
    if (!product) {
      throw new NotFoundException('Product', { id: addToCartDto.product });
    }

    
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === addToCartDto.product && 
              item.variant === addToCartDto.variant
    );

    if (existingItemIndex >= 0) {
      
      cart.items[existingItemIndex].quantity += addToCartDto.quantity;
    } else {
      
      cart.items.push({
        product: new Types.ObjectId(addToCartDto.product),
        quantity: addToCartDto.quantity,
        variant: addToCartDto.variant || undefined,
        attributes: addToCartDto.attributes || {},
      });
    }

    return cart.save();
  }

  
  async updateCartItem(sessionId: string, itemId: string, quantity: number, userId?: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(sessionId, userId);

    const itemIndex = cart.items.findIndex(item => (item as any)._id.toString() === itemId);
    if (itemIndex === -1) {
      throw new NotFoundException('Cart item', { id: itemId });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    return cart.save();
  }

  
  async removeFromCart(sessionId: string, itemId: string, userId?: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(sessionId, userId);

    const itemIndex = cart.items.findIndex(item => (item as any)._id.toString() === itemId);
    if (itemIndex !== -1) {
      cart.items.splice(itemIndex, 1);
    }
    return cart.save();
  }

  
  async clearCart(sessionId: string, userId?: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(sessionId, userId);
    cart.items = [];
    return cart.save();
  }

  
  async getCartWithProducts(sessionId: string, userId?: string): Promise<any> {
    const cart = await this.getOrCreateCart(sessionId, userId);

    const productIds = cart.items.map(item => item.product);
    const products = await this.productModel.find({ _id: { $in: productIds } }).exec();
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const items = cart.items.map((item: any) => {
      const product = productMap.get(item.product.toString());
      return {
        _id: item._id,
        product: product ? {
          id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images && product.images.length > 0 ? product.images[0].url : null,
          price: product.price,
        } : null,
        quantity: item.quantity,
        variant: item.variant,
        attributes: item.attributes,
      };
    });

    const subtotal = items.reduce((sum, item) => {
      if (item.product) {
        return sum + (item.product.price.current * item.quantity);
      }
      return sum;
    }, 0);

    return {
      _id: (cart as any)._id,
      sessionId: cart.sessionId,
      userId: cart.userId,
      items,
      promoCode: cart.promoCode,
      createdAt: (cart as any).createdAt,
      updatedAt: (cart as any).updatedAt,
      expiresAt: cart.expiresAt,
      subtotal,
    };
  }
}

