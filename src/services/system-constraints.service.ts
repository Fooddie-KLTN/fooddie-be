import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConstraint } from '../entities/systemConstaints.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SystemConstraintsService {
  private readonly logger = new Logger(SystemConstraintsService.name);
  private cachedConstraints: SystemConstraint | null = null;
  private lastCacheUpdate: Date = new Date(0);
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(SystemConstraint)
    private systemConstraintsRepository: Repository<SystemConstraint>,
  ) {}

  /**
   * Get system constraints with caching
   */
  async getConstraints(): Promise<SystemConstraint> {
    const now = new Date();
    
    // Return cached constraints if still valid
    if (this.cachedConstraints && (now.getTime() - this.lastCacheUpdate.getTime()) < this.CACHE_DURATION) {
      return this.cachedConstraints;
    }

    // Fetch constraints from database
    let constraints = await this.systemConstraintsRepository.findOne({
      order: { created_at: 'DESC' }
    });

    // Create default constraints if none exist
    if (!constraints) {
      constraints = await this.createDefaultConstraints();
    }

    // Update cache
    this.cachedConstraints = constraints;
    this.lastCacheUpdate = now;

    return constraints;
  }

  /**
   * Create default system constraints
   */
  private async createDefaultConstraints(): Promise<SystemConstraint> {
    this.logger.log('Creating default system constraints');
    
    const defaultConstraints = new SystemConstraint();
    // Default values are already set in the entity
    
    return await this.systemConstraintsRepository.save(defaultConstraints);
  }

  /**
   * Check if a shipper meets all eligibility criteria
   */
  async isShipperEligible(shipper: User): Promise<{
    eligible: boolean;
    reasons: string[];
    score: number;
  }> {
    const constraints = await this.getConstraints();
    const reasons: string[] = [];
    let score = 0;

    // Check role
    if (!shipper.role || shipper.role.name !== 'shipper') {
      reasons.push('User is not a shipper');
      return { eligible: false, reasons, score: 0 };
    }

    // Check if shipper is active
    if (!shipper.isActive) {
      reasons.push('Shipper account is inactive');
      return { eligible: false, reasons, score: 0 };
    }

    // Calculate completion rate
    const totalOrders = shipper.completedDeliveries + shipper.failedDeliveries;
    const completionRate = totalOrders > 0 ? shipper.completedDeliveries / totalOrders : 0;

    // Check minimum total orders
    if (totalOrders < constraints.min_total_orders) {
      reasons.push(`Insufficient total orders: ${totalOrders} < ${constraints.min_total_orders}`);
    }

    // Check completion rate
    if (completionRate < constraints.min_completion_rate) {
      reasons.push(`Low completion rate: ${(completionRate * 100).toFixed(1)}% < ${(constraints.min_completion_rate * 100)}%`);
    }

    // Check current active deliveries
    if (shipper.activeDeliveries >= constraints.max_active_deliveries) {
      reasons.push(`Too many active deliveries: ${shipper.activeDeliveries} >= ${constraints.max_active_deliveries}`);
    }

    // Check shipper rating
    if (shipper.averageRating < constraints.min_shipper_rating) {
      reasons.push(`Low rating: ${shipper.averageRating} < ${constraints.min_shipper_rating}`);
    }

    // Check if shipper has been active recently (within 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (!shipper.lastActiveAt || shipper.lastActiveAt < thirtyMinutesAgo) {
      reasons.push('Shipper not active recently');
    }

    // Calculate eligibility score based on performance
    score = this.calculateShipperScore(shipper, constraints);

    const eligible = reasons.length === 0;

    this.logger.debug(`Shipper ${shipper.id} eligibility check: ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}, Score: ${score}, Reasons: ${reasons.join(', ')}`);

    return { eligible, reasons, score };
  }

  /**
   * Calculate a score for shipper ranking (higher is better)
   */
  private calculateShipperScore(shipper: User, constraints: SystemConstraint): number {
    let score = 0;

    // Base score from completion rate (0-30 points)
    const totalOrders = shipper.completedDeliveries + shipper.failedDeliveries;
    const completionRate = totalOrders > 0 ? shipper.completedDeliveries / totalOrders : 0;
    score += Math.min(30, completionRate * 30);

    // Rating score (0-25 points)
    score += Math.min(25, (shipper.averageRating / 5) * 25);

    // Experience score based on total orders (0-20 points)
    score += Math.min(20, (totalOrders / 100) * 20);

    // Response time score (0-15 points) - lower response time is better
    const maxResponseTime = 10; // minutes
    const responseTimeScore = Math.max(0, 15 - (shipper.responseTimeMinutes / maxResponseTime) * 15);
    score += responseTimeScore;

    // On-time delivery score (0-10 points)
    const totalDeliveries = shipper.onTimeDeliveries + shipper.lateDeliveries;
    const onTimeRate = totalDeliveries > 0 ? shipper.onTimeDeliveries / totalDeliveries : 1;
    score += onTimeRate * 10;

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate shipping fee based on distance
   */
  async calculateShippingFee(distanceKm: number): Promise<number> {
    const constraints = await this.getConstraints();

    if (distanceKm <= constraints.base_distance_km) {
      return constraints.base_shipping_fee;
    } else if (distanceKm <= constraints.tier2_distance_km) {
      return constraints.tier2_shipping_fee;
    } else {
      return constraints.tier3_shipping_fee;
    }
  }

  /**
   * Check if distance is within delivery limits
   */
  async isDistanceWithinLimits(distanceKm: number): Promise<boolean> {
    const constraints = await this.getConstraints();
    return distanceKm <= constraints.max_delivery_distance;
  }

  /**
   * Get maximum delivery time in minutes
   */
  async getMaxDeliveryTime(): Promise<number> {
    const constraints = await this.getConstraints();
    return constraints.max_delivery_time_min;
  }

  /**
   * Update system constraints (admin only)
   */
  async updateConstraints(updates: Partial<SystemConstraint>): Promise<SystemConstraint> {
    const currentConstraints = await this.getConstraints();
    
    // Create new constraints record with updates
    const newConstraints = this.systemConstraintsRepository.create({
      ...currentConstraints,
      ...updates,
      id: undefined, // Let it auto-generate new ID
    });

    const saved = await this.systemConstraintsRepository.save(newConstraints);
    
    // Clear cache to force refresh
    this.cachedConstraints = null;
    
    this.logger.log(`System constraints updated with ID: ${saved.id}`);
    return saved;
  }

  /**
   * Clear cache (useful for testing or manual cache refresh)
   */
  clearCache(): void {
    this.cachedConstraints = null;
    this.lastCacheUpdate = new Date(0);
  }
}
