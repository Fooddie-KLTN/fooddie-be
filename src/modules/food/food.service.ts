import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Food } from 'src/entities/food.entity';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { Restaurant } from 'src/entities/restaurant.entity';
import { Category } from 'src/entities/category.entity';
import { Review } from 'src/entities/review.entity'; // Add this import
import { GoogleCloudStorageService } from 'src/gcs/gcs.service';
import { haversineDistance } from 'src/common/utils/helper';
import { log } from 'console';

@Injectable()
export class FoodService {
    constructor(
        @InjectRepository(Food)
        private foodRepository: Repository<Food>,
        @InjectRepository(Restaurant)
        private restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(Review) // Add this injection
        private reviewRepository: Repository<Review>,
        private readonly gcsService: GoogleCloudStorageService,
    ) { }
/**
     * Get top foods by sold count for a restaurant
     */
    async getTopFoodsByRestaurant(restaurantId: string, limit = 5): Promise<any[]> {
        const foods = await this.foodRepository.find({
            where: { 
                restaurant: { id: restaurantId },
                status: 'available' // Add status filter
            },
            order: { soldCount: 'DESC' },
            take: limit,
        });

        // Optionally, calculate revenue for each food
        return foods.map(food => ({
            id: food.id,
            name: food.name,
            image: food.image,
            soldCount: food.soldCount,
            revenue: food.soldCount * food.price,
        }));
    }
    /**
     * Create a new food item
     * 
     * @param createFoodDto The food data to create
     * @returns The created food
     */
    async create(createFoodDto: CreateFoodDto): Promise<Food> {
        try {
            // Validate restaurant exists
            const restaurant = await this.restaurantRepository.findOne({
                where: { id: createFoodDto.restaurantId }
            });

            if (!restaurant) {
                throw new BadRequestException(`Restaurant with ID ${createFoodDto.restaurantId} not found`);
            }

            let category: Category | undefined = undefined;
            if (createFoodDto.categoryId) {
                const foundCategory = await this.categoryRepository.findOne({
                    where: { id: createFoodDto.categoryId }
                });
                if (!foundCategory) {
                    throw new BadRequestException(`Category with ID ${createFoodDto.categoryId} not found`);
                }
                category = foundCategory;
            }

            // Create a new Food entity with proper type conversions
            const food = new Food();
            food.name = createFoodDto.name;
            food.description = createFoodDto.description || "";
            food.price = createFoodDto.price ? parseFloat(createFoodDto.price) : 0;
            food.image = createFoodDto.image || "";
            food.discountPercent = createFoodDto.discountPercent ? parseFloat(createFoodDto.discountPercent) : 0;
            food.status = createFoodDto.status || 'available';
            food.purchasedNumber = createFoodDto.purchasedNumber ? parseInt(createFoodDto.purchasedNumber, 10) : 0;
            food.soldCount = 0;
            food.rating = 0;
            food.imageUrls = [];
            food.tag = "";
            food.preparationTime = createFoodDto.preparationTime ? parseInt(createFoodDto.preparationTime, 10) : 0;
            food.restaurant = restaurant;

            // Only assign category if it exists
            if (category) {
                food.category = category;
            }

            // Save the entity
            const savedFood = await this.foodRepository.save(food);
            return savedFood;

        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            console.error('Food creation error:', error);
            throw new BadRequestException(
                `Failed to create food: ${error.message || 'Unknown error'}`
            );
        }
    }

    async createIfOwner(createFoodDto: CreateFoodDto, userId: string): Promise<Food> {
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: createFoodDto.restaurantId },
            relations: ['owner'],
        });
        if (!restaurant) throw new BadRequestException('Restaurant not found');
        if (restaurant.owner.id !== userId) {
            throw new UnauthorizedException('You are not the owner of this restaurant');
        }
        return this.create(createFoodDto);
    }

    /**
     * Get all foods with pagination
     * 
     * @param page The page number
     * @param pageSize The number of items per page
     * @param lat Latitude for distance calculation
     * @param lng Longitude for distance calculation
     * @param status Status filter (available, hidden, etc.)
     * @returns List of all foods with pagination metadata
     */
    async findAll(page = 1, pageSize = 10, lat?: number, lng?: number, status?: string): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const queryBuilder = this.foodRepository.createQueryBuilder('food')
            .leftJoinAndSelect('food.restaurant', 'restaurant')
            .leftJoinAndSelect('food.category', 'category');

        // Add status filter if provided
        if (status) {
            queryBuilder.where('food.status = :status', { status });
        }

        queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [items, totalItems] = await queryBuilder.getManyAndCount();

        const itemsWithDistance = items.map(food => {
            let distance: number | null = null;
            if (lat && lng && food.restaurant?.latitude && food.restaurant?.longitude) {
                distance = haversineDistance(
                    lat,
                    lng,
                    Number(food.restaurant.latitude),
                    Number(food.restaurant.longitude)
                );
            }
            return { ...food, distance };
        });

        return {
            items: itemsWithDistance,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }
/**
 * Search foods for store/admin with additional filtering options
 */
async searchFoodsForStore(
  query: string,
  page = 1,
  pageSize = 10,
  lat?: number,
  lng?: number,
  restaurantId?: string,
  categoryId?: string,
  radius = 99999 // Large radius for admin search
): Promise<{
  items: any[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  console.log('=== searchFoodsForStore Debug ===');
  console.log('Input parameters:', {
    query,
    page,
    pageSize,
    lat,
    lng,
    restaurantId,
    categoryId,
    radius
  });

  const queryBuilder = this.foodRepository.createQueryBuilder('food')
    .leftJoinAndSelect('food.restaurant', 'restaurant')
    .leftJoinAndSelect('food.category', 'category')
  // Add search condition
  if (query && query.trim()) {
    queryBuilder.where('food.name ILIKE :query OR food.description ILIKE :query', { 
      query: `%${query.trim()}%` 
    });
    console.log('Added search filter for:', query.trim());
  }

  // Add restaurant filter if provided
  if (restaurantId) {
    const whereMethod = query && query.trim() ? 'andWhere' : 'where';
    queryBuilder[whereMethod]('food.restaurant_id = :restaurantId', { restaurantId });
    console.log('Added restaurant filter:', restaurantId);
  }

  // Add category filter if provided
  if (categoryId) {
    const whereMethod = (query && query.trim()) || restaurantId ? 'andWhere' : 'where';
    queryBuilder[whereMethod]('food.category_id = :categoryId', { categoryId });
    console.log('Added category filter:', categoryId);
  }

  console.log('Query SQL:', queryBuilder.getQuery());
  console.log('Query parameters:', queryBuilder.getParameters());

  // Get all matching items first
  let items = await queryBuilder.getMany();
  console.log('Raw items found:', items.length);

  if (items.length > 0) {
    console.log('First item example:', {
      id: items[0].id,
      name: items[0].name,
      restaurant: items[0].restaurant?.name,
      category: items[0].category?.name
    });
  }

  // Add distance and apply location filtering if coordinates provided
  if (lat && lng) {
    console.log('Applying distance filtering...');
    const beforeFilter = items.length;
    
    items = items
      .filter(f => f.restaurant?.latitude && f.restaurant?.longitude)
      .map(f => ({
        ...f,
        distance: haversineDistance(lat, lng, Number(f.restaurant.latitude), Number(f.restaurant.longitude))
      }))
      .filter(f => f.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    console.log(`Distance filter: ${beforeFilter} -> ${items.length} (within ${radius}km)`);
  } else {
    // Add null distance for consistency
    items = items.map(f => ({ ...f, distance: null }));
  }

  // Calculate pagination
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

  console.log('Final result:', {
    totalItems,
    pagedItemsCount: pagedItems.length,
    page,
    totalPages
  });
  console.log('=== End searchFoodsForStore Debug ===');

  return {
    items: pagedItems,
    totalItems,
    page,
    pageSize,
    totalPages,
  };
}
    /**
     * Get foods by restaurant ID and category ID with pagination
     * @param restaurantId The restaurant ID
     * @param categoryId The category ID
     * @param page The page number
     * @param pageSize The number of items per page
     * @param lat Latitude for distance calculation
     * @param lng Longitude for distance calculation
     * @param status Status filter (available, hidden, etc.)
     */
    async findByRestaurantAndCategory(restaurantId: string, categoryId: string, page = 1, pageSize = 10, lat?: number, lng?: number, status?: string): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {

        
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId }
        });

        if (!restaurant) {
            throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
        }

        const category = await this.categoryRepository.findOne({
            where: { id: categoryId }
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${categoryId} not found`);
        }

        const queryBuilder = this.foodRepository.createQueryBuilder('food')
            .leftJoinAndSelect('food.restaurant', 'restaurant')
            .leftJoinAndSelect('food.category', 'category')
            .where('food.restaurant_id = :restaurantId', { restaurantId })
            .andWhere('food.category_id = :categoryId', { categoryId });

        // Add status filter if provided
        if (status) {
            queryBuilder.andWhere('food.status = :status', { status });
        }

        queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [items, totalItems] = await queryBuilder.getManyAndCount();

        const itemsWithDistance = items.map(food => {
            let distance : number | null = null;
            if (lat && lng && food.restaurant?.latitude && food.restaurant?.longitude) {
                distance = haversineDistance(
                    lat,
                    lng,
                    Number(food.restaurant.latitude),
                    Number(food.restaurant.longitude)
                );
            }
            return { ...food, distance };
        });

        return {
            items: itemsWithDistance,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }


    /**
     * Get foods by restaurant ID with pagination
     * 
     * @param restaurantId The restaurant ID
     * @param page The page number
     * @param pageSize The number of items per page
     * @returns List of foods for a specific restaurant with pagination metadata
     */
    async findByRestaurant(restaurantId: string, page = 1, pageSize = 10, lat?: number, lng?: number, status?: string): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId }
        });

        if (!restaurant) {
            throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
        }

        const queryBuilder = this.foodRepository.createQueryBuilder('food')
            .leftJoinAndSelect('food.category', 'category')
            .where('food.restaurant_id = :restaurantId', { restaurantId });

        // Add status filter if provided
        if (status) {
            queryBuilder.andWhere('food.status = :status', { status });
        }

        queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [items, totalItems] = await queryBuilder.getManyAndCount();

        const itemsWithDistance = items.map(food => {
            let distance : number | null = null;
            if (lat && lng && restaurant.latitude && restaurant.longitude) {
                distance = haversineDistance(
                    lat,
                    lng,
                    Number(restaurant.latitude),
                    Number(restaurant.longitude)
                );
            }
            return { ...food, distance };
        });

        return {
            items: itemsWithDistance,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get foods by category ID with pagination
     * 
     * @param categoryId The category ID
     * @param page The page number
     * @param pageSize The number of items per page
     * @returns List of foods for a specific category with pagination metadata
     */
    async findByCategory(categoryId: string, page = 1, pageSize = 10, lat?: number, lng?: number): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId }
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${categoryId} not found`);
        }

        const [items, totalItems] = await this.foodRepository.findAndCount({
            where: { category: { id: categoryId } },
            relations: ['restaurant'],
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const itemsWithDistance = items.map(food => {
            let distance : number | null = null;
            if (lat && lng && food.restaurant?.latitude && food.restaurant?.longitude) {
                distance = haversineDistance(
                    lat,
                    lng,
                    Number(food.restaurant.latitude),
                    Number(food.restaurant.longitude)
                );
            }
            return { ...food, distance };
        });

        return {
            items: itemsWithDistance,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get top selling foods with pagination
     * 
     * @param page The page number
     * @param pageSize The number of items per page
     * @returns List of top selling foods with pagination metadata
     */
    async findTopSelling(page = 1, pageSize = 10, lat?: number, lng?: number): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const [items, totalItems] = await this.foodRepository.findAndCount({
            order: {
                purchasedNumber: 'DESC'
            },
            relations: ['restaurant', 'category'],
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const itemsWithDistance = items.map(food => {
            let distance : number | null = null;
            if (lat && lng && food.restaurant?.latitude && food.restaurant?.longitude) {
                distance = haversineDistance(
                    lat,
                    lng,
                    Number(food.restaurant.latitude),
                    Number(food.restaurant.longitude)
                );
            }
            return { ...food, distance };
        });

        return {
            items: itemsWithDistance,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }


    /**
     * Get newest foods with pagination
     * 
     * @param page The page number
     * @param pageSize The number of items per page
     * @returns List of newest foods with pagination metadata
     */
    async findNewest(page = 1, pageSize = 10, lat?: number, lng?: number): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const [items, totalItems] = await this.foodRepository.findAndCount({
            relations: ['restaurant', 'category'],
            order: {
                id: 'DESC' // Assuming UUIDs are chronological
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const itemsWithDistance = items.map(food => {
            let distance : number | null = null;
            if (lat && lng && food.restaurant?.latitude && food.restaurant?.longitude) {
                distance = haversineDistance(
                    lat,
                    lng,
                    Number(food.restaurant.latitude),
                    Number(food.restaurant.longitude)
                );
            }
            return { ...food, distance };
        });

        return {
            items: itemsWithDistance,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get top selling foods by restaurant with pagination
     * 
     * @param restaurantId The restaurant ID
     * @param page The page number
     * @param pageSize The number of items per page
     * @returns List of top selling foods for a specific restaurant with pagination metadata
     */
    async findTopSellingByRestaurant(restaurantId: string, page = 1, pageSize = 10, lat?: number, lng?: number): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId }
        });

        if (!restaurant) {
            throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
        }

        const [items, totalItems] = await this.foodRepository.findAndCount({
            where: { restaurant: { id: restaurantId } },
            relations: ['category'],
            order: {
                purchasedNumber: 'DESC'
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const itemsWithDistance = items.map(food => {
            let distance : number | null = null;
            if (lat && lng && restaurant.latitude && restaurant.longitude) {
                distance = haversineDistance(
                    lat,
                    lng,
                    Number(restaurant.latitude),
                    Number(restaurant.longitude)
                );
            }
            return { ...food, distance };
        });

        return {
            items: itemsWithDistance,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get foods by category and restaurant with pagination
     * 
     * @param categoryId The category ID
     * @param restaurantId The restaurant ID
     * @param page The page number
     * @param pageSize The number of items per page
     * @returns List of foods for a specific category and restaurant with pagination metadata
     */
    async findByCategoryAndRestaurant(categoryId: string, restaurantId: string, page = 1, pageSize = 10, lat?: number, lng?: number): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId }
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${categoryId} not found`);
        }

        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId }
        });

        if (!restaurant) {
            throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
        }

        const [items, totalItems] = await this.foodRepository.findAndCount({
            where: {
                category: { id: categoryId },
                restaurant: { id: restaurantId }
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const itemsWithDistance = items.map(food => {
            let distance : number | null = null;
            if (lat && lng && restaurant.latitude && restaurant.longitude) {
                distance = haversineDistance(
                    lat,
                    lng,
                    Number(restaurant.latitude),
                    Number(restaurant.longitude)
                );
            }
            return { ...food, distance };
        });

        return {
            items: itemsWithDistance,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get foods with discount with pagination
     * 
     * @param page The page number
     * @param pageSize The number of items per page
     * @returns List of foods with discount with pagination metadata
     */
    async findWithDiscount(page = 1, pageSize = 10, lat?: number, lng?: number): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const queryBuilder = this.foodRepository.createQueryBuilder('food')
            .leftJoinAndSelect('food.restaurant', 'restaurant')
            .leftJoinAndSelect('food.category', 'category')
            .where('food.discountPercent IS NOT NULL')
            .andWhere('food.discountPercent != :zero', { zero: '0' })
            .orderBy('CAST(food.discountPercent AS DECIMAL)', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const totalItems = await queryBuilder.getCount();
        const items = await queryBuilder.getMany();

        const itemsWithDistance = items.map(food => {
            let distance : number | null = null;
            if (lat && lng && food.restaurant?.latitude && food.restaurant?.longitude) {
                distance = haversineDistance(
                    lat,
                    lng,
                    Number(food.restaurant.latitude),
                    Number(food.restaurant.longitude)
                );
            }
            return { ...food, distance };
        });

        return {
            items: itemsWithDistance,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get foods with discount by restaurant with pagination
     * 
     * @param restaurantId The restaurant ID
     * @param page The page number
     * @param pageSize The number of items per page
     * @returns List of foods with discount for a specific restaurant with pagination metadata
     */
    async findWithDiscountByRestaurant(restaurantId: string, page = 1, pageSize = 10, lat?: number, lng?: number): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId }
        });

        if (!restaurant) {
            throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
        }

        const queryBuilder = this.foodRepository.createQueryBuilder('food')
            .leftJoinAndSelect('food.category', 'category')
            .where('food.restaurant_id = :restaurantId', { restaurantId })
            .andWhere('food.discountPercent IS NOT NULL')
            .andWhere('food.discountPercent != :zero', { zero: '0' })
            .orderBy('CAST(food.discountPercent AS DECIMAL)', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const totalItems = await queryBuilder.getCount();
        const items = await queryBuilder.getMany();

        const itemsWithDistance = items.map(food => {
            let distance : number | null = null;
            if (lat && lng && restaurant.latitude && restaurant.longitude) {
                distance = haversineDistance(
                    lat,
                    lng,
                    Number(restaurant.latitude),
                    Number(restaurant.longitude)
                );
            }
            return { ...food, distance };
        });

        return {
            items: itemsWithDistance,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

async searchFoods(
  query: string,
  page = 1,
  pageSize = 10,
  lat?: number,
  lng?: number,
  radius = 5
): Promise<{
  items: any[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  console.log('=== searchFoods Debug ===');
  console.log('Input parameters:', {
    query,
    page,
    pageSize,
    lat,
    lng,
    radius
  });

  const queryBuilder = this.foodRepository.createQueryBuilder('food')
    .leftJoinAndSelect('food.restaurant', 'restaurant')
    .leftJoinAndSelect('food.category', 'category');

  // Add search condition - if no query provided, return all foods
  if (query && query.trim()) {
    queryBuilder.where('food.name ILIKE :query OR food.description ILIKE :query', { 
      query: `%${query.trim()}%` 
    });
    console.log('Added search filter for:', query.trim());
  } else {
    console.log('No search query provided, returning all foods');
  }

  console.log('Query SQL:', queryBuilder.getQuery());
  console.log('Query parameters:', queryBuilder.getParameters());

  // Get all matching items first
  let items = await queryBuilder.getMany();
  console.log('Raw items found:', items.length);

  if (items.length > 0) {
    console.log('First item example:', {
      id: items[0].id,
      name: items[0].name,
      restaurant: items[0].restaurant?.name
    });
  }

  // Add distance and apply location filtering if coordinates provided
  if (lat && lng) {
    console.log('Applying distance filtering...');
    const beforeFilter = items.length;
    
    items = items
      .filter(f => f.restaurant?.latitude && f.restaurant?.longitude)
      .map(f => ({
        ...f,
        distance: haversineDistance(lat, lng, Number(f.restaurant.latitude), Number(f.restaurant.longitude))
      }))
      .filter(f => f.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    console.log(`Distance filter: ${beforeFilter} -> ${items.length} (within ${radius}km)`);
    
    if (items.length > 0) {
      console.log('Distance examples:', items.slice(0, 3).map(f => ({
        name: f.name,
        distance: haversineDistance(lat, lng, Number(f.restaurant.latitude), Number(f.restaurant.longitude))
      })));
    }
  } else {
    // Add null distance for consistency
    items = items.map(f => ({ ...f, distance: null }));
  }

  // Calculate pagination
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

  console.log('Final result:', {
    totalItems,
    pagedItemsCount: pagedItems.length,
    page,
    totalPages
  });
  console.log('=== End searchFoods Debug ===');

  return {
    items: pagedItems,
    totalItems,
    page,
    pageSize,
    totalPages,
  };
}
    /**
     * Get a specific food by ID
     * 
     * @param id The food ID
     * @returns The food details
     */
async findOne(id: string, lat?: number, lng?: number): Promise<any> {
    console.log('=== findOne Debug ===');
    console.log('Looking for food with ID:', id);
    
    // First get the food with basic relations
    const food = await this.foodRepository
        .createQueryBuilder('food')
        .leftJoinAndSelect('food.restaurant', 'restaurant')
        .leftJoinAndSelect('restaurant.address', 'address')
        .leftJoinAndSelect('food.category', 'category')
        .where('food.id = :id', { id })
        .getOne();

    if (!food) {
        throw new NotFoundException(`Food with ID ${id} not found`);
    }

    // Separately get the top 3 reviews for this food
    const topReviews = await this.foodRepository
        .createQueryBuilder('food')
        .leftJoinAndSelect('food.reviews', 'reviews')
        .leftJoinAndSelect('reviews.user', 'reviewUser')
        .where('food.id = :id', { id })
        .andWhere('reviews.type = :type', { type: 'food' })
        .andWhere('reviews.rating IS NOT NULL')
        .orderBy('reviews.rating', 'DESC')
        .addOrderBy('reviews.createdAt', 'DESC')
        .limit(3)
        .getOne();

    // Get all reviews count for statistics
    const allReviewsData = await this.foodRepository
        .createQueryBuilder('food')
        .leftJoin('food.reviews', 'allReviews')
        .select([
            'COUNT(allReviews.id) as total_reviews',
            'AVG(allReviews.rating) as average_rating'
        ])
        .where('food.id = :id', { id })
        .andWhere('allReviews.type = :type', { type: 'food' })
        .andWhere('allReviews.rating IS NOT NULL')
        .getRawOne();

    console.log('Food found:', food.id, food.name);
    console.log('Top 3 reviews found:', topReviews?.reviews?.length || 0);
    console.log('Total reviews stats:', allReviewsData);

    // Calculate statistics
    const totalReviews = parseInt(allReviewsData?.total_reviews || '0');
    const averageRating = allReviewsData?.average_rating ? 
        Number(parseFloat(allReviewsData.average_rating).toFixed(1)) : null;

    console.log('Calculated stats - Total:', totalReviews, 'Average:', averageRating);

    // Prepare clean result
    const result: any = {
        ...food,
        rating: averageRating,
        totalReviews,
        restaurant: food.restaurant ? {
            id: food.restaurant.id,
            name: food.restaurant.name,
            description: food.restaurant.description,
            avatar: food.restaurant.avatar,
            backgroundImage: food.restaurant.backgroundImage,
            phoneNumber: food.restaurant.phoneNumber,
            status: food.restaurant.status,
            latitude: food.restaurant.latitude,
            longitude: food.restaurant.longitude,
            openTime: food.restaurant.openTime,
            closeTime: food.restaurant.closeTime,
            createdAt: food.restaurant.createdAt,
            updatedAt: food.restaurant.updatedAt,
            address: food.restaurant.address ? {
                id: food.restaurant.address.id,
                street: food.restaurant.address.street,
                ward: food.restaurant.address.ward,
                district: food.restaurant.address.district,
                city: food.restaurant.address.city,
                latitude: food.restaurant.address.latitude,
                longitude: food.restaurant.address.longitude
            } : null
        } : null,
        // Only include top 3 reviews
        reviews: topReviews?.reviews ? topReviews.reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            image: review.image,
            createdAt: review.createdAt,
            user: review.user ? {
                id: review.user.id,
                name: review.user.name,
                avatar: review.user.avatar
            } : null
        })) : []
    };

    // Add distance if coordinates provided
    if (lat && lng && food.restaurant?.latitude && food.restaurant?.longitude) {
        result.distance = haversineDistance(
            lat, 
            lng, 
            Number(food.restaurant.latitude), 
            Number(food.restaurant.longitude)
        );
    }

    console.log('Final result - Reviews count:', result.reviews?.length || 0);
    console.log('Final result - Total reviews:', result.totalReviews);
    console.log('Final result - Average rating:', result.rating);
    console.log('=== End findOne Debug ===');

    return result;
}

    /**
     * Update a food
     * 
     * @param id The food ID
     * @param updateFoodDto The updated food data
     * @returns The updated food
     */
    async update(id: string, updateFoodDto: UpdateFoodDto): Promise<Food> {
        const food = await this.findOne(id);

        // --- Handle old image deletion ---
        // Delete old cover image if changed
        if (updateFoodDto.image && updateFoodDto.image !== food.image && food.image) {
            await this.gcsService.deleteFile(food.image).catch(err => {
                // Log and ignore error if file doesn't exist
                console.warn('Failed to delete old food image:', err?.message || err);
            });
        }

        // Delete old gallery images if changed
        if (
            updateFoodDto.imageUrls &&
            Array.isArray(updateFoodDto.imageUrls) &&
            food.imageUrls &&
            Array.isArray(food.imageUrls)
        ) {
            // Find images that are in old but not in new
            const removedImages = food.imageUrls.filter(
                (oldUrl) => !(updateFoodDto.imageUrls || []).includes(oldUrl)
            );
            for (const url of removedImages) {
                await this.gcsService.deleteFile(url).catch(err => {
                    console.warn('Failed to delete old food gallery image:', err?.message || err);
                });
            }
        }

        // Handle restaurant update if provided
        if (updateFoodDto.restaurantId) {
            const restaurant = await this.restaurantRepository.findOne({
                where: { id: updateFoodDto.restaurantId }
            });

            if (!restaurant) {
                throw new BadRequestException('Restaurant not found');
            }

            food.restaurant = restaurant;
            // Remove restaurantId from DTO to prevent TypeORM errors
            delete updateFoodDto.restaurantId;
        }

        // Handle category update if provided
        if (updateFoodDto.categoryId) {
            const category = await this.categoryRepository.findOne({
                where: { id: updateFoodDto.categoryId }
            });

            if (!category) {
                throw new BadRequestException('Category not found');
            }

            food.category = category;
            // Remove categoryId from DTO to prevent TypeORM errors
            delete updateFoodDto.categoryId;
        }

        // Update food with remaining fields
        Object.assign(food, updateFoodDto);

        return await this.foodRepository.save(food);
    }

    async updateIfOwner(id: string, updateFoodDto: UpdateFoodDto, userId: string): Promise<Food> {
    const food = await this.foodRepository.findOne({
        where: { id },
        relations: ['restaurant', 'restaurant.owner'], // Make sure owner is loaded
    });
        if (!food) throw new NotFoundException('Food not found');
        if (!food.restaurant || food.restaurant.owner.id !== userId) {
            throw new UnauthorizedException('You are not the owner of this restaurant');
        }
        return this.update(id, updateFoodDto);
    }

    /**
     * Delete a food
     * 
     * @param id The food ID
     */
    async remove(id: string): Promise<void> {
        const result = await this.foodRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Food with ID ${id} not found`);
        }
    }

    async removeIfOwner(id: string, userId: string): Promise<void> {
        const food = await this.foodRepository.findOne({
            where: { id },
            relations: ['restaurant', 'restaurant.owner'],
        });
        if (!food) throw new NotFoundException('Food not found');
        if (!food.restaurant || food.restaurant.owner.id !== userId) {
            throw new UnauthorizedException('You are not the owner of this restaurant');
        }
        return this.remove(id);
    }

    async updateStatusIfOwner(foodId: string, status: string, userId: string): Promise<Food> {
   const food = await this.foodRepository.findOne({
        where: { id: foodId },
        relations: ['restaurant', 'restaurant.owner'], // Add the owner relation
    });
        if (!food) throw new NotFoundException('Food not found');
        if (!food.restaurant || food.restaurant.owner.id !== userId) {
            throw new UnauthorizedException('You are not the owner of this restaurant');
        }
        food.status = status;
        return await this.foodRepository.save(food);
    }

    async findByName(
  name?: string, // Made optional
  page = 1,
  pageSize = 10,
  lat?: number,
  lng?: number,
  radius = 5,
  categoryIds?: string[],
  minPrice?: number,
  maxPrice?: number,
): Promise<{
  items: any[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  console.log('=== findByName Debug ===');
  console.log('Input parameters:', {
    name,
    decodedName: name ? decodeURIComponent(name) : 'No name filter',
    page,
    pageSize,
    lat,
    lng,
    radius,
    categoryIds,
    minPrice,
    maxPrice
  });

  const queryBuilder = this.foodRepository.createQueryBuilder('food')
    .leftJoinAndSelect('food.restaurant', 'restaurant')
    .leftJoinAndSelect('food.category', 'category');

  // Only add name filter if name is provided
  if (name && name.trim()) {
    queryBuilder.where('LOWER(food.name) LIKE :name', { name: `%${name.toLowerCase()}%` });
    console.log('Added name filter:', name);
  }

  // Filter by category IDs
  if (categoryIds && categoryIds.length > 0) {
    if (name && name.trim()) {
      queryBuilder.andWhere('food.category_id IN (:...categoryIds)', { categoryIds });
    } else {
      queryBuilder.where('food.category_id IN (:...categoryIds)', { categoryIds });
    }
    console.log('Added category filter:', categoryIds);
  }

  // Filter by min price
  if (minPrice !== undefined) {
    const whereMethod = (name && name.trim()) || (categoryIds && categoryIds.length > 0) ? 'andWhere' : 'where';
    queryBuilder[whereMethod]('food.price >= :minPrice', { minPrice });
    console.log('Added minPrice filter:', minPrice);
  }

  // Filter by max price
  if (maxPrice !== undefined) {
    const whereMethod = (name && name.trim()) || (categoryIds && categoryIds.length > 0) || (minPrice !== undefined) ? 'andWhere' : 'where';
    queryBuilder[whereMethod]('food.price <= :maxPrice', { maxPrice });
    console.log('Added maxPrice filter:', maxPrice);
  }

  console.log('Final query:', queryBuilder.getQuery());
  console.log('Query parameters:', queryBuilder.getParameters());

  // Get all items (no skip/take yet)
  let items = await queryBuilder.getMany();
  console.log('Raw items found after query:', items.length);
  
  if (items.length > 0) {
    console.log('First item example:', {
      id: items[0].id,
      name: items[0].name,
      restaurant: items[0].restaurant?.name,
      category: items[0].category?.name
    });
  }

  let itemsWithDistance = items.map(food => {
    let distance: number | null = null;
    if (lat && lng && food.restaurant?.latitude && food.restaurant?.longitude) {
      distance = haversineDistance(
        lat,
        lng,
        Number(food.restaurant.latitude),
        Number(food.restaurant.longitude)
      );
    }
    return { ...food, distance };
  });

  console.log('Items with distance calculated:', itemsWithDistance.length);

  // Filter and sort by distance if lat/lng provided
  if (lat && lng) {
    const beforeFilter = itemsWithDistance.length;
    itemsWithDistance = itemsWithDistance
      .filter(f => f.distance !== null && f.distance <= radius)
      .sort((a, b) => (a.distance as number) - (b.distance as number));
    console.log(`Distance filter: ${beforeFilter} -> ${itemsWithDistance.length} (within ${radius}km)`);
    
    // Log some distance examples
    if (itemsWithDistance.length > 0) {
      console.log('Distance examples:', itemsWithDistance.slice(0, 3).map(f => ({
        name: f.name,
        distance: f.distance,
        restaurantLat: f.restaurant?.latitude,
        restaurantLng: f.restaurant?.longitude
      })));
    }
  }

  const totalItems = itemsWithDistance.length;
  const pagedItems = itemsWithDistance.slice((page - 1) * pageSize, page * pageSize);

  console.log('Final result:', {
    totalItems,
    pagedItemsCount: pagedItems.length,
    page,
    pageSize,
    totalPages: Math.ceil(totalItems / pageSize)
  });
  console.log('=== End findByName Debug ===');

  return {
    items: pagedItems,
    totalItems,
    page,
    pageSize,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}

    /**
     * Get reviews for a specific food with pagination
     * 
     * @param foodId The food ID
     * @param page The page number
     * @param pageSize The number of items per page
     * @param sortBy The field to sort by (rating, createdAt)
     * @param sortOrder The sort order (ASC, DESC)
     * @param minRating Filter by minimum rating
     * @param maxRating Filter by maximum rating
     * @returns List of reviews for the food with pagination metadata
     */
    async getReviewsByFood(
        foodId: string,
        page = 1,
        pageSize = 10,
        sortBy = 'createdAt',
        sortOrder: 'ASC' | 'DESC' = 'DESC',
        minRating?: number,
        maxRating?: number,
    ): Promise<{
        items: any[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
        averageRating: number | null;
        ratingDistribution: { [key: number]: number };
    }> {
        console.log('=== getReviewsByFood Debug ===');
        console.log('Input parameters:', {
            foodId,
            page,
            pageSize,
            sortBy,
            sortOrder,
            minRating,
            maxRating
        });

        // First, verify the food exists
        const food = await this.foodRepository.findOne({
            where: { id: foodId },
            select: ['id', 'name']
        });

        if (!food) {
            throw new NotFoundException(`Food with ID ${foodId} not found`);
        }

        console.log('Food found:', food.name);

        // Build the query
        const queryBuilder = this.reviewRepository
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.user', 'user')
            .where('review.food_id = :foodId', { foodId })
            .andWhere('review.type = :type', { type: 'food' });

        // Add rating filters if provided
        if (minRating !== undefined) {
            queryBuilder.andWhere('review.rating >= :minRating', { minRating });
            console.log('Added minRating filter:', minRating);
        }

        if (maxRating !== undefined) {
            queryBuilder.andWhere('review.rating <= :maxRating', { maxRating });
            console.log('Added maxRating filter:', maxRating);
        }

        // Add sorting
        const validSortFields = ['rating', 'createdAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        queryBuilder.orderBy(`review.${sortField}`, sortOrder);
        console.log('Sorting by:', sortField, sortOrder);

        // Get total count
        const totalItems = await queryBuilder.getCount();
        console.log('Total reviews found:', totalItems);

        // Apply pagination
        const items = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getMany();

        console.log('Paginated items:', items.length);

        // Calculate statistics
        const statsQuery = this.reviewRepository
            .createQueryBuilder('review')
            .where('review.food_id = :foodId', { foodId })
            .andWhere('review.type = :type', { type: 'food' })
            .andWhere('review.rating IS NOT NULL');

        const averageResult = await statsQuery
            .select('AVG(review.rating)', 'average')
            .getRawOne();

        const averageRating = averageResult?.average ? 
            Number(parseFloat(averageResult.average).toFixed(1)) : null;

        // Get rating distribution
        const distributionResult = await statsQuery
            .select('review.rating', 'rating')
            .addSelect('COUNT(*)', 'count')
            .groupBy('review.rating')
            .getRawMany();

        const ratingDistribution: { [key: number]: number } = {};
        for (let i = 1; i <= 5; i++) {
            ratingDistribution[i] = 0;
        }
        distributionResult.forEach(item => {
            if (item.rating) {
                ratingDistribution[item.rating] = parseInt(item.count);
            }
        });

        console.log('Statistics calculated:', {
            averageRating,
            ratingDistribution
        });

        // Format the response
        const formattedItems = items.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            image: review.image,
            createdAt: review.createdAt,
            user: review.user ? {
                id: review.user.id,
                name: review.user.name,
                avatar: review.user.avatar
            } : null
        }));

        const result = {
            items: formattedItems,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
            averageRating,
            ratingDistribution
        };

        console.log('Final result:', {
            totalItems: result.totalItems,
            itemsCount: result.items.length,
            totalPages: result.totalPages,
            averageRating: result.averageRating
        });
        console.log('=== End getReviewsByFood Debug ===');

        return result;
    }

    async delete(id: string): Promise<void> {
        const result = await this.foodRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Food with ID ${id} not found`);
        }
    }
    async getMenuForUser(userId: string) {
        const restaurants = await this.restaurantRepository.find({
          relations: ['foods'],  // Fetch foods for each restaurant
        });
      
        return restaurants.map(restaurant => ({
          name: restaurant.name,
          address: restaurant.address,
          foods: restaurant.foods.map(food => ({
            name: food.name,
            price: food.price,
            description: food.description,
          })),
        }));
      }
}

