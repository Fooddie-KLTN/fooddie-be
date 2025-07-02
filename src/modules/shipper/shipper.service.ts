import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    // Update order status to delivering
    order.status = 'delivering';
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
      where: {
        id: orderId
      }
    })
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    order.status = 'completed';
    await this.orderRepository.save(order);

    await this.orderService.updateOrderStatus(orderId, 'completed');
    const shipper = await this.userRepository.findOne({
      where: { id: shipperId },
      relations: ['shipperCertificateInfo'],
    });
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }

    // ...after successful delivery...
    shipper.completedDeliveries = (shipper.completedDeliveries || 0) + 1;
    shipper.activeDeliveries = Math.max((shipper.activeDeliveries || 1) - 1, 0);
    await this.userRepository.save(shipper);

    return { message: 'Đơn hàng đã được hoàn thành' };
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
    let groupBy: 'day' | 'date';

    if (range === 'today') {
      fromDate = startOfDay(new Date());
      groupBy = 'day';
    } else if (range === 'week') {
      fromDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      groupBy = 'day';
    } else {
      const month = Number(monthStr || new Date().getMonth() + 1);
      const year = Number(yearStr || new Date().getFullYear());
      fromDate = new Date(year, month - 1, 1);
      groupBy = 'date';
    }


    // Query dữ liệu tổng thu nhập từ order.total
    const raw = await this.shippingDetailRepository
      .createQueryBuilder('sd')
      .leftJoin('sd.order', 'o')
      .select([
        `DATE_TRUNC('${groupBy}', sd."actualDeliveryTime") AS grouped_date`,
        `SUM(o.total) AS total`
      ])
      .where(`sd."user_id" = :shipperId`, { shipperId })
      .andWhere(`sd.status = :status`, { status: 'COMPLETED' })
      .andWhere(`sd."actualDeliveryTime" >= :fromDate`, { fromDate })
      .groupBy('grouped_date')
      .orderBy('grouped_date', 'ASC')
      .getRawMany();

    // Chuẩn hóa lại thành labels + data
    const dateMap = new Map(
      raw.map((r: any) => [format(new Date(r.grouped_date), 'yyyy-MM-dd'), Number(r.total)])
    );

    const days = range === 'today'
      ? 1
      : range === 'week'
        ? 7
        : new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0).getDate();

    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 0; i < days; i++) {
      const d = addDays(fromDate, i);
      const key = format(d, 'yyyy-MM-dd');
      labels.push(
        range === 'today'
          ? 'Hôm nay'
          : range === 'week'
            ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][d.getDay() === 0 ? 6 : d.getDay() - 1]
            : `Ngày ${i + 1}`
      );
      data.push(dateMap.get(key) || 0);
    }

    const total = data.reduce((sum, val) => sum + val, 0);

    return { labels, data, total };
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