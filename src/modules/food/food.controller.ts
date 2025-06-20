import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  UnauthorizedException,
  Req,
  ParseFloatPipe,
  BadRequestException
} from '@nestjs/common';
import { FoodService } from './food.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { Food } from 'src/entities/food.entity';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';
import { AuthGuard } from 'src/auth/auth.guard';
import { plainToInstance } from 'class-transformer';

@Controller('foods')
export class FoodController {
  constructor(private readonly foodService: FoodService) { }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createFoodDto: CreateFoodDto, @Req() req: any): Promise<Food> {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    // Clean up empty string UUIDs
    const cleanedDto = {
      ...createFoodDto,
      categoryId: createFoodDto.categoryId === "" ? undefined : createFoodDto.categoryId,
    };
    const dto = plainToInstance(CreateFoodDto, cleanedDto);
    return await this.foodService.createIfOwner(dto, userId);
  }

@Get('all')
@UseGuards(RolesGuard)
@Permissions(Permission.FOOD.READ)
async findAllForStore(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number, // Add limit param
  @Query('search') search?: string, // Add search param
  @Query('restaurantId') restaurantId?: string,
  @Query('categoryId') categoryId?: string,
  @Query('lat') lat?: number,
  @Query('lng') lng?: number,
) {
  console.log('=== findAllForStore Debug ===');
  console.log('Query parameters:', {
    page,
    pageSize,
    limit,
    search,
    restaurantId,
    categoryId,
    lat,
    lng
  });

  // Use limit if provided, otherwise use pageSize
  const actualPageSize = limit || pageSize;

  // Normalize parameters - treat empty strings and 'all' as undefined
  const normalizedRestaurantId = restaurantId && restaurantId !== 'all' && restaurantId.trim() !== '' 
    ? restaurantId : undefined;
  const normalizedCategoryId = categoryId && categoryId !== 'all' && categoryId.trim() !== '' 
    ? categoryId : undefined;
  const normalizedSearch = search && search.trim() !== '' ? search.trim() : undefined;

  console.log('Normalized parameters:', {
    normalizedRestaurantId,
    normalizedCategoryId,
    normalizedSearch,
    actualPageSize
  });

  const latitude = lat ? Number(lat) : undefined;
  const longitude = lng ? Number(lng) : undefined;

  // If search is provided, use search functionality
  if (normalizedSearch) {
    console.log('Using search functionality');
    return await this.foodService.searchFoodsForStore(
      normalizedSearch,
      page,
      actualPageSize,
      latitude,
      longitude,
      normalizedRestaurantId,
      normalizedCategoryId
    );
  }

  // Route to appropriate service method based on filters
  if (normalizedRestaurantId && normalizedCategoryId) {
    // Both restaurant and category filters
    console.log('Filtering by restaurant AND category');
    return await this.foodService.findByRestaurantAndCategory(
      normalizedRestaurantId,
      normalizedCategoryId,
      page,
      actualPageSize,
      latitude,
      longitude
    );
  } else if (normalizedRestaurantId) {
    // Restaurant filter only
    console.log('Filtering by restaurant only');
    return await this.foodService.findByRestaurant(
      normalizedRestaurantId,
      page,
      actualPageSize,
      latitude,
      longitude
    );
  } else if (normalizedCategoryId) {
    // Category filter only
    console.log('Filtering by category only');
    return await this.foodService.findByCategory(
      normalizedCategoryId,
      page,
      actualPageSize,
      latitude,
      longitude
    );
  } else {
    // No filters - get all foods
    console.log('No filters - getting all foods');
    return await this.foodService.findAll(
      page,
      actualPageSize,
      latitude,
      longitude
    );
  }
}

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.foodService.findAll(page, pageSize, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Get('top-selling')
  async findTopSelling(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.foodService.findTopSelling(page, pageSize, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Get('newest')
  async findNewest(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.foodService.findNewest(page, pageSize, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Get('with-discount')
  async findWithDiscount(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.foodService.findWithDiscount(page, pageSize, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Get('search')
  async searchFoods(
    @Query('query') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat', new DefaultValuePipe(10.7769), ParseFloatPipe) lat: number = 10.7769, // HCM default
    @Query('lng', new DefaultValuePipe(106.7009), ParseFloatPipe) lng: number = 106.7009,
    @Query('radius', new DefaultValuePipe(5), ParseIntPipe) radius: number = 5 // km
  ) {
    return await this.foodService.searchFoods(query, page, pageSize, lat, lng, 99999);
  }

  @Get('by-name')
  async findByName(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat', new DefaultValuePipe(10.7769), ParseFloatPipe) lat: number = 10.7769, // HCM default
    @Query('lng', new DefaultValuePipe(106.7009), ParseFloatPipe) lng: number = 106.7009,
    @Query('radius', new DefaultValuePipe(5), ParseIntPipe) radius: number = 5, // km
    @Query('name') name?: string, // Made optional
    @Query('categoryIds') categoryIds?: string, // comma-separated string
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    console.log('=== Controller findByName ===');
    console.log('Raw query parameters received:', {
      name,
      page,
      pageSize,
      lat,
      lng,
      radius,
      categoryIds,
      minPrice,
      maxPrice
    });

    // Parse categoryIds to array if provided
    let categoryIdList: string[] | undefined = undefined;
    if (categoryIds) {
      categoryIdList = categoryIds.split(',').map(id => id.trim()).filter(Boolean);
      console.log('Parsed categoryIds:', categoryIdList);
    }
    if (name && name.trim() === '') {
      name = undefined; // Treat empty name as undefined
    }

    console.log('Calling service with parameters:', {
      name,
      page,
      pageSize,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      radius,
      categoryIdList,
      minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
    });

    const result = await this.foodService.findByName(
      name, // Pass undefined if not provided
      page,
      pageSize,
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
      radius,
      categoryIdList,
      minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice !== undefined ? Number(maxPrice) : undefined,
    );

    console.log('Service returned:', {
      totalItems: result.totalItems,
      itemsCount: result.items.length,
      page: result.page,
      totalPages: result.totalPages
    });
    console.log('=== End Controller findByName ===');

    return result;
  }
  @Get('top')
  async getTopFoodsByRestaurant(
    @Query('restaurantId') restaurantId: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    if (!restaurantId) {
      throw new UnauthorizedException('restaurantId is required');
    }
    return await this.foodService.getTopFoodsByRestaurant(restaurantId, limit);
  }
  @Get('restaurant/:restaurantId')
  async findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.foodService.findByRestaurant(restaurantId, page, pageSize, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Get('restaurant/:restaurantId/top-selling')
  async findTopSellingByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.foodService.findTopSellingByRestaurant(restaurantId, page, pageSize, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Get('restaurant/:restaurantId/with-discount')
  async findWithDiscountByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.foodService.findWithDiscountByRestaurant(restaurantId, page, pageSize, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Get('category/:categoryId')
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.foodService.findByCategory(categoryId, page, pageSize, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Get('category/:categoryId/restaurant/:restaurantId')
  async findByCategoryAndRestaurant(
    @Param('categoryId') categoryId: string,
    @Param('restaurantId') restaurantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.foodService.findByCategoryAndRestaurant(
      categoryId,
      restaurantId,
      page,
      pageSize,
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.foodService.findOne(id, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() updateFoodDto: UpdateFoodDto, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    // Convert to DTO instance for validation and transformation
    const dto = plainToInstance(UpdateFoodDto, updateFoodDto);
    return await this.foodService.updateIfOwner(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return await this.foodService.removeIfOwner(id, userId);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    if (status !== 'available' && status !== 'hidden') {
      throw new BadRequestException('Status must be either "available" or "hidden"');
    }
      return await this.foodService.updateStatusIfOwner(id, status, userId);
  }

  @Get(':id/reviews')
  async getReviewsByFood(
    @Param('id') foodId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe('DESC')) sortOrder: 'ASC' | 'DESC',
    @Query('minRating') minRating?: number,
    @Query('maxRating') maxRating?: number,
  ) {
    console.log('=== Controller getReviewsByFood ===');
    console.log('Request parameters:', {
      foodId,
      page,
      pageSize,
      sortBy,
      sortOrder,
      minRating,
      maxRating
    });

    const result = await this.foodService.getReviewsByFood(
      foodId,
      page,
      pageSize,
      sortBy,
      sortOrder,
      minRating ? Number(minRating) : undefined,
      maxRating ? Number(maxRating) : undefined,
    );

    console.log('Service returned:', {
      totalItems: result.totalItems,
      itemsCount: result.items.length,
      page: result.page,
      totalPages: result.totalPages
    });
    console.log('=== End Controller getReviewsByFood ===');

    return result;
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Permissions(Permission.FOOD.DELETE)
  async deleteFood(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return await this.foodService.delete(id);
  }

}