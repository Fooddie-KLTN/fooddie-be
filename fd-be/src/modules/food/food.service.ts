import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Food } from 'src/entities/food.entity';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { Restaurant } from 'src/entities/restaurant.entity';
import { Category } from 'src/entities/category.entity';
import { GoogleCloudStorageService } from 'src/gcs/gcs.service'; // Add this import

@Injectable()
export class FoodService {
    constructor(
        @InjectRepository(Food)
        private foodRepository: Repository<Food>,
        @InjectRepository(Restaurant)
        private restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        private readonly gcsService: GoogleCloudStorageService, // Inject GCS service
    ) { }

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
     * @returns List of all foods with pagination metadata
     */
    async findAll(page = 1, pageSize = 10): Promise<{
        items: Food[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const [items, totalItems] = await this.foodRepository.findAndCount({
            relations: ['restaurant', 'category'],
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return {
            items,
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
    async findByRestaurant(restaurantId: string, page = 1, pageSize = 10): Promise<{
        items: Food[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        // Check if restaurant exists
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId }
        });

        if (!restaurant) {
            throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
        }

        const [items, totalItems] = await this.foodRepository.findAndCount({
            where: { restaurant: { id: restaurantId } },
            relations: ['category'],
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return {
            items,
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
    async findByCategory(categoryId: string, page = 1, pageSize = 10): Promise<{
        items: Food[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        // Check if category exists
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

        return {
            items,
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
    async findTopSelling(page = 1, pageSize = 10): Promise<{
        items: Food[];
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

        return {
            items,
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
    async findNewest(page = 1, pageSize = 10): Promise<{
        items: Food[];
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

        return {
            items,
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
    async findTopSellingByRestaurant(restaurantId: string, page = 1, pageSize = 10): Promise<{
        items: Food[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        // Check if restaurant exists
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

        return {
            items,
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
    async findByCategoryAndRestaurant(categoryId: string, restaurantId: string, page = 1, pageSize = 10): Promise<{
        items: Food[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        // Check if category exists
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId }
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${categoryId} not found`);
        }

        // Check if restaurant exists
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

        return {
            items,
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
    async findWithDiscount(page = 1, pageSize = 10): Promise<{
        items: Food[];
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

        return {
            items,
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
    async findWithDiscountByRestaurant(restaurantId: string, page = 1, pageSize = 10): Promise<{
        items: Food[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        // Check if restaurant exists
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

        return {
            items,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Search foods by name or description with pagination
     * 
     * @param query The search query
     * @param page The page number
     * @param pageSize The number of items per page
     * @returns List of foods matching the search with pagination metadata
     */
    async searchFoods(query: string, page = 1, pageSize = 10): Promise<{
        items: Food[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const queryBuilder = this.foodRepository.createQueryBuilder('food')
            .leftJoinAndSelect('food.restaurant', 'restaurant')
            .leftJoinAndSelect('food.category', 'category')
            .where('food.name LIKE :query OR food.description LIKE :query', { query: `%${query}%` })
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const totalItems = await queryBuilder.getCount();
        const items = await queryBuilder.getMany();

        return {
            items,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get a specific food by ID
     * 
     * @param id The food ID
     * @returns The food details
     */
    async findOne(id: string): Promise<Food> {
        const food = await this.foodRepository.findOne({
            where: { id },
            relations: ['restaurant', 'category']
        });

        if (!food) {
            throw new NotFoundException(`Food with ID ${id} not found`);
        }

        return food;
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
            relations: ['restaurant', 'restaurant.owner'],
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
            relations: ['restaurant'],
        });
        if (!food) throw new NotFoundException('Food not found');
        if (!food.restaurant || food.restaurant.owner.id !== userId) {
            throw new UnauthorizedException('You are not the owner of this restaurant');
        }
        food.status = status;
        return await this.foodRepository.save(food);
    }
}