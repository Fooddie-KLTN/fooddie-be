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
    UseGuards
  } from '@nestjs/common';
  import { FoodService } from './food.service';
  import { CreateFoodDto } from './dto/create-food.dto';
  import { UpdateFoodDto } from './dto/update-food.dto';
  import { Food } from 'src/entities/food.entity';
  import { RolesGuard } from 'src/common/guard/role.guard';
  import { Permissions } from 'src/common/decorator/permissions.decorator';
  import { Permission } from 'src/constants/permission.enum';
  
  @Controller('foods')
  export class FoodController {
    constructor(private readonly foodService: FoodService) {}
  
    @Post()
    async create(@Body() createFoodDto: CreateFoodDto): Promise<Food> {
      return await this.foodService.create(createFoodDto);
    }
  
    @Get()
    async findAll(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
      return await this.foodService.findAll(page, pageSize);
    }
  
    @Get('top-selling')
    async findTopSelling(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
      return await this.foodService.findTopSelling(page, pageSize);
    }
  
    @Get('newest')
    async findNewest(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
      return await this.foodService.findNewest(page, pageSize);
    }
  
    @Get('with-discount')
    async findWithDiscount(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
      return await this.foodService.findWithDiscount(page, pageSize);
    }
  
    @Get('search')
    async searchFoods(
      @Query('query') query: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
      return await this.foodService.searchFoods(query, page, pageSize);
    }
  
    @Get('restaurant/:restaurantId')
    async findByRestaurant(
      @Param('restaurantId') restaurantId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
      return await this.foodService.findByRestaurant(restaurantId, page, pageSize);
    }
  
    @Get('restaurant/:restaurantId/top-selling')
    async findTopSellingByRestaurant(
      @Param('restaurantId') restaurantId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
      return await this.foodService.findTopSellingByRestaurant(restaurantId, page, pageSize);
    }
  
    @Get('restaurant/:restaurantId/with-discount')
    async findWithDiscountByRestaurant(
      @Param('restaurantId') restaurantId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
      return await this.foodService.findWithDiscountByRestaurant(restaurantId, page, pageSize);
    }
  
    @Get('category/:categoryId')
    async findByCategory(
      @Param('categoryId') categoryId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
      return await this.foodService.findByCategory(categoryId, page, pageSize);
    }
  
    @Get('category/:categoryId/restaurant/:restaurantId')
    async findByCategoryAndRestaurant(
      @Param('categoryId') categoryId: string,
      @Param('restaurantId') restaurantId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
      return await this.foodService.findByCategoryAndRestaurant(
        categoryId,
        restaurantId,
        page,
        pageSize,
      );
    }
  
    @Get(':id')
    async findOne(@Param('id') id: string) {
      return await this.foodService.findOne(id);
    }
  
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateFoodDto: UpdateFoodDto) {
      return await this.foodService.update(id, updateFoodDto);
    }
  
    @Delete(':id')
    async remove(@Param('id') id: string) {
      return await this.foodService.remove(id);
    }
  }