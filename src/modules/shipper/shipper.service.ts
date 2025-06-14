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
import { ShipperCertificateInfo } from 'src/entities/shipperCertificateInfo.entity';

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
  ) {}

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
  async assignOrderToShipper(orderId: string, shipperId: string) {
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
  

  // async getOrderHistoryForShipper(shipperId: string, page: number, pageSize: number) {
  //   // Tạo query để lấy các đơn hàng mà shipper xử lý
  //   const query = this.shippingDetailRepository.createQueryBuilder('shippingDetail')
  //     .innerJoinAndSelect('shippingDetail.order', 'order')
  //     .where('shippingDetail.shipperId = :shipperId', { shipperId })
  //     .skip((page - 1) * pageSize)
  //     .take(pageSize)
  //     .leftJoinAndSelect('order.shippingDetails', 'orderDetails'); // Liên kết với bảng orders

  //   const shippingDetails = await query.getMany();
    
  //   return shippingDetails.map(detail => ({
  //     orderId: detail.order.id,
  //     orderStatus: detail.order.status,
  //     shippingStatus: detail.status,  // Trạng thái giao hàng
  //     estimatedDeliveryTime: detail.estimatedDeliveryTime,
  //     actualDeliveryTime: detail.actualDeliveryTime,
  //     trackingNumber: detail.trackingNumber,
  //   }));
  // }
}