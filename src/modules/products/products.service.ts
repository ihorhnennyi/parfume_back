import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto, SortField } from './dto/filter-products.dto';
import { SlugUtil } from '../../common/utils/slug.util';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '../../common/exceptions';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  
  async create(createProductDto: CreateProductDto): Promise<Product> {
    
    let slug = createProductDto.slug;
    if (!slug) {
      slug = SlugUtil.generate(createProductDto.name);
    }

    
    const existingProduct = await this.productModel.findOne({ slug }).exec();
    if (existingProduct) {
      let counter = 1;
      const baseSlug = slug;
      while (await this.productModel.findOne({ slug }).exec()) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    
    let category = null;
    if (createProductDto.category && Types.ObjectId.isValid(createProductDto.category)) {
      category = new Types.ObjectId(createProductDto.category);
    }
    
    const categories = [];
    if (createProductDto.categories && Array.isArray(createProductDto.categories)) {
      createProductDto.categories.forEach((id) => {
        if (id && Types.ObjectId.isValid(id)) {
          categories.push(new Types.ObjectId(id));
        }
      });
    }

    
    const productData: any = {
      name: createProductDto.name,
      slug,
      description: createProductDto.description || null,
      shortDescription: createProductDto.shortDescription || null,
      category,
      categories,
      price: createProductDto.price,
      variants: createProductDto.variants && Array.isArray(createProductDto.variants) 
        ? createProductDto.variants 
        : [],
      attributes: createProductDto.attributes && Array.isArray(createProductDto.attributes) 
        ? createProductDto.attributes 
        : [],
      sku: createProductDto.sku || null,
      stock: createProductDto.stock ?? 0,
      order: createProductDto.order ?? 0,
      isActive: createProductDto.isActive ?? true,
      isNew: createProductDto.isNew ?? false,
      isFeatured: createProductDto.isFeatured ?? false,
      isOnSale: createProductDto.isOnSale ?? false,
      metaTitle: createProductDto.metaTitle || null,
      metaDescription: createProductDto.metaDescription || null,
      metaKeywords: createProductDto.metaKeywords || null,
      customFields: createProductDto.customFields || {},
    };

    const product = new this.productModel(productData);

    return product.save();
  }

  
  async findAll(includeInactive = false): Promise<Product[]> {
    const query = includeInactive ? {} : { isActive: true };
    return this.productModel
      .find(query)
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .sort({ order: 1, createdAt: -1 })
      .exec();
  }

  
  async findAllPaginated(
    page = 1,
    limit = 10,
    includeInactive = false,
  ): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = includeInactive ? {} : { isActive: true };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('category', 'name slug')
        .populate('categories', 'name slug')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWithFilters(filterDto: FilterProductsDto): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      categories,
      minPrice,
      maxPrice,
      inStock,
      isNew,
      isFeatured,
      isOnSale,
      sortBy = SortField.ORDER_ASC,
      includeInactive = false,
    } = filterDto;

    const query: any = {};

    if (!includeInactive) {
      query.isActive = true;
    }

    if (search) {
      query.$or = [
        { 'name.ua': { $regex: search, $options: 'i' } },
        { 'name.ru': { $regex: search, $options: 'i' } },
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'description.ua': { $regex: search, $options: 'i' } },
        { 'description.ru': { $regex: search, $options: 'i' } },
        { 'description.en': { $regex: search, $options: 'i' } },
        { 'shortDescription.ua': { $regex: search, $options: 'i' } },
        { 'shortDescription.ru': { $regex: search, $options: 'i' } },
        { 'shortDescription.en': { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const categoryConditions: any[] = [];

    if (category && Types.ObjectId.isValid(category)) {
      const categoryId = new Types.ObjectId(category);
      categoryConditions.push(
        { category: categoryId },
        { categories: categoryId },
      );
    }

    if (categories && Array.isArray(categories) && categories.length > 0) {
      const validCategoryIds = categories
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
      
      if (validCategoryIds.length > 0) {
        categoryConditions.push(
          { category: { $in: validCategoryIds } },
          { categories: { $in: validCategoryIds } },
        );
      }
    }

    if (categoryConditions.length > 0) {
      if (query.$or && Array.isArray(query.$or) && query.$or.length > 0) {
        const searchConditions = query.$or;
        query.$and = [
          { $or: searchConditions },
          { $or: categoryConditions },
        ];
        delete query.$or;
      } else {
        query.$or = categoryConditions;
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query['price.current'] = {};
      if (minPrice !== undefined) {
        query['price.current'].$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        query['price.current'].$lte = maxPrice;
      }
    }

    if (inStock === true) {
      query.stock = { $gt: 0 };
    }

    if (isNew === true) {
      query.isNew = true;
    }

    if (isFeatured === true) {
      query.isFeatured = true;
    }

    if (isOnSale === true) {
      query.isOnSale = true;
    }

    const sortOptions: any = {};
    switch (sortBy) {
      case SortField.PRICE_ASC:
        sortOptions['price.current'] = 1;
        break;
      case SortField.PRICE_DESC:
        sortOptions['price.current'] = -1;
        break;
      case SortField.NAME_ASC:
        sortOptions.name = 1;
        break;
      case SortField.NAME_DESC:
        sortOptions.name = -1;
        break;
      case SortField.CREATED_AT_ASC:
        sortOptions.createdAt = 1;
        break;
      case SortField.CREATED_AT_DESC:
        sortOptions.createdAt = -1;
        break;
      case SortField.VIEWS_DESC:
        sortOptions.views = -1;
        break;
      case SortField.SALES_DESC:
        sortOptions.sales = -1;
        break;
      case SortField.ORDER_ASC:
      default:
        sortOptions.order = 1;
        sortOptions.createdAt = -1;
        break;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('category', 'name slug')
        .populate('categories', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  
  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel
      .findById(id)
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException('Product', { id });
    }

    
    await this.productModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

    return product;
  }

  
  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ slug })
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException('Product', { slug });
    }

    
    await this.productModel
      .findOneAndUpdate({ slug }, { $inc: { views: 1 } })
      .exec();

    return product;
  }

  
  async search(query: string, includeInactive = false): Promise<Product[]> {
    const searchQuery = includeInactive
      ? { $text: { $search: query } }
      : { $text: { $search: query }, isActive: true };

    return this.productModel
      .find(searchQuery, { score: { $meta: 'textScore' } })
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .sort({ score: { $meta: 'textScore' } })
      .exec();
  }

  
  async findByCategory(
    categoryId: string,
    includeInactive = false,
  ): Promise<Product[]> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const query = includeInactive
      ? {
          $or: [
            { category: new Types.ObjectId(categoryId) },
            { categories: new Types.ObjectId(categoryId) },
          ],
        }
      : {
          isActive: true,
          $or: [
            { category: new Types.ObjectId(categoryId) },
            { categories: new Types.ObjectId(categoryId) },
          ],
        };

    return this.productModel
      .find(query)
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .sort({ order: 1, createdAt: -1 })
      .exec();
  }

  
  async findFeatured(limit = 10): Promise<Product[]> {
    return this.productModel
      .find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .sort({ order: 1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  
  async findOnSale(limit = 10): Promise<Product[]> {
    return this.productModel
      .find({ isOnSale: true, isActive: true })
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .sort({ order: 1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  
  async findNew(limit = 10): Promise<Product[]> {
    return this.productModel
      .find({ isNew: true, isActive: true })
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product', { id });
    }

    
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existingProduct = await this.productModel
        .findOne({ slug: updateProductDto.slug })
        .exec();
      if (existingProduct) {
        throw new ConflictException('Product with this slug already exists');
      }
    }

    
    const updateData: any = { ...updateProductDto };
    
    if (updateData.category !== undefined) {
      if (updateData.category && Types.ObjectId.isValid(updateData.category)) {
        updateData.category = new Types.ObjectId(updateData.category);
      } else {
        updateData.category = null;
      }
    }
    if (updateData.categories !== undefined) {
      const validCategories = [];
      if (Array.isArray(updateData.categories)) {
        updateData.categories.forEach((catId: string) => {
          if (catId && Types.ObjectId.isValid(catId)) {
            validCategories.push(new Types.ObjectId(catId));
          }
        });
      }
      updateData.categories = validCategories;
    }

    return this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .exec();
  }

  
  async remove(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product', { id });
    }

    return this.productModel.findByIdAndDelete(id).exec();
  }

  
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    featured: number;
    onSale: number;
    new: number;
  }> {
    const [total, active, inactive, featured, onSale, newProducts] =
      await Promise.all([
        this.productModel.countDocuments().exec(),
        this.productModel.countDocuments({ isActive: true }).exec(),
        this.productModel.countDocuments({ isActive: false }).exec(),
        this.productModel.countDocuments({ isFeatured: true }).exec(),
        this.productModel.countDocuments({ isOnSale: true }).exec(),
        this.productModel.countDocuments({ isNew: true }).exec(),
      ]);

    return {
      total,
      active,
      inactive,
      featured,
      onSale,
      new: newProducts,
    };
  }
}

