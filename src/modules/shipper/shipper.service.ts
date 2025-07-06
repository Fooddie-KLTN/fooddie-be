import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Order } from 'src/entities/order.entity';
import { ShippingDetail, ShippingStatus } from 'src/entities/shippingDetail.entity';
import { User } from 'src/entities/user.entity';
import { pubSub } from 'src/pubsub';
import { PendingAssignmentService } from 'src/pg-boss/pending-assignment.service';
import { PendingShipperAssignment } from 'src/entities/pendingShipperAssignment.entity';
import { format, addDays, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { UpdateDriverProfileDto } from './dto/update-driver-dto';
import { CertificateStatus, ShipperCertificateInfo } from 'src/entities/shipperCertificateInfo.entity';
import { OrderService } from '../order/order.service';

@Injectable()
export class ShipperService {
  private readonly logger = new Logger(ShipperService.name);

  // In-memory storage for temporary assignments
  private pendingAssignments: Map<string, {
    orderId: string;
    shipperId: string;
    expiresAt: Date;
    timeoutId: NodeJS.Timeout;
  }> = new Map();

  // Track which shippers have been offered each order
  private orderOfferHistory: Map<string, Set<string>> = new Map();

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ShippingDetail)
    private shippingDetailRepository: Repository<ShippingDetail>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PendingShipperAssignment)
    private pendingShipperAssignmentRepository: Repository<PendingShipperAssignment>,
    @InjectRepository(ShipperCertificateInfo)
    private readonly certRepo: Repository<ShipperCertificateInfo>,
    private pendingAssignmentService: PendingAssignmentService, // Inject the service
    private orderService: OrderService, // Inject the OrderService for finalizing assignments
  ) { }

  /**
   * Request order assignment (temporary hold)
   */
  async requestOrderAssignment(orderId: string, shipperId: string) {
    // Check if order exists and is available
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant', 'user', 'shippingDetail']
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== 'confirmed') {
      throw new BadRequestException('Order must be confirmed to assign to shipper');
    }

    if (order.shippingDetail) {
      throw new ConflictException('Order already assigned to a shipper');
    }

    // Check if this shipper already has a pending assignment for this order
    const existingAssignment = Array.from(this.pendingAssignments.values())
      .find(assignment => assignment.orderId === orderId && assignment.shipperId === shipperId);

    if (existingAssignment) {
      throw new ConflictException('You already have a pending assignment for this order');
    }

    // Check if another shipper has a pending assignment
    const otherAssignment = Array.from(this.pendingAssignments.values())
      .find(assignment => assignment.orderId === orderId);

    if (otherAssignment) {
      throw new ConflictException('Order is currently being considered by another shipper');
    }

    // Check if shipper exists and is approved
    const shipper = await this.userRepository.findOne({
      where: { id: shipperId },
      relations: ['role', 'shipperCertificateInfo']
    });

    if (!shipper || shipper.role?.name !== 'shipper' ||
      shipper.shipperCertificateInfo?.status !== 'APPROVED') {
      throw new BadRequestException('Invalid or unapproved shipper');
    }

    // Create temporary assignment (2 minutes to decide)
    const assignmentId = `${orderId}-${shipperId}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Set timeout for auto-rejection
    const timeoutId = setTimeout(() => {
      this.autoRejectAssignment(assignmentId);
    }, 2 * 60 * 1000);

    this.pendingAssignments.set(assignmentId, {
      orderId,
      shipperId,
      expiresAt,
      timeoutId
    });

    this.logger.log(`Temporary assignment created for order ${orderId} to shipper ${shipperId}`);

    return {
      assignmentId,
      expiresAt,
      message: 'You have 2 minutes to accept this order'
    };
  }

  /**
   * Accept the assignment and finalize order
   */
  async acceptAssignment(assignmentId: string, shipperId: string) {
    const assignment = this.pendingAssignments.get(assignmentId);

    if (!assignment) {
      throw new BadRequestException('Assignment not found or already processed');
    }

    if (assignment.shipperId !== shipperId) {
      throw new BadRequestException('This assignment does not belong to you');
    }

    if (assignment.expiresAt < new Date()) {
      this.pendingAssignments.delete(assignmentId);
      throw new BadRequestException('Assignment has expired');
    }

    // Clear the timeout
    clearTimeout(assignment.timeoutId);
    this.pendingAssignments.delete(assignmentId);

    // Finalize the order assignment
    const result = await this.assignOrderToShipper(assignment.orderId, shipperId);

    // Notify other shippers that this order is no longer available
    await pubSub.publish('orderAssignedToShipper', {
      orderAssignedToShipper: {
        orderId: assignment.orderId,
        shipperId
      }
    });

    this.logger.log(`Order ${assignment.orderId} accepted by shipper ${shipperId}`);

    return result;
  }

  /**
   * Reject the assignment
   */
  async rejectAssignment(assignmentId: string, shipperId: string) {
    const assignment = this.pendingAssignments.get(assignmentId);

    if (!assignment) {
      throw new BadRequestException('Assignment not found or already processed');
    }

    if (assignment.shipperId !== shipperId) {
      throw new BadRequestException('This assignment does not belong to you');
    }

    // Clear the timeout and remove assignment
    clearTimeout(assignment.timeoutId);
    this.pendingAssignments.delete(assignmentId);

    // Add this shipper to the offer history for this order
    if (!this.orderOfferHistory.has(assignment.orderId)) {
      this.orderOfferHistory.set(assignment.orderId, new Set());
    }
    this.orderOfferHistory.get(assignment.orderId)!.add(shipperId);

    // Reassign to other available shippers
    await this.reassignToOtherShippers(assignment.orderId);

    this.logger.log(`Order ${assignment.orderId} rejected by shipper ${shipperId}`);

    return { message: 'Order rejected successfully' };
  }

  /**
   * Auto-reject expired assignments
   */
  private async autoRejectAssignment(assignmentId: string) {
    const assignment = this.pendingAssignments.get(assignmentId);

    if (assignment) {
      this.pendingAssignments.delete(assignmentId);

      // Add to offer history
      if (!this.orderOfferHistory.has(assignment.orderId)) {
        this.orderOfferHistory.set(assignment.orderId, new Set());
      }
      this.orderOfferHistory.get(assignment.orderId)!.add(assignment.shipperId);

      // Reassign to other shippers
      await this.reassignToOtherShippers(assignment.orderId);

      this.logger.log(`Assignment ${assignmentId} auto-expired, reassigning order ${assignment.orderId}`);
    }
  }

  /**
   * Reassign order to other available shippers
   */
  private async reassignToOtherShippers(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant', 'user', 'address', 'orderDetails', 'orderDetails.food', 'shippingDetail']
    });

    // Only reassign if order is still confirmed and not assigned
    if (order && order.status === 'confirmed' && !order.shippingDetail) {
      const excludedShipperIds = Array.from(this.orderOfferHistory.get(orderId) || []);

      await pubSub.publish('orderReassignedToShippers', {
        orderReassignedToShippers: {
          order,
          excludedShipperIds
        }
      });

      this.logger.log(`Order ${orderId} reassigned to remaining shippers`);
    } else {
      // Clean up offer history if order is no longer available
      this.orderOfferHistory.delete(orderId);
    }
  }

  /**
   * Original method - now only called internally after acceptance
   */
  async assignOrderToShipper(orderId: string, shipperId: string, responseTimeSeconds: number = 120) {
    // Check if order exists and is confirmed
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant', 'user', 'shippingDetail']
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== 'confirmed') {
      throw new BadRequestException('Order must be confirmed to assign to shipper');
    }

    if (order.shippingDetail) {
      throw new ConflictException('Order already assigned to a shipper');
    }

    // Check if shipper exists and is approved
    const shipper = await this.userRepository.findOne({
      where: { id: shipperId },
      relations: ['role', 'shipperCertificateInfo']
    });

    if (!shipper || shipper.role?.name !== 'shipper' ||
      shipper.shipperCertificateInfo?.status !== 'APPROVED') {
      throw new BadRequestException('Invalid or unapproved shipper');
    }

    // Create shipping detail
    const shippingDetail = new ShippingDetail();
    shippingDetail.order = order;
    shippingDetail.shipper = shipper;
    shippingDetail.status = ShippingStatus.SHIPPING;
    shippingDetail.estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    await this.shippingDetailRepository.save(shippingDetail);

    // Update order status to 'shipper_received'
    order.status = 'shipper_received';
    await this.orderRepository.save(order);

    // Remove from pending assignments
    try {
      await this.pendingShipperAssignmentRepository.delete({
        order: { id: orderId },
      });

      this.logger.log(`Removed order ${orderId} from pending assignments after assignment to shipper`);
    } catch (error) {
      this.logger.error(`Failed to remove order ${orderId} from pending assignments: ${error.message}`);
    }

    // Publish status update to user
    await pubSub.publish('orderStatusUpdated', {
      orderStatusUpdated: order
    });

    // Clean up offer history for this order
    this.orderOfferHistory.delete(orderId);

    this.logger.log(`Order ${orderId} assigned to shipper ${shipperId}`);


    shipper.activeDeliveries = (shipper.activeDeliveries || 0) + 1;
    shipper.responseTimeMinutes = Math.max(
      (shipper.responseTimeMinutes || 0) + Math.ceil(responseTimeSeconds / 60),
      1
    );
    await this.userRepository.save(shipper);


    return shippingDetail;
  }

  async getOrder(orderId: string, userId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant', 'user', 'shippingDetail']
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!userId)
      throw new BadRequestException('User ID is required');


    order.status = 'delivering'; // Set status to delivering for the shipper
    await this.orderRepository.save(order);

    // 🚨 MISSING: Add this publish statement
    await pubSub.publish('orderStatusUpdated', {
      orderStatusUpdated: order
    });


    const shippingDetail = order.shippingDetail;

    if (!shippingDetail)
    {
      throw new NotFoundException('Shipping detail not found for this order');
    }

    shippingDetail.status = ShippingStatus.SHIPPING;

    await this.shippingDetailRepository.save(shippingDetail);


    return order;
  }

  /**
   * Get pending assignment for a shipper
   */
  getPendingAssignmentForShipper(shipperId: string) {
    for (const [assignmentId, assignment] of this.pendingAssignments.entries()) {
      if (assignment.shipperId === shipperId) {
        return {
          assignmentId,
          ...assignment
        };
      }
    }
    return null;
  }

  /**
   * Clean up expired assignments and offer history
   */
  async cleanupExpiredData() {
    const now = new Date();

    // Clean up expired assignments
    for (const [assignmentId, assignment] of this.pendingAssignments.entries()) {
      if (assignment.expiresAt < now) {
        clearTimeout(assignment.timeoutId);
        this.pendingAssignments.delete(assignmentId);
      }
    }

    // Clean up old offer history (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const orderId of this.orderOfferHistory.keys()) {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        select: ['id', 'status', 'createdAt']
      });

      if (!order || order.status !== 'confirmed' || order.createdAt < oneHourAgo) {
        this.orderOfferHistory.delete(orderId);
      }
    }
  }

async markOrderCompleted(orderId: string, shipperId: string) {
    const shippingDetail = await this.shippingDetailRepository.findOne({
      where: {
        order: { id: orderId },
        shipper: { id: shipperId },
      },
      relations: ['order', 'shipper'],
    });

    if (!shippingDetail) {
      throw new NotFoundException('Không tìm thấy thông tin vận chuyển');
    }

    shippingDetail.status = ShippingStatus.COMPLETED;
    shippingDetail.actualDeliveryTime = new Date();

    await this.shippingDetailRepository.save(shippingDetail);

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'restaurant']
    });
    
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    
    order.status = 'completed';
    await this.orderRepository.save(order);

    await this.orderService.updateOrderStatus(orderId, 'completed');
    
    // 🚨 ADD: Publish the status update
    await pubSub.publish('orderStatusUpdated', {
      orderStatusUpdated: order
    });
    
    const shipper = await this.userRepository.findOne({
      where: { id: shipperId },
      relations: ['shipperCertificateInfo'],
    });
    
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }

    // Calculate delivery time and earnings
    const deliveryTime = shippingDetail.estimatedDeliveryTime && shippingDetail.actualDeliveryTime 
      ? Math.abs(shippingDetail.actualDeliveryTime.getTime() - shippingDetail.estimatedDeliveryTime.getTime()) / (1000 * 60)
      : 0;

    const isOnTime = deliveryTime <= (order.estimatedDeliveryTime || 30);
    const shipperEarnings = order.shipperEarnings || 0;

    // Update shipper statistics with comprehensive tracking
    shipper.completedDeliveries = (shipper.completedDeliveries || 0) + 1;
    shipper.activeDeliveries = Math.max((shipper.activeDeliveries || 1) - 1, 0);
    
    // Update earnings tracking
    shipper.totalEarnings = (shipper.totalEarnings || 0) + shipperEarnings;
    shipper.dailyEarnings = (shipper.dailyEarnings || 0) + shipperEarnings;
    shipper.weeklyEarnings = (shipper.weeklyEarnings || 0) + shipperEarnings;
    shipper.monthlyEarnings = (shipper.monthlyEarnings || 0) + shipperEarnings;

    // Update delivery time tracking
    const totalDeliveries = shipper.completedDeliveries;
    const currentAvgTime = shipper.averageDeliveryTime || 0;
    shipper.averageDeliveryTime = ((currentAvgTime * (totalDeliveries - 1)) + deliveryTime) / totalDeliveries;

    // Update on-time delivery tracking
    if (isOnTime) {
      shipper.onTimeDeliveries = (shipper.onTimeDeliveries || 0) + 1;
    } else {
      shipper.lateDeliveries = (shipper.lateDeliveries || 0) + 1;
    }

    // Update last active time
    shipper.lastActiveAt = new Date();

    await this.userRepository.save(shipper);

    this.logger.log(`✅ Order ${orderId} completed by shipper ${shipperId}. Earnings: ${shipperEarnings}đ, On-time: ${isOnTime}`);

    return { 
      message: 'Đơn hàng đã được hoàn thành',
      earnings: shipperEarnings,
      isOnTime,
      deliveryTime: Math.round(deliveryTime),
      totalCompletedDeliveries: shipper.completedDeliveries
    };
}


  async getCompletedOrdersByShipper(shipperId: string) {
    const completedDetails = await this.shippingDetailRepository.find({
      where: {
        shipper: { id: shipperId },
        status: ShippingStatus.COMPLETED,
      },
      relations: [
        'order',
        'order.orderDetails',
        'order.orderDetails.food',
        'order.restaurant',
        'order.user',
        'order.address',
      ],
      order: { actualDeliveryTime: 'DESC' },
    });

    return completedDetails.map(detail => {
      const order = detail.order;
      return {
        id: order.id,
        code: `ĐH${order.id.slice(0, 4).toUpperCase()}`,
        status: detail.status,
        shipFee: 10000,
        total: order.total,
        user: {
          name: order.user?.name || 'Không rõ',
        },
        restaurant: {
          name: order.restaurant?.name || '',
        },
        address: {
          street: order.address?.street || '',
        },
        deliveryTo: [
          order.address?.street,
          order.address?.ward,
          order.address?.district,
          order.address?.city,
        ].filter(Boolean).join(', '),
        orderDetails: order.orderDetails.map(detail => ({
          food: {
            name: detail.food.name,
          },
          quantity: detail.quantity,
          price: +detail.price,
        })),
      };
    });
  }

async getIncomeReport(
  shipperId: string,
  range: 'today' | 'week' | 'month',
  monthStr?: string,
  yearStr?: string
) {
  let fromDate: Date;
  let groupBy: 'day' | 'week' | 'month'; // ✅ Fixed: Use valid DATE_TRUNC units

  if (range === 'today') {
    fromDate = startOfDay(new Date());
    groupBy = 'day';
  } else if (range === 'week') {
    fromDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    groupBy = 'day'; // Group by day for week view
  } else {
    const month = Number(monthStr || new Date().getMonth() + 1);
    const year = Number(yearStr || new Date().getFullYear());
    fromDate = new Date(year, month - 1, 1);
    groupBy = 'day'; // ✅ Fixed: Use 'day' instead of 'date'
  }

  // Query delivery count and earnings data
  const raw = await this.shippingDetailRepository
    .createQueryBuilder('sd')
    .leftJoin('sd.order', 'o')
    .select([
      `DATE_TRUNC('${groupBy}', sd."actualDeliveryTime") AS grouped_date`,
      `COUNT(sd.id) AS delivery_count`,
      `SUM(COALESCE(o."shipperEarnings", 0)) AS total_earnings`,
      `AVG(COALESCE(o."shipperEarnings", 0)) AS avg_earnings_per_delivery`,
      `SUM(COALESCE(o."shippingFee", 0)) AS total_shipping_fees`,
      `AVG(COALESCE(o."deliveryDistance", 0)) AS avg_distance`
    ])
    .where(`sd."user_id" = :shipperId`, { shipperId })
    .andWhere(`sd.status = :status`, { status: 'COMPLETED' })
    .andWhere(`sd."actualDeliveryTime" >= :fromDate`, { fromDate })
    .groupBy('grouped_date')
    .orderBy('grouped_date', 'ASC')
    .getRawMany();

  // Normalize data with better date handling
  const dateMap = new Map();
  
  raw.forEach((r: any) => {
    const date = new Date(r.grouped_date);
    const key = format(date, 'yyyy-MM-dd');
    
    dateMap.set(key, {
      earnings: Number(r.total_earnings) || 0,
      deliveryCount: Number(r.delivery_count) || 0,
      avgEarningsPerDelivery: Number(r.avg_earnings_per_delivery) || 0,
      totalShippingFees: Number(r.total_shipping_fees) || 0,
      avgDistance: Number(r.avg_distance) || 0
    });
  });

  // Calculate date range for the report
  let days: number;
  let endDate: Date;
  
  if (range === 'today') {
    days = 1;
    endDate = fromDate;
  } else if (range === 'week') {
    days = 7;
    endDate = addDays(fromDate, 6);
  } else {
    // For month, calculate days in the month
    const month = Number(monthStr || new Date().getMonth() + 1);
    const year = Number(yearStr || new Date().getFullYear());
    days = new Date(year, month, 0).getDate(); // Get last day of month
    endDate = new Date(year, month - 1, days - 1);
  }

  const labels: string[] = [];
  const earningsData: number[] = [];
  const deliveryCountData: number[] = [];
  const avgEarningsData: number[] = [];

  // Generate data for each day in the range
  for (let i = 0; i < days; i++) {
    const currentDate = addDays(fromDate, i);
    const key = format(currentDate, 'yyyy-MM-dd');
    
    const data = dateMap.get(key) || { 
      earnings: 0, 
      deliveryCount: 0, 
      avgEarningsPerDelivery: 0,
      totalShippingFees: 0,
      avgDistance: 0
    };
    
    // Format labels based on range
    let label: string;
    if (range === 'today') {
      label = 'Hôm nay';
    } else if (range === 'week') {
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      label = dayNames[currentDate.getDay()];
    } else {
      label = `${currentDate.getDate()}/${currentDate.getMonth() + 1}`;
    }
    
    labels.push(label);
    earningsData.push(data.earnings);
    deliveryCountData.push(data.deliveryCount);
    avgEarningsData.push(data.avgEarningsPerDelivery);
  }

  // Calculate summary statistics
  const totalEarnings = earningsData.reduce((sum, val) => sum + val, 0);
  const totalDeliveries = deliveryCountData.reduce((sum, val) => sum + val, 0);
  const avgEarningsPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

  // Find best performing day
  const maxEarningsIndex = earningsData.indexOf(Math.max(...earningsData));
  
  return { 
    period: range,
    dateRange: {
      from: format(fromDate, 'yyyy-MM-dd'),
      to: format(range === 'today' ? fromDate : endDate, 'yyyy-MM-dd')
    },
    labels, 
    data: {
      earnings: earningsData,
      deliveryCount: deliveryCountData,
      avgEarningsPerDelivery: avgEarningsData
    },
    summary: {
      totalEarnings,
      totalDeliveries,
      avgEarningsPerDelivery: Math.round(avgEarningsPerDelivery),
      bestDay: {
        date: labels[maxEarningsIndex] || 'N/A',
        earnings: Math.max(...earningsData) || 0,
        deliveries: deliveryCountData[maxEarningsIndex] || 0
      },
      worstDay: {
        date: labels[earningsData.indexOf(Math.min(...earningsData.filter(e => e > 0)))] || 'N/A',
        earnings: Math.min(...earningsData.filter(e => e > 0)) || 0
      },
      formatted: {
        totalEarnings: `${totalEarnings.toLocaleString('vi-VN')}đ`,
        avgEarningsPerDelivery: `${Math.round(avgEarningsPerDelivery).toLocaleString('vi-VN')}đ`,
        avgEarningsPerDay: `${Math.round(totalEarnings / days).toLocaleString('vi-VN')}đ`
      }
    },
    analytics: {
      peakPerformanceDays: labels.filter((_, index) => earningsData[index] > avgEarningsPerDelivery),
      consistency: this.calculateConsistencyScore(earningsData),
      trend: this.calculateTrend(earningsData),
      workloadDistribution: {
        lightDays: deliveryCountData.filter(count => count <= 2).length,
        moderateDays: deliveryCountData.filter(count => count > 2 && count <= 5).length,
        heavyDays: deliveryCountData.filter(count => count > 5).length
      }
    }
  };
}

/**
 * Calculate consistency score (0-100, higher is more consistent)
 */
private calculateConsistencyScore(earningsData: number[]): number {
  if (earningsData.length === 0) return 0;
  
  const nonZeroEarnings = earningsData.filter(e => e > 0);
  if (nonZeroEarnings.length === 0) return 0;
  
  const mean = nonZeroEarnings.reduce((a, b) => a + b) / nonZeroEarnings.length;
  const variance = nonZeroEarnings.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nonZeroEarnings.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Lower standard deviation relative to mean = higher consistency
  const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) : 1;
  return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 50)));
}

/**
 * Calculate trend (positive = improving, negative = declining)
 */
private calculateTrend(earningsData: number[]): string {
  if (earningsData.length < 2) return 'insufficient_data';
  
  const firstHalf = earningsData.slice(0, Math.floor(earningsData.length / 2));
  const secondHalf = earningsData.slice(Math.floor(earningsData.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const percentChange = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
  
  if (percentChange > 10) return 'improving';
  if (percentChange < -10) return 'declining';
  return 'stable';
}

  async updateDriverProfile(userId: string, dto: UpdateDriverProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['shipperCertificateInfo'] });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    if (dto.name) user.name = dto.name;
    if (dto.phone) user.phone = dto.phone;
    if (dto.birthday) user.birthday = new Date(dto.birthday);

    await this.userRepository.save(user);

    const cert = user.shipperCertificateInfo;
    if (cert) {
      if (dto.cccd) cert.cccd = dto.cccd;
      if (dto.driverLicense) cert.driverLicense = dto.driverLicense;
      await this.certRepo.save(cert);
    }

    return { message: 'Cập nhật hồ sơ thành công' };
  }

  async getDriverProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['shipperCertificateInfo'],
    });

    if (!user) throw new NotFoundException('Không tìm thấy tài xế');

    return {
      name: user.name,
      phone: user.phone,
      birthday: user.birthday?.toISOString().split('T')[0],
      cccd: user.shipperCertificateInfo?.cccd || '',
      driverLicense: user.shipperCertificateInfo?.driverLicense || '',
    };
  }

  async updateLocation(shipperId: string, latitude: number, longitude: number) {
    const shipper = await this.userRepository.findOne({
      where: { id: shipperId },
      relations: ['shipperCertificateInfo'],
    });

    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }


    // Publish the location update
    const result = await pubSub.publish('shipperLocationUpdated', {
      shipperLocationUpdated: {
        shipperId,
        latitude,
        longitude,
        updatedAt: new Date(),
      },
    });

    //console.log(`Location update published: ${result}`);

    return { message: 'Location updated successfully', success: true };
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['shippingDetail', 'shippingDetail.shipper'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'delivering') {
      throw new BadRequestException('Order is not currently being delivered');
    }
    if (order.shippingDetail.shipper.id !== userId) {
      throw new BadRequestException('You are not the shipper for this order');
    }

    const shipper = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['shipperCertificateInfo'],
    });
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }
    // Update order status to canceled
    order.status = 'canceled';
    await this.orderRepository.save(order);

    // 🚨 ADD: Publish the status update
    await pubSub.publish('orderStatusUpdated', {
      orderStatusUpdated: order
    });

    shipper.activeDeliveries = Math.max((shipper.activeDeliveries || 1) - 1, 0);
    shipper.failedDeliveries = (shipper.failedDeliveries || 0) + 1; // Increment failed deliveries
    await this.userRepository.save(shipper);

  }

  async rejectOrder(orderId: string, shipperId: string, responseTimeSeconds: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['shippingDetail', 'shippingDetail.shipper'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.orderRepository.save(order);

    const shipper = await this.userRepository.findOne({
      where: { id: shipperId },
      relations: ['shipperCertificateInfo'],
    });
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }

    // Update shipper statistics
    shipper.activeDeliveries = Math.max((shipper.activeDeliveries || 1) - 1, 0);
    shipper.failedDeliveries = (shipper.failedDeliveries || 0) + 1;
    shipper.rejectedOrders = (shipper.rejectedOrders || 0) + 1; // Track rejected orders separately
    shipper.responseTimeMinutes = Math.max((shipper.responseTimeMinutes || 0) + Math.ceil(responseTimeSeconds / 60), 0);

    // Check rejection ratio and take appropriate action
    const rejectionCheckResult = this.checkRejectionRatio(shipper);
    
    if (rejectionCheckResult.shouldBan) {
      shipper.shipperCertificateInfo.status = CertificateStatus.REJECTED;
      await this.certRepo.save(shipper.shipperCertificateInfo);
      await this.userRepository.save(shipper);
      
      throw new ConflictException(`Shipper has been banned due to ${rejectionCheckResult.reason}`);
    }

    // Check response time threshold
    if (shipper.responseTimeMinutes > 60) {
      shipper.shipperCertificateInfo.status = CertificateStatus.REJECTED;
      await this.certRepo.save(shipper.shipperCertificateInfo);
      await this.userRepository.save(shipper);
      
      throw new ConflictException('Shipper has been rejected due to high response time');
    }

    await this.userRepository.save(shipper);

    // Return response with warning if applicable
    const response: any = { message: 'Order rejected successfully' };
    
    if (rejectionCheckResult.warning) {
      response.warning = rejectionCheckResult.warning;
      response.rejectionRatio = rejectionCheckResult.rejectionRatio;
      response.stats = {
        rejectedOrders: shipper.rejectedOrders,
        completedDeliveries: shipper.completedDeliveries,
        totalOrders: shipper.rejectedOrders + shipper.completedDeliveries
      };
    }

    return response;
  }

  /**
   * Check rejection ratio and determine if shipper should be warned or banned
   */
  private checkRejectionRatio(shipper: User): {
    shouldBan: boolean;
    warning?: string;
    reason?: string;
    rejectionRatio?: number;
  } {
    const completedDeliveries = shipper.completedDeliveries || 0;
    const rejectedOrders = shipper.rejectedOrders || 0;
    const totalOrders = completedDeliveries + rejectedOrders;

    // Need at least 10 total orders to start checking ratios
    if (totalOrders < 10) {
      return { shouldBan: false };
    }

    const rejectionRatio = rejectedOrders / totalOrders;

    // Ban conditions
    if (totalOrders >= 50 && rejectionRatio > 0.7) {
      return {
        shouldBan: true,
        reason: 'tỷ lệ từ chối đơn hàng quá cao (>70% trong 50+ đơn hàng bị từ chối)',
        rejectionRatio
      };
    }

    if (totalOrders >= 30 && rejectionRatio > 0.8) {
      return {
        shouldBan: true,
        reason: 'tỷ lệ từ chối đơn hàng quá cao (>80% trong 30+ đơn hàng bị từ chối)',
        rejectionRatio
      };
    }

    if (rejectedOrders >= 20 && completedDeliveries === 0) {
      return {
        shouldBan: true,
        reason: 'không có đơn hàng nào được hoàn thành sau 20 lần từ chối',
        rejectionRatio
      };
    }

    // Warning conditions
    if (totalOrders >= 20 && rejectionRatio > 0.6) {
      return {
        shouldBan: false,
        warning: 'Cảnh báo: Tỷ lệ từ chối đơn hàng cao. Tiếp tục từ chối đơn hàng có thể dẫn đến việc tài khoản bị đình chỉ.',
        rejectionRatio
      };
    }

    if (totalOrders >= 15 && rejectionRatio > 0.75) {
      return {
        shouldBan: false,
        warning: 'Cảnh báo nghiêm trọng: Tỷ lệ từ chối đơn hàng rất cao. Tài khoản của bạn có nguy cơ bị đình chỉ.',
        rejectionRatio
      };
    }

    if (rejectedOrders >= 10 && completedDeliveries <= 2) {
      return {
        shouldBan: false,
        warning: 'Cảnh báo: Bạn có rất ít đơn hàng hoàn thành so với số đơn từ chối. Vui lòng bắt đầu nhận đơn hàng.',
        rejectionRatio
      };
    }

    return { shouldBan: false };
  }
/**
 * Get comprehensive shipper dashboard statistics
 */
async getShipperDashboard(shipperId: string) {
  const shipper = await this.userRepository.findOne({
    where: { id: shipperId },
    relations: ['shipperCertificateInfo'],
  });

  if (!shipper) {
    throw new NotFoundException('Shipper not found');
  }

  // Calculate performance metrics
  const completedDeliveries = shipper.completedDeliveries || 0;
  const rejectedOrders = shipper.rejectedOrders || 0;
  const failedDeliveries = shipper.failedDeliveries || 0;
  const onTimeDeliveries = shipper.onTimeDeliveries || 0;
  const lateDeliveries = shipper.lateDeliveries || 0;
  const totalOrders = completedDeliveries + rejectedOrders + failedDeliveries;

  const completionRate = totalOrders > 0 ? (completedDeliveries / totalOrders * 100) : 0;
  const rejectionRate = totalOrders > 0 ? (rejectedOrders / totalOrders * 100) : 0;
  const onTimeRate = (onTimeDeliveries + lateDeliveries) > 0 ? (onTimeDeliveries / (onTimeDeliveries + lateDeliveries) * 100) : 0;

  // Get recent delivery performance (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentDeliveries = await this.shippingDetailRepository.count({
    where: {
      shipper: { id: shipperId },
      status: ShippingStatus.COMPLETED,
      actualDeliveryTime: LessThan(new Date())
    }
  });

  // Calculate earnings breakdown
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return {
    // Basic info
    shipperId: shipper.id,
    shipperName: shipper.name || shipper.username,
    status: shipper.shipperCertificateInfo?.status || 'PENDING',
    isActive: shipper.isActive,
    averageRating: shipper.averageRating || 5.0,
    
    // Delivery statistics
    deliveryStats: {
      totalCompletedDeliveries: completedDeliveries,
      activeDeliveries: shipper.activeDeliveries || 0,
      rejectedOrders: rejectedOrders,
      failedDeliveries: failedDeliveries,
      totalOrders: totalOrders,
      recentDeliveries30Days: recentDeliveries,
      
      // Performance rates
      completionRate: Math.round(completionRate * 100) / 100,
      rejectionRate: Math.round(rejectionRate * 100) / 100,
      onTimeDeliveryRate: Math.round(onTimeRate * 100) / 100,
      
      // Time metrics
      averageDeliveryTime: Math.round((shipper.averageDeliveryTime || 0) * 100) / 100,
      averageResponseTime: Math.round((shipper.responseTimeMinutes || 0) * 100) / 100,
      onTimeDeliveries: onTimeDeliveries,
      lateDeliveries: lateDeliveries,
    },

    // Earnings breakdown
    earnings: {
      totalEarnings: shipper.totalEarnings || 0,
      dailyEarnings: shipper.dailyEarnings || 0,
      weeklyEarnings: shipper.weeklyEarnings || 0,
      monthlyEarnings: shipper.monthlyEarnings || 0,
      averageEarningsPerDelivery: completedDeliveries > 0 ? 
        Math.round((shipper.totalEarnings || 0) / completedDeliveries) : 0,
      
      // Formatted earnings
      formattedEarnings: {
        total: `${(shipper.totalEarnings || 0).toLocaleString()}đ`,
        daily: `${(shipper.dailyEarnings || 0).toLocaleString()}đ`,
        weekly: `${(shipper.weeklyEarnings || 0).toLocaleString()}đ`,
        monthly: `${(shipper.monthlyEarnings || 0).toLocaleString()}đ`,
        perDelivery: completedDeliveries > 0 ? 
          `${Math.round((shipper.totalEarnings || 0) / completedDeliveries).toLocaleString()}đ` : '0đ'
      }
    },

    // Performance ranking
    performanceRanking: this.calculatePerformanceRanking(shipper),
    
    // Achievement badges
    achievements: this.calculateAchievements(shipper),
    
    // Recent activity
    lastActiveAt: shipper.lastActiveAt?.toISOString() || null,
    accountCreatedAt: shipper.createdAt.toISOString(),
    
    // Next milestones
    nextMilestones: this.calculateNextMilestones(shipper)
  };
}
/**
 * Calculate achievement badges
 */
private calculateAchievements(shipper: User): Array<{
  name: string;
  description: string;
  earned: boolean;
  progress?: number;
}> {
  const completedDeliveries = shipper.completedDeliveries || 0;
  const rating = shipper.averageRating || 5.0;
  const onTimeDeliveries = shipper.onTimeDeliveries || 0;
  const totalEarnings = shipper.totalEarnings || 0;

  return [
    {
      name: 'Người mới',
      description: 'Hoàn thành đơn hàng đầu tiên',
      earned: completedDeliveries >= 1,
      progress: Math.min(100, completedDeliveries * 100)
    },
    {
      name: 'Thành viên tích cực',
      description: 'Hoàn thành 50 đơn hàng',
      earned: completedDeliveries >= 50,
      progress: Math.min(100, (completedDeliveries / 50) * 100)
    },
    {
      name: 'Shipper chuyên nghiệp',
      description: 'Hoàn thành 200 đơn hàng',
      earned: completedDeliveries >= 200,
      progress: Math.min(100, (completedDeliveries / 200) * 100)
    },
    {
      name: 'Đánh giá cao',
      description: 'Đạt đánh giá trung bình 4.5 sao',
      earned: rating >= 4.5,
      progress: Math.min(100, (rating / 4.5) * 100)
    },
    {
      name: 'Đúng giờ',
      description: 'Giao 100 đơn hàng đúng giờ',
      earned: onTimeDeliveries >= 100,
      progress: Math.min(100, (onTimeDeliveries / 100) * 100)
    },
    {
      name: 'Triệu phú',
      description: 'Kiếm được 1,000,000đ',
      earned: totalEarnings >= 1000000,
      progress: Math.min(100, (totalEarnings / 1000000) * 100)
    }
  ];
}

/**
 * Calculate next milestones
 */
private calculateNextMilestones(shipper: User): Array<{
  milestone: string;
  current: number;
  target: number;
  progress: number;
}> {
  const completedDeliveries = shipper.completedDeliveries || 0;
  const totalEarnings = shipper.totalEarnings || 0;
  const onTimeDeliveries = shipper.onTimeDeliveries || 0;

  const milestones: {
    milestone: string;
    current: number;
    target: number;
    progress: number;
  }[] = [];

  // Delivery milestones
  const deliveryTargets = [10, 25, 50, 100, 200, 500, 1000];
  const nextDeliveryTarget = deliveryTargets.find(target => target > completedDeliveries);
  if (nextDeliveryTarget) {
    milestones.push({
      milestone: `${nextDeliveryTarget} đơn hàng hoàn thành`,
      current: completedDeliveries,
      target: nextDeliveryTarget,
      progress: (completedDeliveries / nextDeliveryTarget) * 100
    });
  }

  // Earnings milestones
  const earningsTargets = [100000, 500000, 1000000, 5000000, 10000000]; // VND
  const nextEarningsTarget = earningsTargets.find(target => target > totalEarnings);
  if (nextEarningsTarget) {
    milestones.push({
      milestone: `${(nextEarningsTarget / 1000000).toFixed(1)}M đồng thu nhập`,
      current: totalEarnings,
      target: nextEarningsTarget,
      progress: (totalEarnings / nextEarningsTarget) * 100
    });
  }

  // On-time delivery milestones
  const onTimeTargets = [10, 25, 50, 100, 250, 500];
  const nextOnTimeTarget = onTimeTargets.find(target => target > onTimeDeliveries);
  if (nextOnTimeTarget) {
    milestones.push({
      milestone: `${nextOnTimeTarget} đơn giao đúng giờ`,
      current: onTimeDeliveries,
      target: nextOnTimeTarget,
      progress: (onTimeDeliveries / nextOnTimeTarget) * 100
    });
  }

  return milestones;
}

/**
 * Calculate performance ranking
 */
private calculatePerformanceRanking(shipper: User): {
  level: string;
  score: number;
  nextLevelRequirements: string[];
} {
  const completedDeliveries = shipper.completedDeliveries || 0;
  const rating = shipper.averageRating || 5.0;
  const onTimeRate = (shipper.onTimeDeliveries || 0) / Math.max(1, (shipper.onTimeDeliveries || 0) + (shipper.lateDeliveries || 0)) * 100;
  const rejectionRate = (shipper.rejectedOrders || 0) / Math.max(1, (shipper.completedDeliveries || 0) + (shipper.rejectedOrders || 0)) * 100;

  let level = 'Mới bắt đầu';
  let score = 0;
  const requirements: string[] = [];

  // Calculate base score
  score += completedDeliveries * 2; // 2 points per delivery
  score += (rating - 3) * 20; // Rating bonus/penalty
  score += onTimeRate * 0.5; // On-time bonus
  score -= rejectionRate * 0.3; // Rejection penalty

  // Determine level
  if (completedDeliveries >= 500 && rating >= 4.8 && onTimeRate >= 95 && rejectionRate <= 5) {
    level = 'Huyền thoại';
  } else if (completedDeliveries >= 200 && rating >= 4.6 && onTimeRate >= 90 && rejectionRate <= 10) {
    level = 'Chuyên gia';
  } else if (completedDeliveries >= 100 && rating >= 4.4 && onTimeRate >= 85 && rejectionRate <= 15) {
    level = 'Thành thạo';
  } else if (completedDeliveries >= 50 && rating >= 4.2 && onTimeRate >= 80 && rejectionRate <= 20) {
    level = 'Tiến bộ';
  } else if (completedDeliveries >= 20 && rating >= 4.0 && onTimeRate >= 75) {
    level = 'Phát triển';
  }

  // Calculate next level requirements
  if (level === 'Mới bắt đầu') {
    if (completedDeliveries < 20) requirements.push(`Hoàn thành ${20 - completedDeliveries} đơn hàng nữa`);
    if (rating < 4.0) requirements.push(`Cải thiện đánh giá lên 4.0 sao`);
    if (onTimeRate < 75) requirements.push(`Cải thiện tỷ lệ giao hàng đúng giờ lên 75%`);
  } else if (level === 'Phát triển') {
    if (completedDeliveries < 50) requirements.push(`Hoàn thành ${50 - completedDeliveries} đơn hàng nữa`);
    if (rating < 4.2) requirements.push(`Cải thiện đánh giá lên 4.2 sao`);
    if (onTimeRate < 80) requirements.push(`Cải thiện tỷ lệ giao hàng đúng giờ lên 80%`);
  }
  else if (level === 'Tiến bộ') {
    if (completedDeliveries < 100) requirements.push(`Hoàn thành ${100 - completedDeliveries} đơn hàng nữa`);
    if (rating < 4.4) requirements.push(`Cải thiện đánh giá lên 4.4 sao`);
    if (onTimeRate < 85) requirements.push(`Cải thiện tỷ lệ giao hàng đúng giờ lên 85%`);
  } else if (level === 'Thành thạo') {
    if (completedDeliveries < 200) requirements.push(`Hoàn thành ${200 - completedDeliveries} đơn hàng nữa`);
    if (rating < 4.6) requirements.push(`Cải thiện đánh giá lên 4.6 sao`);
    if (onTimeRate < 90) requirements.push(`Cải thiện tỷ lệ giao hàng đúng giờ lên 90%`);
  } else if (level === 'Chuyên gia') {
    if (completedDeliveries < 500) requirements.push(`Hoàn thành ${500 - completedDeliveries} đơn hàng nữa`);
    if (rating < 4.8) requirements.push(`Cải thiện đánh giá lên 4.8 sao`);
    if (onTimeRate < 95) requirements.push(`Cải thiện tỷ lệ giao hàng đúng giờ lên 95%`);
  }
  // ... continue for other levels

  return {
    level,
    score: Math.round(score),
    nextLevelRequirements: requirements
  };
}

  /**
   * Get shipper performance statistics
   */
  async getShipperStats(shipperId: string) {
    const shipper = await this.userRepository.findOne({
      where: { id: shipperId },
      relations: ['shipperCertificateInfo'],
    });

    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }

    const completedDeliveries = shipper.completedDeliveries || 0;
    const rejectedOrders = shipper.rejectedOrders || 0;
    const failedDeliveries = shipper.failedDeliveries || 0;
    const totalOrders = completedDeliveries + rejectedOrders + failedDeliveries;

    const rejectionRatio = totalOrders > 0 ? rejectedOrders / totalOrders : 0;
    const completionRatio = totalOrders > 0 ? completedDeliveries / totalOrders : 0;
    const failureRatio = totalOrders > 0 ? failedDeliveries / totalOrders : 0;

    return {
      completedDeliveries,
      rejectedOrders,
      failedDeliveries,
      totalOrders,
      activeDeliveries: shipper.activeDeliveries || 0,
      rejectionRatio: Math.round(rejectionRatio * 100) / 100,
      completionRatio: Math.round(completionRatio * 100) / 100,
      failureRatio: Math.round(failureRatio * 100) / 100,
      averageResponseTime: shipper.responseTimeMinutes || 0,
      status: shipper.shipperCertificateInfo?.status || 'PENDING',
      averageRating: shipper.averageRating || 0,
      totalEarnings: shipper.totalEarnings || 0
    };
  }
}