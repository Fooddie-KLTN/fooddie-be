import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/entities/order.entity';
import { ShippingDetail, ShippingStatus } from 'src/entities/shippingDetail.entity';
import { User } from 'src/entities/user.entity';
import { pubSub } from 'src/pubsub';

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
    shippingDetail.status = ShippingStatus.PENDING;
    shippingDetail.estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    await this.shippingDetailRepository.save(shippingDetail);

    // Update order status to delivering
    order.status = 'delivering';
    await this.orderRepository.save(order);

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
}