import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, BadRequestException, DefaultValuePipe, ParseIntPipe, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { Restaurant } from 'src/entities/restaurant.entity';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // 1. Fixed, exact paths first (no path parameters)
  @Post()
  //@UseGuards(RolesGuard)
  //@Permissions(Permission.RESTAURANT.CREATE)
  async create(@Body() createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    return await this.restaurantService.create(createRestaurantDto);
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
  ) {
    return await this.restaurantService.findAllApproved(page, pageSize);
  }

  @Get('all')
  //@UseGuards(RolesGuard)
  //@Permissions(Permission.RESTAURANT.READ)
  async findAllIncludingPending(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return await this.restaurantService.findAll(page, pageSize);
  }

  @Get('preview')
  async getPreview(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return await this.restaurantService.getPreview(page, pageSize);
  }

  @Get('requests')
  //@UseGuards(RolesGuard)
  //@Permissions(Permission.RESTAURANT.READ)
  async getRestaurantRequests(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return await this.restaurantService.getRestaurantRequests(page, pageSize);
  }

  @Get('my')
  @UseGuards(AuthGuard)
  async getMyRestaurant(@Req() req: any): Promise<Restaurant> {
    const ownerId = req.user.id; // Assuming the user ID is in the request object
    if (!ownerId) {
      throw new BadRequestException('ownerId is required');
    }
    const restaurant = await this.restaurantService.findByOwnerId(ownerId);
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
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @UploadedFiles() files: {
      avatar?: Express.Multer.File[],
      backgroundImage?: Express.Multer.File[],
      certificateImage?: Express.Multer.File[],
    }
  ): Promise<Restaurant> {
    const avatarFile = files?.avatar?.[0];
    const backgroundFile = files?.backgroundImage?.[0];
    const certificateFile = files?.certificateImage?.[0];
    
    return await this.restaurantService.updateWithFiles(
      id,
      updateRestaurantDto,
      avatarFile,
      backgroundFile,
      certificateFile
    );
  }

  // 3. Generic ID routes last (these are the most permissive)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Restaurant> {
    return await this.restaurantService.findOne(id);
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
}