import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, BadRequestException, DefaultValuePipe, ParseIntPipe, ParseFloatPipe, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { Restaurant } from 'src/entities/restaurant.entity';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';
import { AuthGuard } from 'src/auth/auth.guard';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { Logger } from '@nestjs/common';
import { estimateDeliveryTime } from 'src/common/utils/helper';

@Controller('restaurants')
export class RestaurantController {
  private readonly logger = new Logger(RestaurantController.name);
  constructor(private readonly restaurantService: RestaurantService) { }

  // 1. Fixed, exact paths first (no path parameters)
  @Post()
  //@UseGuards(RolesGuard)
  //@Permissions(Permission.RESTAURANT.CREATE)
  async create(@Body() createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    return await this.restaurantService.create(createRestaurantDto);
  }

  @Get('search')
  async searchRestaurants(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('name') name?: string,
    @Query('lat', new DefaultValuePipe(10.7769), ParseFloatPipe) lat: number = 10.7769,
    @Query('lng', new DefaultValuePipe(106.7009), ParseFloatPipe) lng: number = 106.7009,
    @Query('radius', new DefaultValuePipe(5), ParseIntPipe) radius: number = 5
  ) {
    return await this.restaurantService.searchRestaurants({ page, pageSize, name, lat, lng, radius });
  }

  @Post('request')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'backgroundImage', maxCount: 1 },
      { name: 'certificateImage', maxCount: 1 },
    ])
  )
  async requestRestaurantWithFiles(
    @Body() createDto: any,
    @UploadedFiles() files: {
      avatar?: Express.Multer.File[],
      backgroundImage?: Express.Multer.File[],
      certificateImage?: Express.Multer.File[],
    }
  ): Promise<Restaurant> {
    // Extract restaurant data
    const restaurantData: CreateRestaurantDto = {
      name: createDto.name,
      description: createDto.description,
      phoneNumber: createDto.phoneNumber,
      openTime: createDto.openTime,
      closeTime: createDto.closeTime,
      licenseCode: createDto.licenseCode,
      ownerId: createDto.ownerId,
      latitude: createDto.latitude,
      longitude: createDto.longitude
    };

    // Extract address data based on what's provided
    let addressData: {
      street: string;
      ward: string;
      district: string;
      city: string;
    };

    // Check if we have a full address from Mapbox
    if (createDto.address) {
      // Parse the address into components - assuming format like "street, ward, district, city"
      const addressParts = createDto.address.split(',').map(part => part.trim());

      addressData = {
        // Use as many parts as available, with fallbacks
        street: addressParts[0] || 'Unknown street',
        ward: addressParts[1] || 'Unknown ward',
        district: addressParts[2] || 'Unknown district',
        city: addressParts[3] || 'Unknown city'
      };
    } else {
      // Use the individual fields if provided
      addressData = {
        street: createDto.addressStreet || 'Unknown street',
        ward: createDto.addressWard || 'Unknown ward',
        district: createDto.addressDistrict || 'Unknown district',
        city: createDto.addressCity || 'Unknown city'
      };
    }

    return await this.restaurantService.requestRestaurantWithFiles(
      restaurantData,
      addressData,
      files.avatar?.[0],
      files.backgroundImage?.[0],
      files.certificateImage?.[0]
    );
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('status') status?: string // 👈 THÊM DÒNG NÀY

  ) {
    return await this.restaurantService.findAll(page, pageSize, status, lat, lng);
  }

  @Get('popular')
  async getPopularRestaurants(@Query('lat') lat?: number, @Query('lng') lng?: number) {
    // Get top 3 restaurants
    const { items } = await this.restaurantService.getTopRestaurants(1, 3, lat, lng);

    // For each restaurant, get 3 foods
    const itemsWithFoods = await Promise.all(
      items.map(async (restaurant) => {
        const foods = await this.restaurantService.getFoodsByRestaurantId(restaurant.id, 1, 3);
        return { ...restaurant, foods };
      })
    );

    return { items: itemsWithFoods };
  }

  @Get('preview')
  async getPreview(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.restaurantService.getPreview(page, pageSize, lat, lng);
  }

  @Get('requests')
  async getRestaurantRequests(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return await this.restaurantService.getRestaurantRequests(page, pageSize, lat, lng);
  }

  @Get('my')
  @UseGuards(AuthGuard)
  async getMyRestaurant(@Req() req: any, @Query('lat') lat?: number, @Query('lng') lng?: number) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new BadRequestException('ownerId is required');
    }
    const restaurant = await this.restaurantService.findByOwnerId(ownerId, lat, lng);
    if (!restaurant) {
      throw new BadRequestException('No restaurant found for this owner');
    }
    return restaurant;
  }


  // 2. Routes with specific ID patterns that include additional path segments
  @Put(':id/approve')
  //@UseGuards(RolesGuard)
  //@Permissions(Permission.RESTAURANT.APPROVE)
  async approveRestaurant(@Param('id') id: string): Promise<Restaurant> {
    return await this.restaurantService.approveRestaurant(id);
  }

  @Put(':id/reject')
  //@UseGuards(RolesGuard)
  //@Permissions(Permission.RESTAURANT.APPROVE)
  async rejectRestaurant(@Param('id') id: string): Promise<Restaurant> {
    return await this.restaurantService.rejectRestaurant(id);
  }

  @Delete('requests/:id')
  //@UseGuards(RolesGuard)
  //@Permissions(Permission.RESTAURANT.DELETE)
  async deleteRestaurantRequest(@Param('id') id: string): Promise<void> {
    return await this.restaurantService.deleteRestaurantRequest(id);
  }

  @Put(':id/files')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'backgroundImage', maxCount: 1 },
      { name: 'certificateImage', maxCount: 1 },
    ], {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
      }
    })
  )
  async updateWithFiles(
    @Param('id') id: string,
    @Body() updateDto: any,
    @UploadedFiles() files: {
      avatar?: Express.Multer.File[],
      backgroundImage?: Express.Multer.File[],
      certificateImage?: Express.Multer.File[],
    }
  ): Promise<Restaurant> {
    this.logger.log(`Updating restaurant ${id} with data: ${JSON.stringify(updateDto)} and files: ${Object.keys(files).join(', ')}`);
    // Map only allowed fields to UpdateRestaurantDto
    const restaurantData: UpdateRestaurantDto = {
      name: updateDto.name,
      description: updateDto.description,
      phoneNumber: updateDto.phoneNumber,
      openTime: updateDto.openTime,
      closeTime: updateDto.closeTime,
      licenseCode: updateDto.licenseCode,
      latitude: updateDto.latitude,
      longitude: updateDto.longitude,
      avatar: updateDto.avatar,
      backgroundImage: updateDto.backgroundImage,
      certificateImage: updateDto.certificateImage,
      address: updateDto.address,
      addressStreet: updateDto.addressStreet,
      addressWard: updateDto.addressWard,
      addressDistrict: updateDto.addressDistrict,
      addressCity: updateDto.addressCity,
      status: updateDto.status,
      // ownerId is not needed for update, so do not map it here
    };


    const avatarFile = files?.avatar?.[0];
    const backgroundFile = files?.backgroundImage?.[0];
    const certificateFile = files?.certificateImage?.[0];

    return await this.restaurantService.updateWithFiles(
      id,
      restaurantData,
      avatarFile,
      backgroundFile,
      certificateFile
    );
  }

  // 3. Generic ID routes last (these are the most permissive)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number
  ) {
    return await this.restaurantService.findOne(id, lat, lng);
  }

  @Put(':id')
  //@UseGuards(RolesGuard)
  //@Permissions(Permission.RESTAURANT.WRITE)
  async update(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    return await this.restaurantService.update(id, updateRestaurantDto);
  }

  @Delete(':id')
  //@UseGuards(RolesGuard)
  //@Permissions(Permission.RESTAURANT.DELETE)
  async remove(@Param('id') id: string): Promise<void> {
    return await this.restaurantService.remove(id);
  }

  @Get('my/order-count-by-month')
  @UseGuards(AuthGuard)
  async getMyOrderCountByMonth(
    @Req() req: any,
    @Query('month') month?: string // format: YYYY-MM
  ) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Not authenticated');
    return this.restaurantService.getOrderCountByOwner(userId, month);
  }

  @Get('my/revenue-by-month')
  @UseGuards(AuthGuard)
  async getMyRevenueByMonth(
    @Req() req: any,
    @Query('month') month?: string // format: YYYY-MM
  ) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Not authenticated');
    return this.restaurantService.getRevenueByOwner(userId, month);
  }
}