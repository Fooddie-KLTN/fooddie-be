import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant, RestaurantStatus } from 'src/entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { User } from 'src/entities/user.entity';

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant)
        private restaurantRepository: Repository<Restaurant>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    /**
     * Create a new restaurant
     * 
     * @param createRestaurantDto The restaurant data to create
     * @returns The created restaurant
     */
    async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
        try {
            // Check if owner exists
            if (createRestaurantDto.ownerId) {
                const owner = await this.userRepository.findOne({
                    where: { id: createRestaurantDto.ownerId }
                });

                if (!owner) {
                    throw new Error('Owner not found');
                }

                // Create new restaurant
                const restaurant = this.restaurantRepository.create({
                    ...createRestaurantDto,
                    owner: owner,
                    status: RestaurantStatus.APPROVED
                });

                return await this.restaurantRepository.save(restaurant);
            } else {
                throw new Error('Owner ID is required');
            }
        } catch (error) {
            throw new Error(`Failed to create restaurant: ${error.message}`);
        }
    }

    /**
   * Request to create a new restaurant (pending approval)
   * 
   * @param createRestaurantDto The restaurant data to create
   * @returns The created restaurant request
   */
    async requestRestaurant(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
        try {
            // Check if owner exists
            if (createRestaurantDto.ownerId) {
                const owner = await this.userRepository.findOne({
                    where: { id: createRestaurantDto.ownerId }
                });

                if (!owner) {
                    throw new BadRequestException('Owner not found');
                }

                // Create new restaurant request
                const restaurant = this.restaurantRepository.create({
                    ...createRestaurantDto,
                    owner: owner,
                    status: RestaurantStatus.PENDING
                });

                return await this.restaurantRepository.save(restaurant);
            } else {
                throw new BadRequestException('Owner ID is required');
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Failed to request restaurant: ${error.message}`);
        }
    }

    /**
 * Get all restaurant requests (pending status)
 * 
 * @returns List of pending restaurant requests
 */
    async getRestaurantRequests(page = 1, pageSize = 10): Promise<{
        items: Restaurant[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const [items, totalItems] = await this.restaurantRepository.findAndCount({
            where: { status: RestaurantStatus.PENDING },
            relations: ['owner'],
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
     * Delete a restaurant request
     * 
     * @param id The restaurant request ID to delete
     */
    async deleteRestaurantRequest(id: string): Promise<void> {
        const restaurant = await this.findOne(id);

        if (restaurant.status !== RestaurantStatus.PENDING) {
            throw new BadRequestException(`Restaurant with ID ${id} is not a pending request`);
        }

        const result = await this.restaurantRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Restaurant request with ID ${id} not found`);
        }
    }

    /**
* Approve a restaurant request
* 
* @param id The restaurant ID to approve
* @returns The approved restaurant
*/
    async approveRestaurant(id: string): Promise<Restaurant> {
        const restaurant = await this.findOne(id);

        if (restaurant.status !== RestaurantStatus.PENDING) {
            throw new BadRequestException(`Restaurant with ID ${id} is not in pending status`);
        }

        restaurant.status = RestaurantStatus.APPROVED;
        return await this.restaurantRepository.save(restaurant);
    }



    /**
     * Reject a restaurant request
     * 
     * @param id The restaurant ID to reject
     * @returns The rejected restaurant
     */
    async rejectRestaurant(id: string): Promise<Restaurant> {
        const restaurant = await this.findOne(id);

        if (restaurant.status !== RestaurantStatus.PENDING) {
            throw new BadRequestException(`Restaurant with ID ${id} is not in pending status`);
        }

        restaurant.status = RestaurantStatus.REJECTED;
        return await this.restaurantRepository.save(restaurant);
    }

    /**
  * Get approved restaurants only
  * 
  * @returns List of all approved restaurants
  */
    async findAllApproved(page = 1, pageSize = 10): Promise<{
        items: Restaurant[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const [items, totalItems] = await this.restaurantRepository.findAndCount({
            where: { status: RestaurantStatus.APPROVED },
            relations: ['owner'],
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
     * Get all restaurants
     * 
     * @returns List of all restaurants
     */
    async findAll(page = 1, pageSize = 10): Promise<{
        items: Restaurant[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const [items, totalItems] = await this.restaurantRepository.findAndCount({
            relations: ['owner'],
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
     * Get restaurant preview list with limited information
     * 
     * @returns List of restaurants with basic information
     */
    async getPreview(page = 1, pageSize = 10): Promise<{
        items: Partial<Restaurant>[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const queryBuilder = this.restaurantRepository
            .createQueryBuilder('restaurant')
            .select([
                'restaurant.id',
                'restaurant.name',
                'restaurant.address',
                'restaurant.avatar',
                'restaurant.description',
                'restaurant.openTime',
                'restaurant.closeTime',
            ]);

        const totalItems = await queryBuilder.getCount();

        const items = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getMany();

        return {
            items,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get a specific restaurant by ID
     * 
     * @param id The restaurant ID
     * @returns The restaurant details
     */
    async findOne(id: string): Promise<Restaurant> {
        const restaurant = await this.restaurantRepository.findOne({
            where: { id },
            relations: ['owner', 'foods']
        });

        if (!restaurant) {
            throw new Error(`Restaurant with ID ${id} not found`);
        }

        return restaurant;
    }

    /**
     * Update a restaurant
     * 
     * @param id The restaurant ID
     * @param updateRestaurantDto The updated restaurant data
     * @returns The updated restaurant
     */
    async update(id: string, updateRestaurantDto: UpdateRestaurantDto): Promise<Restaurant> {
        const restaurant = await this.findOne(id);

        // Handle owner update if provided
        if (updateRestaurantDto.ownerId) {
            const owner = await this.userRepository.findOne({
                where: { id: updateRestaurantDto.ownerId }
            });

            if (!owner) {
                throw new Error('Owner not found');
            }

            restaurant.owner = owner;
            // Remove ownerId from DTO to prevent TypeORM errors
            delete updateRestaurantDto.ownerId;
        }

        // Update restaurant with remaining fields
        Object.assign(restaurant, updateRestaurantDto);

        return await this.restaurantRepository.save(restaurant);
    }

    /**
     * Delete a restaurant
     * 
     * @param id The restaurant ID
     */
    async remove(id: string): Promise<void> {
        const result = await this.restaurantRepository.delete(id);

        if (result.affected === 0) {
            throw new Error(`Restaurant with ID ${id} not found`);
        }
    }
}