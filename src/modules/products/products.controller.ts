import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import {
  productImageMemoryStorage,
  productImageDiskStorage,
  productImageFilter,
} from './config/file-upload.config';
import { FileUtil } from '../../common/utils/file.util';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({ summary: 'Создать новый товар (только для админа)' })
  @ApiResponse({ status: 201, description: 'Товар успешно создан' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 409, description: 'Товар с таким slug уже существует' })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':id/variants/:variantIndex/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: productImageMemoryStorage,
      fileFilter: productImageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Загрузить изображение для варианта товара (милитраж)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Изображение варианта загружено' })
  @ApiResponse({ status: 400, description: 'Нет файла или неверный индекс варианта' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async addVariantImage(
    @Param('id') id: string,
    @Param('variantIndex') variantIndexStr: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileData = file?.buffer ?? (file as any)?.buffer;
    if (!fileData || !Buffer.isBuffer(fileData)) {
      throw new BadRequestException('No image file provided. Send multipart/form-data with field "image".');
    }
    const variantIndex = parseInt(variantIndexStr, 10);
    if (isNaN(variantIndex) || variantIndex < 0) {
      throw new BadRequestException('Invalid variant index');
    }
    const product = await this.productsService.findOne(id);
    const variants = product.variants || [];
    if (variantIndex >= variants.length) {
      throw new BadRequestException(`Variant index ${variantIndex} out of range (product has ${variants.length} variants)`);
    }
    const variantPath = path.join('uploads', 'products', id, 'variants', String(variantIndex));
    if (!fs.existsSync(variantPath)) {
      fs.mkdirSync(variantPath, { recursive: true });
    }
    const originalName = file?.originalname ?? (file as any)?.originalname ?? 'image.jpg';
    const fileName = FileUtil.generateFileName(originalName);
    const filePath = path.join(variantPath, fileName);
    fs.writeFileSync(filePath, fileData);
    const imageUrl = `/uploads/products/${id}/variants/${variantIndex}/${fileName}`;
    const toPlain = (v: any, overrideImage?: string) => {
      const o = typeof v?.toObject === 'function' ? v.toObject() : v;
      return {
        name: o?.name ?? {},
        price: o?.price ?? { current: 0, currency: 'UAH' },
        sku: o?.sku ?? undefined,
        stock: o?.stock ?? 0,
        isActive: o?.isActive ?? true,
        image: overrideImage ?? o?.image ?? undefined,
      };
    };
    const updatedVariants = variants.map((v, i) =>
      toPlain(v, i === variantIndex ? imageUrl : undefined),
    );
    return this.productsService.update(id, { variants: updatedVariants } as any);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: productImageMemoryStorage,
      fileFilter: productImageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Добавить изображения к товару (только для админа)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Изображения успешно добавлены' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async addImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const fileList = Array.isArray(files) ? files : [];
    if (fileList.length === 0) {
      throw new BadRequestException('No images provided. Send multipart/form-data with field "images".');
    }
    const product = await this.productsService.findOne(id);
    const existingImages = product.images || [];
    const productPath = path.join('uploads', 'products', id);
    if (!fs.existsSync(productPath)) {
      fs.mkdirSync(productPath, { recursive: true });
    }
    const newImages = [];
    for (let index = 0; index < fileList.length; index++) {
      const file = fileList[index];
      const buffer = file?.buffer ?? (file as any)?.buffer;
      if (!buffer || !Buffer.isBuffer(buffer)) continue;
      const fileName = FileUtil.generateFileName(file.originalname ?? 'image.jpg');
      const filePath = path.join(productPath, fileName);
      fs.writeFileSync(filePath, buffer);
      newImages.push({
        url: `/uploads/products/${id}/${fileName}`,
        alt: null,
        order: existingImages.length + index,
        isMain: existingImages.length === 0 && index === 0,
      });
    }
    if (newImages.length === 0) {
      throw new BadRequestException('No valid image files received');
    }
    const updatedProduct = await this.productsService.update(id, {
      images: [...existingImages, ...newImages],
    } as any);
    return updatedProduct;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id/variants/:variantIndex/image')
  @ApiOperation({ summary: 'Удалить изображение варианта товара' })
  @ApiResponse({ status: 200, description: 'Изображение варианта удалено' })
  @ApiResponse({ status: 400, description: 'Неверный индекс варианта' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async removeVariantImage(
    @Param('id') id: string,
    @Param('variantIndex') variantIndexStr: string,
  ) {
    const variantIndex = parseInt(variantIndexStr, 10);
    if (isNaN(variantIndex) || variantIndex < 0) {
      throw new BadRequestException('Invalid variant index');
    }
    const product = await this.productsService.findOne(id);
    const variants = product.variants || [];
    if (variantIndex >= variants.length) {
      throw new BadRequestException('Variant index out of range');
    }
    const variant = variants[variantIndex];
    const imageUrl = (variant as any).image;
    if (imageUrl && imageUrl.startsWith('/uploads/products/')) {
      const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      const filePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    const updatedVariants = variants.map((v, i) => {
      const plain = (v as any).toObject?.() ?? v;
      return i === variantIndex ? { ...plain, image: null } : plain;
    });
    return this.productsService.update(id, { variants: updatedVariants } as any);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Получить все товары (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные товары',
  })
  @ApiResponse({ status: 200, description: 'Список всех товаров' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.productsService.findAll(include);
  }

  @Public()
  @Get('paginated')
  @ApiOperation({ summary: 'Получить товары с пагинацией (публичный доступ)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество на странице',
    example: 10,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные товары',
  })
  @ApiResponse({ status: 200, description: 'Список товаров с пагинацией' })
  findAllPaginated(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const include = includeInactive === 'true';
    return this.productsService.findAllPaginated(pageNum, limitNum, include);
  }

  @Public()
  @Get('filter')
  @ApiOperation({ summary: 'Получить товары с фильтрацией и пагинацией (публичный доступ)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество элементов на странице', example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Поиск по названию или описанию' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'ID основной категории' })
  @ApiQuery({ name: 'categories', required: false, type: String, description: 'ID дополнительных категорий (через запятую)' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Минимальная цена', example: 0 })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Максимальная цена', example: 10000 })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean, description: 'Только товары в наличии' })
  @ApiQuery({ name: 'isNew', required: false, type: Boolean, description: 'Только новые товары' })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean, description: 'Только рекомендуемые товары' })
  @ApiQuery({ name: 'isOnSale', required: false, type: Boolean, description: 'Только товары со скидкой' })
  @ApiQuery({ 
    name: 'sortBy', 
    required: false, 
    enum: ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'createdAt_asc', 'createdAt_desc', 'views_desc', 'sales_desc', 'order_asc'],
    description: 'Поле для сортировки',
    example: 'order_asc'
  })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Включить неактивные товары' })
  @ApiResponse({ status: 200, description: 'Список товаров с фильтрацией и пагинацией' })
  findWithFilters(@Query() query: any) {
    const filterDto: FilterProductsDto = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search,
      category: query.category,
      categories: query.categories 
        ? (Array.isArray(query.categories) 
            ? query.categories 
            : typeof query.categories === 'string' 
              ? query.categories.split(',').map((id: string) => id.trim())
              : [query.categories])
        : undefined,
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      inStock: query.inStock === 'true' || query.inStock === true,
      isNew: query.isNew === 'true' || query.isNew === true,
      isFeatured: query.isFeatured === 'true' || query.isFeatured === true,
      isOnSale: query.isOnSale === 'true' || query.isOnSale === true,
      sortBy: query.sortBy,
      includeInactive: query.includeInactive === 'true' || query.includeInactive === true,
    };
    return this.productsService.findWithFilters(filterDto);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Поиск товаров (публичный доступ)' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Поисковый запрос',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные товары',
  })
  @ApiResponse({ status: 200, description: 'Результаты поиска' })
  search(
    @Query('q') query: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.productsService.search(query, include);
  }

  @Public()
  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Получить товары по категории (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные товары',
  })
  @ApiResponse({ status: 200, description: 'Список товаров категории' })
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.productsService.findByCategory(categoryId, include);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Получить рекомендуемые товары (публичный доступ)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество товаров',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Список рекомендуемых товаров' })
  findFeatured(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.findFeatured(limitNum);
  }

  @Public()
  @Get('on-sale')
  @ApiOperation({ summary: 'Получить товары со скидкой (публичный доступ)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество товаров',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Список товаров со скидкой' })
  findOnSale(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.findOnSale(limitNum);
  }

  @Public()
  @Get('new')
  @ApiOperation({ summary: 'Получить новые товары (публичный доступ)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество товаров',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Список новых товаров' })
  findNew(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.findNew(limitNum);
  }

  @Public()
  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику по товарам (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Статистика товаров' })
  getStatistics() {
    return this.productsService.getStatistics();
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Получить товар по slug (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Товар найден' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Получить товар по ID (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Товар найден' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @ApiOperation({ summary: 'Обновить товар (только для админа)' })
  @ApiResponse({ status: 200, description: 'Товар обновлен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id/images/:imageIndex')
  @ApiOperation({ summary: 'Удалить изображение товара по индексу (только для админа)' })
  @ApiResponse({ status: 200, description: 'Изображение удалено' })
  @ApiResponse({ status: 400, description: 'Неверный индекс изображения' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар или изображение не найдено' })
  async removeImage(
    @Param('id') id: string,
    @Param('imageIndex') imageIndex: string,
  ) {
    const product = await this.productsService.findOne(id);
    const images = product.images || [];
    const index = parseInt(imageIndex, 10);

    if (isNaN(index) || index < 0 || index >= images.length) {
      throw new BadRequestException('Invalid image index');
    }

    const imageToRemove = images[index];
    const imageUrl = imageToRemove.url;

    
    if (imageUrl && imageUrl.startsWith('/uploads/products/')) {
      
      const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      const filePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    
    const updatedImages = images.filter((_, i) => i !== index);
    
    
    if (imageToRemove.isMain && updatedImages.length > 0) {
      updatedImages[0].isMain = true;
    }

    
    updatedImages.forEach((img, i) => {
      img.order = i;
    });

    
    const updatedProduct = await this.productsService.update(id, {
      images: updatedImages,
    } as any);

    return updatedProduct;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить товар (только для админа)' })
  @ApiResponse({ status: 200, description: 'Товар удален' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async remove(@Param('id') id: string) {
    const product = await this.productsService.remove(id);
    
    
    const productImagePath = path.join('uploads', 'products', id);
    if (fs.existsSync(productImagePath)) {
      fs.rmSync(productImagePath, { recursive: true, force: true });
    }

    return product;
  }
}

