import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, In } from 'typeorm';
import { Order } from 'src/entities/order.entity';
import { OrderDetail } from 'src/entities/orderDetail.entity';
import { CreateOrderDto, CreateOrderDetailDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from 'src/entities/user.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { Food } from 'src/entities/food.entity';
import { Address } from 'src/entities/address.entity';
import { Promotion, PromotionType } from 'src/entities/promotion.entity';
import { PaymentDto } from './dto/payment.dto';
import { log } from 'console';
import { haversineDistance } from 'src/common/utils/helper';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Checkout, CheckoutStatus } from 'src/entities/checkout.entity';
import { pubSub } from 'src/pubsub';
import { PromotionService } from '../promotion/promotion.service';
import { PendingAssignmentService } from 'src/pg-boss/pending-assignment.service';
import { Review } from 'src/entities/review.entity';
import { Notification } from 'src/entities/notification.entity';
import { ShippingDetail } from 'src/entities/shippingDetail.entity';
import { SystemConstraintsService } from 'src/services/system-constraints.service';
import { activeShipperTracker } from './order.resolver';
import { Topping } from 'src/entities/topping.entity';
import { MapboxService } from 'src/services/mapbox.service';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderDetail)
        private orderDetailRepository: Repository<OrderDetail>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Restaurant)
        private restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Food)
        private foodRepository: Repository<Food>,
        @InjectRepository(Address)
        private addressRepository: Repository<Address>,
        @InjectRepository(Promotion)
        private promotionRepository: Repository<Promotion>,
        private dataSource: DataSource,
        @InjectRepository(Checkout)
        private checkoutRepository: Repository<Checkout>,
        private promotionService: PromotionService,
        private pendingAssignmentService: PendingAssignmentService,
        @InjectRepository(Review) // Add Review repository
        private reviewRepository: Repository<Review>,
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        @InjectRepository(ShippingDetail)
        private shippingDetailRepository: Repository<ShippingDetail>,
        @InjectRepository(Topping)
        private toppingRepository: Repository<Topping>,
        private readonly systemConstraintsService: SystemConstraintsService, // Inject SystemConstraintsService
        private readonly mapboxService: MapboxService, // Add this
    ) { }

    
    private async validateAndCalculateOrderDetails(
        orderDetails: {
          foodId: string;
          quantity: string;
          price?: string; // optional từ client, không dùng để tính
          selectedToppings?: Array<{ id: string; name: string; price: number }>;
          discountPercent?: number; // thêm nếu client gửi
        }[],
      ): Promise<{
        calculatedTotal: number;
        foodDetails: {
            food: Food;
            quantity: number;
            selectedToppings?: { id: string; name: string; price: number }[];
            toppingTotal: number;
            discountPercent: number;
            discountedPrice: number;
            itemTotal: number;
        }[];
      }> {
        let calculatedTotal = 0;
        const foodDetails: Array<{
            food: Food;
            quantity: number;
            selectedToppings?: { id: string; name: string; price: number }[];
            toppingTotal: number;
            discountPercent: number;
            discountedPrice: number;
            itemTotal: number;
          }> = [];
      
        for (const detail of orderDetails) {
            console.log(">>>>> Received selectedToppings:", detail.selectedToppings);
          const food = await this.foodRepository.findOne({
            where: { id: detail.foodId },
            relations: ['toppings'],
          });
      
          if (!food) {
            throw new NotFoundException(`Food with ID ${detail.foodId} not found`);
          }
      
          const quantity = Number(detail.quantity);
          if (isNaN(quantity) || quantity <= 0) {
            throw new BadRequestException(`Invalid quantity for food ID ${detail.foodId}`);
          }
      
          // Discount xử lý
          const basePrice = Number(food.price);
          const discountPercent = detail.discountPercent ?? food.discountPercent ?? 0;
          const discountedPrice = basePrice - (basePrice * discountPercent) / 100;
      
          // Xử lý topping
          let toppingTotal = 0;
          let validatedToppings: Array<{ id: string; name: string; price: number }> = [];
      
          if (detail.selectedToppings && detail.selectedToppings.length > 0) {
            for (const selectedTopping of detail.selectedToppings) {
              const topping = await this.toppingRepository.findOne({
                where: {
                  id: selectedTopping.id,
                  food: { id: detail.foodId },
                  isAvailable: true,
                },
              });
      
              if (!topping) {
                throw new BadRequestException(`Topping ${selectedTopping.name} is not available for this food`);
              }
      
              if (Math.abs(topping.price - selectedTopping.price) > 0.01) {
                throw new BadRequestException(`Invalid topping price for ${topping.name}`);
              }
      
              toppingTotal += topping.price * quantity;
              validatedToppings.push({
                id: topping.id,
                name: topping.name,
                price: topping.price,
              });
            }
          }
          console.log(`Topping total for food ${food.name}: ${toppingTotal}`);
          const itemTotal = (discountedPrice * quantity) + toppingTotal;
          calculatedTotal += itemTotal;
      
          foodDetails.push({
            food,
            quantity,
            selectedToppings: validatedToppings,
            toppingTotal,
            discountPercent,
            discountedPrice,
            itemTotal,
          });
        }
        console.log(`topping total: ${foodDetails.map(f => f.toppingTotal).reduce((a, b) => a + b, 0)}`);
        console.log(`Calculated total for order: ${calculatedTotal}`);
        return { calculatedTotal, foodDetails };
      }
      
      private async createOrderDetails(
        order: Order,
        foodDetails: {
          food: Food;
          quantity: number;
          selectedToppings?: Array<{ id: string; name: string; price: number }>;
          toppingTotal: number;
          discountPercent: number;
          discountedPrice: number;
          itemTotal: number;
        }[],
        queryRunner: any,
      ): Promise<void> {
      
        for (const detail of foodDetails) {
            const orderDetail = new OrderDetail();
            orderDetail.order = order;
            orderDetail.food = detail.food;
            orderDetail.quantity = detail.quantity;
            orderDetail.price = String(detail.discountedPrice); // ✅ giá sau giảm
            orderDetail.selectedToppings = detail.selectedToppings || [];
            orderDetail.toppingTotal = detail.toppingTotal;
            
            await queryRunner.manager.save(OrderDetail, orderDetail);
        }
    }

    /**
     * Create a temporary address for custom delivery locations
     */
    async createTemporaryAddress(addressData: {
        street: string;
        ward: string;
        district: string;
        city: string;
        latitude: number;
        longitude: number;
        label?: string;
    }, userId: string): Promise<string> {
        this.logger.log(`🏠 Creating temporary address for user ${userId}`);
        this.logger.log(`📍 Address data: ${JSON.stringify(addressData)}`);

        // Validate coordinates
        const lat = Number(addressData.latitude);
        const lng = Number(addressData.longitude);
        
        if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            throw new BadRequestException(`Invalid coordinates: lat=${lat}, lng=${lng}`);
        }

        // Create the address record
        const address = new Address();
        address.user = { id: userId } as User;
        address.street = addressData.street;
        address.ward = addressData.ward;
        address.district = addressData.district;
        address.city = addressData.city;
        address.latitude = lat;
        address.longitude = lng;
        address.label = addressData.label || 'Địa chỉ tùy chỉnh';
        address.isDefault = false;
        address.isTemporary = true; // Mark as temporary

        const savedAddress = await this.addressRepository.save(address);
        
        this.logger.log(`✅ Temporary address created: ${savedAddress.id}`);
        this.logger.log(`📍 Coordinates: ${savedAddress.latitude}, ${savedAddress.longitude}`);
        
        return savedAddress.id;
    }

    /**
     * Delete a temporary address
     */
    async deleteTemporaryAddress(addressId: string): Promise<void> {
        try {
            const address = await this.addressRepository.findOne({ 
                where: { id: addressId, isTemporary: true }
            });
            
            if (address) {
                await this.addressRepository.remove(address);
                this.logger.log(`🗑️ Temporary address ${addressId} deleted`);
            }
        } catch (error) {
            this.logger.error(`❌ Failed to delete temporary address ${addressId}: ${error.message}`);
        }
    }

    async createOrder(data: CreateOrderDto) {
        this.logger.log(`🚀 Starting enhanced order creation for user ${data.userId}`);
        this.logger.log(`📍 Using address ID: ${data.addressId}`);

        if (!data.orderDetails || data.orderDetails.length === 0) {
            throw new BadRequestException('Order must contain at least one item');
        }

        const constraints = await this.systemConstraintsService.getConstraints();
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = await queryRunner.manager.findOne(User, { where: { id: data.userId } });
            if (!user) throw new NotFoundException('User not found');

            const restaurant = await queryRunner.manager.findOne(Restaurant, { 
                where: { id: data.restaurantId }, 
                relations: ['address'] 
            });
            if (!restaurant || !restaurant.address) {
                throw new NotFoundException('Restaurant or its address not found');
            }

            const address = await queryRunner.manager.findOne(Address, { 
                where: { id: data.addressId } 
            });
            if (!address) {
                throw new NotFoundException('Delivery address not found');
            }

            // 🔍 DEBUG: Log the coordinates with null checking
            this.logger.log(`🔍 === MAPBOX ROUTE CALCULATION ===`);
            this.logger.log(`📍 User Address: ${address.street}, ${address.ward}, ${address.district}`);
            this.logger.log(`   - Coordinates: ${address.latitude}, ${address.longitude}`);
            this.logger.log(`   - Is Temporary: ${address.isTemporary || false}`);
            this.logger.log(`🏪 Restaurant: ${restaurant.name}`);
            this.logger.log(`   - Address: ${restaurant.address.street}, ${restaurant.address.ward}, ${restaurant.address.district}`);
            this.logger.log(`   - Coordinates: ${restaurant.address.latitude}, ${restaurant.address.longitude}`);

            // 🚨 CRITICAL FIX: Check for null coordinates BEFORE calling Mapbox
            if (address.latitude === null || address.longitude === null) {
                this.logger.error(`❌ Address coordinates are null!`);
                this.logger.error(`   - Address ID: ${address.id}`);
                this.logger.error(`   - User ID: ${data.userId}`);
                this.logger.error(`   - Street: ${address.street}`);
                throw new BadRequestException('Delivery address coordinates are missing. Please select a valid address or provide coordinates.');
            }

            if (restaurant.address.latitude === null || restaurant.address.longitude === null) {
                this.logger.error(`❌ Restaurant coordinates are null!`);
                this.logger.error(`   - Restaurant ID: ${restaurant.id}`);
                this.logger.error(`   - Restaurant: ${restaurant.name}`);
                throw new BadRequestException('Restaurant coordinates are missing. Please contact support.');
            }

            // Convert coordinates to numbers
            const userLat = Number(address.latitude);
            const userLng = Number(address.longitude);
            const restaurantLat = Number(restaurant.address.latitude);
            const restaurantLng = Number(restaurant.address.longitude);

            // Validate coordinates are within reasonable ranges
            if (Math.abs(userLat) > 90 || Math.abs(userLng) > 180) {
                this.logger.error(`❌ Invalid user coordinates: lat=${userLat}, lng=${userLng}`);
                throw new BadRequestException(`Invalid user coordinates: lat=${userLat}, lng=${userLng}`);
            }
            if (Math.abs(restaurantLat) > 90 || Math.abs(restaurantLng) > 180) {
                this.logger.error(`❌ Invalid restaurant coordinates: lat=${restaurantLat}, lng=${restaurantLng}`);
                throw new BadRequestException(`Invalid restaurant coordinates: lat=${restaurantLat}, lng=${restaurantLng}`);
            }

            this.logger.log(`✅ Coordinates validated successfully`);
            this.logger.log(`   - User: ${userLat}, ${userLng}`);
            this.logger.log(`   - Restaurant: ${restaurantLat}, ${restaurantLng}`);

            // 🗺️ Use Mapbox to calculate ACTUAL route distance
            const routeResult = await this.mapboxService.calculateBikeRoute(
                restaurantLat, restaurantLng, // From restaurant
                userLat, userLng             // To user
            );

            const deliveryDistance = routeResult.distance;
            const mapboxEstimatedDeliveryTime = Math.round(routeResult.duration / 60); // Convert to minutes

            this.logger.log(`📏 Mapbox route calculated:`);
            this.logger.log(`   - Distance: ${deliveryDistance}km`);
            this.logger.log(`   - Duration: ${mapboxEstimatedDeliveryTime} minutes`);
            this.logger.log(`   - Max allowed: ${constraints.max_delivery_distance}km`);

            // Validate distance against constraints
            if (!(await this.systemConstraintsService.isDistanceWithinLimits(deliveryDistance))) {
                this.logger.error(`❌ Distance validation failed: ${deliveryDistance}km > ${constraints.max_delivery_distance}km`);
                throw new BadRequestException(`Delivery distance of ${deliveryDistance}km exceeds the maximum of ${constraints.max_delivery_distance}km.`);
            }

            // Continue with the rest of the order creation using Mapbox-calculated values
            const { foodDetails } = await this.validateAndCalculateOrderDetails(data.orderDetails);

            const orderCalculation = await this.calculateOrderWithConstraints({
                addressId: data.addressId,
                restaurantId: data.restaurantId,
                items: data.orderDetails.map(item => ({ 
                    foodId: item.foodId, 
                    quantity: Number(item.quantity), 
                    toppings: item.selectedToppings, 
                    discountPercent: item.discountPercent 
                })),
                promotionCode: data.promotionCode,
                deliveryDistance,
                estimatedDeliveryTime: mapboxEstimatedDeliveryTime // Pass the Mapbox calculated time
            });

            if (data.promotionCode && orderCalculation.promotionError) {
                throw new BadRequestException(orderCalculation.promotionError);
            }

            let validatedDeliveryTime: Date | null = null;
            let estimatedDeliveryTime = orderCalculation.estimatedDeliveryTime;

            if (data.deliveryType === 'scheduled' && data.requestedDeliveryTime) {
                if (data.requestedDeliveryTime > constraints.max_delivery_time_min) {
                    throw new BadRequestException(`Scheduled time cannot exceed ${constraints.max_delivery_time_min} minutes.`);
                }
                const now = new Date();
                validatedDeliveryTime = new Date(now.getTime() + data.requestedDeliveryTime * 60000);
                estimatedDeliveryTime = data.requestedDeliveryTime;
            }

            const order = new Order();
            order.user = user;
            order.restaurant = restaurant;
            order.total = orderCalculation.total;
            order.note = data.note || '';
            order.address = address;
            order.date = new Date().toISOString();
            order.deliveryDistance = deliveryDistance; // Use Mapbox distance
            order.shippingFee = orderCalculation.shippingFee;
            order.estimatedDeliveryTime = estimatedDeliveryTime; // Use Mapbox time
            order.deliveryType = data.deliveryType || 'asap';
            order.requestedDeliveryTime = validatedDeliveryTime?.toISOString();
            order.paymentMethod = data.paymentMethod || 'cod';
            order.status = (data.paymentMethod && data.paymentMethod !== 'cod') ? 'processing_payment' : 'pending';

            if (data.promotionCode && orderCalculation.appliedPromotion) {
                const promotion = await queryRunner.manager.findOne(Promotion, { where: { code: data.promotionCode } });
                if (!promotion) {
                    throw new NotFoundException(`Promotion with code ${data.promotionCode} not found`);
                }
                order.promotionCode = promotion;
            }

            const savedOrder = await queryRunner.manager.save(Order, order);
            await this.createOrderDetails(savedOrder, foodDetails, queryRunner);

            if (order.promotionCode) {
                await this.promotionService.usePromotion(order.promotionCode.code, orderCalculation.subtotal);
            }

            await queryRunner.commitTransaction();
            this.logger.log(`✅ Enhanced order transaction committed for order ID: ${savedOrder.id}`);
            console.log(`Order created successfully with ID: ${savedOrder.id}`);
            return await this.getOrderById(savedOrder.id);

        } catch (error) {
            this.logger.error(`❌ Enhanced order creation failed: ${error.message}`, error.stack);
            if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getAllOrders() {
        const orders = await this.orderRepository.find({
            relations: [
                'user', 
                'restaurant', 
                'orderDetails', 
                'orderDetails.food', 
                'shippingDetail', 
                'shippingDetail.shipper', // Add this line to include shipper info
                'promotionCode', 
                'address'
            ]
        });

        // Clean sensitive data from all orders
        const cleanedOrders = orders.map(order => {
            this.cleanSensitiveData(order);
            return order;
        });

        return cleanedOrders;
    }

    async getOrderById(id: string, includeReviewInfo: boolean = false): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: [
                'user',
                'user.role',
                'user.address',
                'restaurant',
                'restaurant.address',
                'orderDetails',
                'orderDetails.food',
                'shippingDetail',
                'shippingDetail.shipper',
                'promotionCode',
                'address'
            ]
        });

        if (!order) throw new NotFoundException('Order not found');

        // The 'shippingDetail' relation from Order entity should already load this if it exists.
        // This explicit find is redundant if the relation is set up correctly but safe to keep.
        if (!order.shippingDetail) {
            const shippingDetail = await this.shippingDetailRepository.findOne({
                where: { order: { id: order.id } },
                relations: ['shipper']
            });
            if (shippingDetail) order.shippingDetail = shippingDetail;
        }

        // Add review information BEFORE cleaning sensitive data
        if (includeReviewInfo) {
            // Check if user has reviewed the food items in this order
            const foodReviews = await this.reviewRepository.find({
                where: {
                    user: { id: order.user.id },
                    food: { id: In(order.orderDetails.map(detail => detail.food.id)) },
                    type: 'food'
                },
                relations: ['food']
            });

            // Check if user has reviewed the shipper (if order has shipper)
            let shipperReview: Review | null = null;
            if (order.shippingDetail?.shipper) {
                shipperReview = await this.reviewRepository.findOne({
                    where: {
                        user: { id: order.user.id },
                        shipper: { id: order.shippingDetail.shipper.id },
                        type: 'shipper'
                    }
                });
            }

            // Add review information to the order object
            (order as any).reviewInfo = {
                hasReviewedFood: foodReviews.length > 0,
                hasReviewedShipper: !!shipperReview,
                foodReviews: foodReviews.map(review => ({
                    id: review.id,
                    foodId: review.food.id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt
                })),
                shipperReview: shipperReview ? {
                    id: shipperReview.id,
                    rating: shipperReview.rating,
                    comment: shipperReview.comment,
                    createdAt: shipperReview.createdAt
                } : null,
                canReviewFood: order.status === 'completed' && foodReviews.length === 0,
                canReviewShipper: order.status === 'completed' && order.shippingDetail?.shipper && !shipperReview
            };
        }

        // Clean sensitive data AFTER adding review info
        this.cleanSensitiveData(order);

        return order;
    }

    // Add a new method specifically for getting order with review info
    async getOrderByIdWithReviews(id: string) {
        return this.getOrderById(id, true);
    }

    async getOrdersByUser(
        userId: string,
        page: number = 1,
        pageSize: number = 10,
        status?: string
    ) {
        const query = this.orderRepository.createQueryBuilder('order')
            .leftJoin('order.restaurant', 'restaurant')
            .select([
                'order.id',
                'order.status',
                'order.total',
                'order.createdAt',
                'order.paymentMethod',
                'restaurant.id',
                'restaurant.name'
            ])
            .where('order.user = :userId', { userId });

        if (status) {
            query.andWhere('order.status = :status', { status });
        }

        query
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [items, totalItems] = await query.getManyAndCount();

        return {
            items,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }
    async getOrdersByRestaurant(
        restaurantId: string,
        page: number = 1,
        pageSize: number = 10,
        status?: string
    ) {
        const query = this.orderRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.restaurant', 'restaurant')
            .leftJoinAndSelect('order.address', 'address')
            .leftJoinAndSelect('order.orderDetails', 'orderDetails')
            .leftJoinAndSelect('orderDetails.food', 'food')
            .leftJoinAndSelect('food.category', 'category')
            .leftJoinAndSelect('order.shippingDetail', 'shippingDetail') // Add this line
            .leftJoinAndSelect('shippingDetail.shipper', 'shipper') // Add this line to include shipper info
            .where('order.restaurant.id = :restaurantId', { restaurantId })
            .orderBy('order.createdAt', 'DESC');

        if (status) {
            query.andWhere('order.status = :status', { status });
        }

        const [items, totalItems] = await query
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        // Clean sensitive data from the results
        const cleanedItems = items.map(order => {
            this.cleanSensitiveData(order);
            return order;
        });

        return {
            items: cleanedItems,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }
    async updateOrderStatus(id: string, status: string) {
        const order = await this.getOrderById(id);

        // Validate status transitions
        const validStatuses = ['pending', 'confirmed', 'delivering', 'completed', 'canceled', 'processing_payment'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException(`Invalid status. Valid values are: ${validStatuses.join(', ')}`);
        }

        // Check if status transition is valid
        const currentStatus = order.status;
        const validTransitions: Record<string, string[]> = {
            'pending': ['confirmed', 'canceled'],
            'confirmed': ['delivering', 'canceled'],
            'delivering': ['completed', 'canceled'],
            'processing_payment': ['pending', 'canceled']
        };
        
        if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
            throw new BadRequestException(`Cannot change status from ${currentStatus} to ${status}`);
        }

        order.status = status;
        const updatedOrder = await this.orderRepository.save(order);

        // Publish event for status changes (not just pending)
        await pubSub.publish('orderStatusUpdated', {
            orderStatusUpdated: updatedOrder
        });
        
        this.logger.log(`Order ${id} status updated to ${status}`);



        // Create notification
        const notification = await this.notificationRepository.save({
            description: 'Cập nhật trạng thái đơn hàng',
            content: `Đơn hàng của bạn đã chuyển sang trạng thái: ${status}`,
            receiveUser: order.user.id,
            type: 'order',
            isRead: false,
        });

        await pubSub.publish('notificationCreated', {
            notificationCreated: notification
        });

        return updatedOrder;
    }

    async confirmOrder(orderId: string, restaurantOwnerId: string): Promise<Order> {
        this.logger.log(`Confirming order ${orderId} for restaurant owner ${restaurantOwnerId}`);

        const order = await this.getOrderById(orderId);

        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        // Only confirm if order is in pending state
        if (order.status !== 'pending') {
            throw new BadRequestException(`Order is not in a confirmable state`);
        }

        // Update order status
        order.status = 'confirmed';
        const confirmedOrder = await this.orderRepository.save(order);

        this.logger.log(`Order ${orderId} status updated to confirmed`);

        try {
            // Create pending shipper assignment - this will be picked up by the automated system
            const pendingAssignment = await this.pendingAssignmentService.addPendingAssignment(
                confirmedOrder.id,
                1 // Priority: 1 = normal, higher numbers = higher priority
            );

            this.logger.log(`Created pending shipper assignment ${pendingAssignment.id} for order ${orderId}`);
            this.logger.log(`Automated system will find and notify nearby shippers for order ${orderId}`);

            return confirmedOrder;
        } catch (error) {
            this.logger.error(`Failed to create pending shipper assignment for order ${orderId}:`, error);
            
            // Don't fail the order confirmation, just log the error
            // The assignment can be created manually or through retry mechanisms
            this.logger.warn(`Order ${orderId} confirmed but shipper assignment failed - manual intervention may be required`);
            
            return confirmedOrder;
        }
    }

    // private async calculateOrderWithConstraints(data: {
    //     addressId: string,
    //     restaurantId: string,
    //     items: {
    //       foodId: string;
    //       quantity: number;
    //       discountPercent?: number;
    //       toppings?: { id: string; price: number }[];
    //     }[],
    //     promotionCode?: string,
    //     deliveryDistance: number,
    //     estimatedDeliveryTime?: number // Add this parameter
    //   }) {
    //     const { deliveryDistance } = data;
    //     const shippingFee = await this.systemConstraintsService.calculateShippingFee(deliveryDistance);
    //     const maxDeliveryTime = await this.systemConstraintsService.getMaxDeliveryTime();
        
    //     // Use provided estimatedDeliveryTime or calculate fallback
    //     const estimatedDeliveryTime = data.estimatedDeliveryTime || 
    //         Math.min(maxDeliveryTime, Math.ceil(deliveryDistance * 2) + 20);
      
    //     const shipperCommissionRate = 0.8;
    //     const shipperEarnings = Math.round(shippingFee * shipperCommissionRate);
    //     const platformFee = shippingFee - shipperEarnings;
      
    //     let foodTotal = 0;
    //     for (const item of data.items) {
    //         const food = await this.foodRepository.findOne({ where: { id: item.foodId } });
    //         if (!food) continue;
          
    //         const discountPercent = item.discountPercent || food.discountPercent || 0;
    //         const discountedPrice = Number(food.price) - (Number(food.price) * discountPercent) / 100;
          
    //         const toppingTotal = (item.toppings || []).reduce((sum, t) => sum + Number(t.price), 0);
          
    //         foodTotal += (discountedPrice + toppingTotal) * item.quantity;
    //       }
      
    //     let appliedPromotion: Promotion | null = null;
    //     let promotionDiscount = 0;
    //     let promotionError: string | null = null;
    //     const subtotal = foodTotal + shippingFee;
      
    //     if (data.promotionCode) {
    //       const validation = await this.promotionService.validatePromotion(data.promotionCode, subtotal);
    //       if (validation.valid && validation.promotion) {
    //         appliedPromotion = validation.promotion;
    //         promotionDiscount = validation.calculatedDiscount || 0;
    //       } else {
    //         promotionError = validation.reason || 'Invalid promotion code.';
    //       }
    //     }
      
    //     const total = Math.max(0, subtotal - promotionDiscount);
    //     console.log(`>>>>>>>>>>Final Total: ${total}`);
    //     return {
    //       foodTotal,
    //       shippingFee,
    //       shipperEarnings,
    //       shipperCommissionRate,
    //       platformFee,
    //       distance: Number(deliveryDistance.toFixed(2)),
    //       subtotal,
    //       promotionDiscount,
    //       total,
    //       estimatedDeliveryTime,
    //       appliedPromotion,
    //       promotionError
    //     };
    //   }
      

    // This method is now a wrapper for the new constrained calculation
    async calculateOrder(data: {
        addressId: string,
        restaurantId: string,
        items: {
            foodId: string;
            quantity: number;
            discountPercent?: number;
            toppings?: { id: string; price: number }[];
          }[],
        promotionCode?: string
    }) {
        this.logger.log(`🧮 === CALCULATE ORDER WITH MAPBOX ===`);
        
        const address = await this.addressRepository.findOne({ where: { id: data.addressId } });
        const restaurant = await this.restaurantRepository.findOne({ 
            where: { id: data.restaurantId },
            relations: ['address'] 
        });
        
        if (!address || !restaurant || !restaurant.address) {
            throw new Error('Invalid address or restaurant');
        }

        const userLat = Number(address.latitude);
        const userLng = Number(address.longitude);
        const restaurantLat = Number(restaurant.address.latitude);
        const restaurantLng = Number(restaurant.address.longitude);

        // 🗺️ Use Mapbox for actual route calculation
        const routeResult = await this.mapboxService.calculateBikeRoute(
            restaurantLat, restaurantLng,
            userLat, userLng
        );

        const deliveryDistance = routeResult.distance;
        const estimatedDeliveryTime = Math.round(routeResult.duration / 60);

        this.logger.log(`📏 Mapbox calculation:`);
        this.logger.log(`   - Distance: ${deliveryDistance}km`);
        this.logger.log(`   - Duration: ${estimatedDeliveryTime} minutes`);

        return this.calculateOrderWithConstraints({ 
            ...data, 
            deliveryDistance,
            estimatedDeliveryTime
        });
    }

    // Update calculateOrderWithCustomAddress to use Mapbox
    async calculateOrderWithCustomAddress(
        address: {
            street: string;
            ward: string;
            district: string;
            city: string;
            latitude: number;
            longitude: number;
            label?: string;
        },
        restaurantId: string,
        items: {
            foodId: string;
            quantity: number;
            discountPercent?: number;
            toppings?: { id: string; price: number }[];
        }[],
        promotionCode?: string
    ) {
        // Fetch restaurant with address
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId },
            relations: ['address'],
        });

        if (!restaurant || !restaurant.address) {
            throw new Error('Invalid restaurant');
        }

        // 🗺️ Use Mapbox for actual route calculation
        const routeResult = await this.mapboxService.calculateBikeRoute(
            Number(restaurant.address.latitude),
            Number(restaurant.address.longitude),
            Number(address.latitude),
            Number(address.longitude)
        );

        const distance = routeResult.distance;
        const estimatedDeliveryTime = Math.round(routeResult.duration / 60);

        this.logger.log(`📏 Custom address route: ${distance}km, ${estimatedDeliveryTime} minutes`);

        // Use system constraints to calculate shipping fee
        const shippingFee = await this.systemConstraintsService.calculateShippingFee(distance);

        // ... rest of the calculation logic using the Mapbox values

        let foodTotal = 0;
        for (const item of items) {
            const food = await this.foodRepository.findOne({ where: { id: item.foodId } });
            if (!food) continue;

            const basePrice = Number(food.price);
            const discountPercent = item.discountPercent ?? 0;
            const discountedPrice = basePrice - (basePrice * discountPercent) / 100;
            const toppingTotal = item.toppings?.reduce((sum, t) => sum + Number(t.price), 0) || 0;

            foodTotal += (discountedPrice + toppingTotal) * item.quantity;
        }

        let promotionDiscount = 0;
        let appliedPromotion: Promotion | null = null;
        let promotionError: string | null = null;

        // Apply promotion logic...
        if (promotionCode) {
            try {
                const validation = await this.promotionService.validatePromotion(
                    promotionCode,
                    foodTotal + shippingFee
                );

                if (validation.valid && validation.promotion) {
                    appliedPromotion = validation.promotion;
                    // Calculate discount based on promotion type
                    if (appliedPromotion.type === PromotionType.FOOD_DISCOUNT) {
                        promotionDiscount = this.promotionService.calculateDiscount(appliedPromotion, foodTotal);
                    } else if (appliedPromotion.type === PromotionType.SHIPPING_DISCOUNT) {
                        promotionDiscount = Math.min(
                            this.promotionService.calculateDiscount(appliedPromotion, shippingFee),
                            shippingFee
                        );
                    }
                } else {
                    promotionError = validation.reason || 'Invalid promotion code';
                }
            } catch (error) {
                promotionError = 'Failed to validate promotion code';
                this.logger.error(`Promotion validation error: ${error.message}`);
            }
        }

        const subtotal = foodTotal + shippingFee;
        const total = Math.max(0, subtotal - promotionDiscount);

        return {
            foodTotal,
            shippingFee,
            distance,
            estimatedDeliveryTime,
            subtotal,
            promotionDiscount,
            total,
            appliedPromotion: appliedPromotion ? {
                id: appliedPromotion.id,
                code: appliedPromotion.code,
                description: appliedPromotion.description,
                type: appliedPromotion.type,
                discountAmount: promotionDiscount,
            } : null,
            promotionError,
        };
    }

    // Update calculateOrderWithConstraints to accept estimatedDeliveryTime
    private async calculateOrderWithConstraints(data: {
        addressId: string,
        restaurantId: string,
        items: {
            foodId: string;
            quantity: number;
            discountPercent?: number;
            toppings?: { id: string; price: number }[];
        }[],
        promotionCode?: string,
        deliveryDistance: number,
        estimatedDeliveryTime?: number // Add this parameter
    }) {
        const { deliveryDistance } = data;
        const shippingFee = await this.systemConstraintsService.calculateShippingFee(deliveryDistance);
        const maxDeliveryTime = await this.systemConstraintsService.getMaxDeliveryTime();
        
        // Use provided estimatedDeliveryTime or calculate fallback
        const estimatedDeliveryTime = data.estimatedDeliveryTime || 
            Math.min(maxDeliveryTime, Math.ceil(deliveryDistance * 2) + 20);
      
        const shipperCommissionRate = 0.8;
        const shipperEarnings = Math.round(shippingFee * shipperCommissionRate);
        const platformFee = shippingFee - shipperEarnings;
      
        let foodTotal = 0;
        for (const item of data.items) {
            const food = await this.foodRepository.findOne({ where: { id: item.foodId } });
            if (!food) continue;

            const discountPercent = item.discountPercent || food.discountPercent || 0;
            const discountedPrice = Number(food.price) - (Number(food.price) * discountPercent) / 100;
            const toppingTotal = (item.toppings || []).reduce((sum, t) => sum + Number(t.price), 0);

            foodTotal += (discountedPrice + toppingTotal) * item.quantity;
        }

        let appliedPromotion: Promotion | null = null;
        let promotionDiscount = 0;
        let promotionError: string | null = null;
        const subtotal = foodTotal + shippingFee;

        if (data.promotionCode) {
            const validation = await this.promotionService.validatePromotion(data.promotionCode, subtotal);
            if (validation.valid && validation.promotion) {
                appliedPromotion = validation.promotion;
                promotionDiscount = validation.calculatedDiscount || 0;
            } else {
                promotionError = validation.reason || 'Invalid promotion code.';
            }
        }

        const total = Math.max(0, subtotal - promotionDiscount);

        return {
            foodTotal,
            shippingFee,
            shipperEarnings,
            shipperCommissionRate,
            platformFee,
            distance: Number(deliveryDistance.toFixed(2)),
            subtotal,
            promotionDiscount,
            total,
            estimatedDeliveryTime,
            appliedPromotion,
            promotionError
        };
    }

    async deleteOrder(id: string) {
        // First make sure the order exists
        const order = await this.getOrderById(id);

        // Use a transaction for deleting order and details
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Delete associated order details
            if (order.orderDetails && order.orderDetails.length > 0) {
                await queryRunner.manager.delete(OrderDetail, {
                    order: { id: order.id }
                });
            }

            // Delete the order
            await queryRunner.manager.delete(Order, id);

            await queryRunner.commitTransaction();

            return { message: 'Order and its details deleted successfully' };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async processPayment(orderId: string, paymentData: PaymentDto) {
        const order = await this.getOrderById(orderId);

        if (order.status !== 'pending') {
            throw new BadRequestException('Cannot process payment for an order that is not pending');
        }

        // Use a transaction for payment processing
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validate payment data
            if (!paymentData.method) {
                throw new BadRequestException('Payment method is required');
            }

            // Here you would integrate with a real payment gateway
            // For demonstration, we'll just simulate different payment results

            let paymentSuccess = true;
            let paymentMessage = 'Payment processed successfully';

            // Simulate payment processing based on method
            switch (paymentData.method) {
                case 'credit_card':
                    // Validate credit card info
                    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
                        throw new BadRequestException('Credit card information is incomplete');
                    }
                    // Additional validation would happen here in a real system
                    break;

                case 'paypal':
                    // Verify paypal token or account
                    if (!paymentData.paypalToken) {
                        throw new BadRequestException('PayPal token is required');
                    }
                    break;

                case 'cash':
                    // Cash on delivery, no validation needed
                    break;

                default:
                    throw new BadRequestException('Unsupported payment method');
            }

            // Update order status based on payment result
            if (paymentSuccess) {
                // For cash payments, set to processing
                if (paymentData.method === 'cash') {
                    order.status = 'processing';
                } else {
                    // For electronic payments, you might set to 'paid' or 'processing'
                    order.status = 'processing';
                }

                // Store payment details (in a real system, this would be in a Payment entity)
                order.paymentMethod = paymentData.method;
                order.paymentDate = new Date().toISOString();

                await this.orderRepository.save(order);

                await queryRunner.commitTransaction();

                return {
                    success: true,
                    message: paymentMessage,
                    order: await this.getOrderById(orderId)
                };
            } else {
                throw new BadRequestException('Payment failed');
            }
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
    // Get order details for a specific order
    async getOrderDetails(orderId: string) {
        const order = await this.getOrderById(orderId);
        return order.orderDetails;
    }
    /**
 * Confirm payment for an order
 * @param orderId The ID of the order to confirm payment for
 * @returns The updated order
 */
    async confirmPayment(orderId: string): Promise<Order> {
        log(`Confirming payment for order ${orderId}`);

        const order = await this.getOrderById(orderId);

        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        // Only confirm payment if order is in pending or processing status
        if (order.status !== 'pending' && order.status !== 'processing') {
            throw new BadRequestException(`Cannot confirm payment for an order with status ${order.status}`);
        }

        // Update order status and payment details
        order.status = 'completed';
        order.isPaid = true;
        order.paymentDate = new Date().toISOString();

        // Save the updated order
        const updatedOrder = await this.orderRepository.save(order);

        // 🔥 PUBLISH orderCreated EVENT when payment is confirmed
        await pubSub.publish('orderCreated', {
            orderCreated: updatedOrder
        });

        // Also publish orderStatusUpdated for consistency
        await pubSub.publish('orderStatusUpdated', {
            orderStatusUpdated: updatedOrder
        });

        log(`Payment confirmed for order ${orderId} - orderCreated event published`);

        return updatedOrder;
    }

    // Runs every 10 minutes
    @Cron(CronExpression.EVERY_10_MINUTES)
    async autoCancelStuckOrders() {
        const timeoutMinutes = 15;
        const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

        // Find stuck orders
        const stuckOrders = await this.orderRepository.find({
            where: {
                status: 'processing_payment',
                createdAt: LessThan(timeoutDate),
            },
        });

        if (stuckOrders.length) {
            this.logger.log(`Auto-canceling ${stuckOrders.length} stuck orders...`);
        }

        for (const order of stuckOrders) {
            order.status = 'canceled';
            await this.orderRepository.save(order);

            // Optionally, update related checkout status
            const checkout = await this.checkoutRepository.findOne({ where: { orderId: order.id } });
            if (checkout && checkout.status !== CheckoutStatus.COMPLETED && checkout.status !== CheckoutStatus.CANCELLED) {
                checkout.status = CheckoutStatus.CANCELLED;
                await this.checkoutRepository.save(checkout);
            }

            this.logger.log(`Order ${order.id} auto-canceled due to payment timeout.`);
        }
    }

    // Add method to validate promotion for an order
    async validatePromotionForOrder(
        promotionCode: string,
        addressId: string,
        restaurantId: string,
        items: { foodId: string, quantity: number }[]
    ) {
        const orderCalculation = await this.calculateOrder({
            addressId,
            restaurantId,
            items,
            promotionCode
        });

        return {
            valid: !orderCalculation.promotionError,
            promotion: orderCalculation.appliedPromotion,
            discount: orderCalculation.promotionDiscount,
            error: orderCalculation.promotionError,
            orderTotal: orderCalculation.total
        };
    }
    
    async getMinimalOrderHistoryForQuickReorder(userId: string, limit = 3) {
        const query = this.orderRepository.createQueryBuilder('order')
          .leftJoinAndSelect('order.orderDetails', 'orderDetail')
          .leftJoinAndSelect('orderDetail.food', 'food')
          .leftJoinAndSelect('food.restaurant', 'restaurant')
          .where('order.user_id = :userId', { userId })
          .orderBy('order.createdAt', 'DESC')
          .take(limit);
      
        const orders = await query.getMany();
      
        const quickOrders = orders.map(order => ({
          orderId: order.id,
          restaurantId: order.orderDetails?.[0]?.food?.restaurant?.id,
          totalAmount: order.total,
          orderDetails: order.orderDetails.map(detail => ({
            foodName: detail.food?.name,
            quantity: detail.quantity,
            price: detail.price,
          })),
        }));
      
        return quickOrders;
      }
      
    
    async getOrderHistory(userId: string, page: number = 1, pageSize: number = 10) {
        // Tạo query để lấy các đơn hàng của người dùng
        const query = this.orderRepository.createQueryBuilder('order')
          .leftJoinAndSelect('order.orderDetails', 'orderDetail') // Lấy thông tin chi tiết món ăn
          .leftJoinAndSelect('orderDetail.food', 'food') // Lấy thông tin món ăn từ orderDetails
          .where('order.user_id = :userId', { userId })
          .orderBy('order.createdAt', 'DESC'); // Sắp xếp theo ngày tạo đơn hàng (mới nhất lên đầu)
      
        // Áp dụng phân trang
        const [orders, totalOrders] = await query
          .skip((page - 1) * pageSize)
          .take(pageSize)
          .getManyAndCount();
      
        // Chuyển đổi và trả về dữ liệu
        const ordersHistory = orders.map(order => ({
          orderId: order.id,
          restaurantName: order.restaurant?.name,
          totalAmount: order.total,
          status: order.status,
          date: order.createdAt,
          orderDetails: order.orderDetails.map(orderDetail => ({
            foodName: orderDetail.food.name,
            quantity: orderDetail.quantity,
            price: orderDetail.price,
            totalPrice: (parseFloat(orderDetail.price) * orderDetail.quantity).toFixed(2),
          })),
        }));
      
        return {
          items: ordersHistory,
          totalItems: totalOrders,
          page,
          pageSize,
          totalPages: Math.ceil(totalOrders / pageSize),
        };
      }
      

    // Add new cron job to auto-cancel orders without shippers
    @Cron(CronExpression.EVERY_10_MINUTES)
    async autoCancelUnassignedOrders() {
        const timeoutMinutes = 30; // Cancel orders after 30 minutes without shipper
        const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

        this.logger.log(`🔍 Checking for pending assignments older than ${timeoutMinutes} minutes...`);

        // Find pending assignments that are too old
        const expiredAssignments = await this.pendingAssignmentService.getExpiredAssignments(timeoutDate);

        if (expiredAssignments.length > 0) {
            this.logger.log(`🚫 Found ${expiredAssignments.length} expired assignments to cancel`);
        }

        for (const assignment of expiredAssignments) {
            try {
                const order = assignment.order;
                
                // Double-check order is still confirmed and unassigned
                if (order.status !== 'confirmed') {
                    this.logger.log(`⏭️ Skipping order ${order.id} - status already changed to ${order.status}`);
                    continue;
                }

                // Check if order already has a shipper
                const currentOrder = await this.orderRepository.findOne({
                    where: { id: order.id },
                    relations: ['shippingDetail']
                });

                if (currentOrder?.shippingDetail) {
                    this.logger.log(`⏭️ Skipping order ${order.id} - already assigned to shipper`);
                    // Clean up the pending assignment
                    await this.pendingAssignmentService.removePendingAssignment(order.id);
                    continue;
                }

                // Update order status to canceled
                order.status = 'canceled';
                await this.orderRepository.save(order);

                // Remove the pending assignment
                await this.pendingAssignmentService.removePendingAssignmentById(assignment.id);

                // Publish event for order cancellation
                await pubSub.publish('orderStatusUpdated', {
                    orderStatusUpdated: order
                });

                // Calculate how long the assignment was pending
                const pendingDuration = Math.round((Date.now() - assignment.createdAt.getTime()) / (1000 * 60));
                
                this.logger.log(`❌ Auto-canceled order ${order.id} (${order.restaurant?.name}) - pending for ${pendingDuration} minutes without shipper`);

                // Optional: Send notifications
                await this.notifyOrderCancellation(order, 'No delivery driver available in your area');

            } catch (error) {
                this.logger.error(`❌ Failed to auto-cancel order ${assignment.order.id}:`, error);
            }
        }

        if (expiredAssignments.length > 0) {
            this.logger.log(`🎯 Auto-cancellation completed: ${expiredAssignments.length} orders canceled`);
        }
    }

    /**
     * Send notifications for order cancellation
     */
    private async notifyOrderCancellation(order: Order, reason: string = 'No shipper available'): Promise<void> {
        try {
            this.logger.log(`📧 Order ${order.id} canceled: ${reason}`);
            
            // Add your notification logic here:
            // - Email notifications
            // - Push notifications  
            // - SMS notifications
            // - In-app notifications
            
            this.logger.log(`✅ Cancellation notifications processed for order ${order.id}`);

        } catch (error) {
            this.logger.error(`❌ Failed to send cancellation notifications for order ${order.id}:`, error);
        }
    }
    /**
 * Clean sensitive data from order and its relations
 */
private cleanSensitiveData(order: Order): void {
    // Clean user data
    if (order.user) {
        delete (order.user as any).password;
        delete (order.user as any).resetPasswordToken;
        delete (order.user as any).resetPasswordExpires;
        delete (order.user as any).birthday;
        delete (order.user as any).lastLoginAt;
        delete (order.user as any).createdAt;
        delete (order.user as any).googleId;

        // Clean role data
        if (order.user.role) {
            delete (order.user.role as any).isSystem;
            delete (order.user.role as any).description;
            delete (order.user.role as any).createdAt;
            delete (order.user.role as any).updatedAt;
        }

        // Clean address coordinates for privacy
        if (order.user.address) {
            order.user.address.forEach(addr => {
                delete (addr as any).latitude;
                delete (addr as any).longitude;
            });
        }
    }

    // Clean restaurant data
    if (order.restaurant) {
        delete (order.restaurant as any).openTime;
        delete (order.restaurant as any).closeTime;
        delete (order.restaurant as any).licenseCode;
        delete (order.restaurant as any).certificateImage;
        delete (order.restaurant as any).updatedAt;
        delete (order.restaurant as any).createdAt;

    }

    // Clean food business data
    if (order.orderDetails) {
        order.orderDetails.forEach(detail => {
            if (detail.food) {
                delete (detail.food as any).soldCount;
                delete (detail.food as any).purchasedNumber;
            }
        });
    }

    // Clean shipper sensitive data
    if (order.shippingDetail?.shipper) {
        const shipper = order.shippingDetail.shipper;
        delete (shipper as any).password;
        delete (shipper as any).resetPasswordToken;
        delete (shipper as any).resetPasswordExpires;
        delete (shipper as any).email;
        delete (shipper as any).birthday;
        delete (shipper as any).lastLoginAt;
        delete (shipper as any).createdAt;
        delete (shipper as any).googleId;
        delete (shipper as any).address;
        delete (shipper as any).role;
    }


    // Clean promotion sensitive data
    if (order.promotionCode) {
        delete (order.promotionCode as any).usageLimit;
        delete (order.promotionCode as any).usageCount;
        delete (order.promotionCode as any).createdAt;
        delete (order.promotionCode as any).updatedAt;
    }
}

// Add this method to clean up old temporary addresses
    @Cron(CronExpression.EVERY_HOUR)
    async cleanupTemporaryAddresses() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        try {
            const result = await this.addressRepository.delete({
                isTemporary: true,
                createdAt: LessThan(oneDayAgo)
            });
            
            if (result.affected && result.affected > 0) {
                this.logger.log(`🗑️ Cleaned up ${result.affected} temporary addresses older than 24 hours`);
            }
        } catch (error) {
            this.logger.error(`❌ Failed to cleanup temporary addresses: ${error.message}`);
        }
    }
}