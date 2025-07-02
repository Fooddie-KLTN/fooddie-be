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
   * Get system constraints with caching - FIXED
   */
  async getConstraints(): Promise<SystemConstraint> {
    const now = new Date();
    
    // Check if cached constraints are still valid
    if (this.cachedConstraints && 
        (now.getTime() - this.lastCacheUpdate.getTime()) < this.CACHE_DURATION) {
      return this.cachedConstraints;
    }

    try {
      this.logger.log('🔍 Fetching system constraints from database...');
      
      // Try to get the first (and should be only) system constraint record
      let constraints = await this.systemConstraintsRepository.findOne({
        where: {} // Empty where clause to get any record, or you can use order and take
      });

      // If no constraints exist, create default ones
      if (!constraints) {
        this.logger.log('⚠️ No system constraints found, creating default constraints...');
        constraints = await this.createDefaultConstraints();
      }

      // Update cache
      this.cachedConstraints = constraints;
      this.lastCacheUpdate = now;
      
      this.logger.log(`✅ System constraints loaded: max_delivery_distance=${constraints.max_delivery_distance}km, min_completion_rate=${constraints.min_completion_rate}`);
      
      return constraints;
    } catch (error) {
      this.logger.error(`❌ Error fetching system constraints: ${error.message}`);
      
      // If database query fails, return cached constraints if available
      if (this.cachedConstraints) {
        this.logger.warn('⚠️ Using cached constraints due to database error');
        return this.cachedConstraints;
      }
      
      // Last resort: return hardcoded default constraints
      this.logger.warn('⚠️ Using hardcoded default constraints due to database error');
      return this.getHardcodedDefaults();
    }
  }

  /**
   * Create default system constraints
   */
  private async createDefaultConstraints(): Promise<SystemConstraint> {
    try {
      const defaultConstraints = new SystemConstraint();
      defaultConstraints.min_completion_rate = 0.7;
      defaultConstraints.min_total_orders = 10;
      defaultConstraints.max_active_deliveries = 3;
      defaultConstraints.max_delivery_distance = 30;
      defaultConstraints.min_shipper_rating = 3.5;
      defaultConstraints.max_delivery_time_min = 45;
      defaultConstraints.base_distance_km = 5;
      defaultConstraints.base_shipping_fee = 15000;
      defaultConstraints.tier2_distance_km = 10;
      defaultConstraints.tier2_shipping_fee = 25000;
      defaultConstraints.tier3_shipping_fee = 35000;

      const savedConstraints = await this.systemConstraintsRepository.save(defaultConstraints);
      this.logger.log('✅ Default system constraints created successfully');
      
      return savedConstraints;
    } catch (error) {
      this.logger.error(`❌ Error creating default constraints: ${error.message}`);
      return this.getHardcodedDefaults();
    }
  }

  /**
   * Get hardcoded defaults as fallback
   */
  private getHardcodedDefaults(): SystemConstraint {
    const constraints = new SystemConstraint();
    constraints.min_completion_rate = 0.7;
    constraints.min_total_orders = 10;
    constraints.max_active_deliveries = 3;
    constraints.max_delivery_distance = 30;
    constraints.min_shipper_rating = 3.5;
    constraints.max_delivery_time_min = 45;
    constraints.base_distance_km = 5;
    constraints.base_shipping_fee = 15000;
    constraints.tier2_distance_km = 10;
    constraints.tier2_shipping_fee = 25000;
    constraints.tier3_shipping_fee = 35000;
    
    return constraints;
  }

  /**
   * Check if a shipper meets all eligibility criteria - ENHANCED WITH ERROR HANDLING
   */
  async isShipperEligible(shipper: User): Promise<{
    eligible: boolean;
    reasons: string[];
    score: number;
  }> {
    try {
      if (!shipper) {
        return {
          eligible: false,
          reasons: ['Shipper data not provided'],
          score: 0
        };
      }

      const constraints = await this.getConstraints();
      const reasons: string[] = [];
      let score = 100; // Start with perfect score

      // Check role - essential requirement
      if (!shipper.role || shipper.role.name !== 'shipper') {
        return {
          eligible: false,
          reasons: ['User is not a shipper'],
          score: 0
        };
      }

      // Check if account is active
      if (!shipper.isActive) {
        return {
          eligible: false,
          reasons: ['Account is not active'],
          score: 0
        };
      }

      // Certificate status check (if exists)
      if (shipper.shipperCertificateInfo) {
        if (shipper.shipperCertificateInfo.status !== 'APPROVED') {
          return {
            eligible: false,
            reasons: ['Shipper certificate not approved'],
            score: 0
          };
        }
      } else {
        // No certificate info - this might be optional depending on your business logic
        this.logger.warn(`⚠️ Shipper ${shipper.id} has no certificate info`);
        score -= 10; // Small penalty but still eligible
      }

      // Safely check completion rate
      const totalDeliveries = (shipper.completedDeliveries || 0) + (shipper.failedDeliveries || 0);
      if (totalDeliveries >= constraints.min_total_orders) {
        const completionRate = totalDeliveries > 0 ? (shipper.completedDeliveries || 0) / totalDeliveries : 0;
        if (completionRate < constraints.min_completion_rate) {
          reasons.push(`Completion rate ${(completionRate * 100).toFixed(1)}% below minimum ${(constraints.min_completion_rate * 100)}%`);
          score -= 30;
        } else {
          // Bonus for high completion rate
          score += Math.min(20, (completionRate - constraints.min_completion_rate) * 50);
        }
      } else {
        // New shipper - minor penalty but still eligible
        score -= 5;
        this.logger.debug(`Shipper ${shipper.id} is new with ${totalDeliveries} total deliveries`);
      }

      // Check active deliveries
      const activeDeliveries = shipper.activeDeliveries || 0;
      if (activeDeliveries >= constraints.max_active_deliveries) {
        reasons.push(`Too many active deliveries: ${activeDeliveries}/${constraints.max_active_deliveries}`);
        score -= 40;
      } else {
        // Bonus for availability
        score += (constraints.max_active_deliveries - activeDeliveries) * 5;
      }

      // Check rating (if available)
      const rating = shipper.averageRating || 5.0; // Default to 5.0 for new shippers
      if (rating < constraints.min_shipper_rating) {
        reasons.push(`Rating ${rating} below minimum ${constraints.min_shipper_rating}`);
        score -= 25;
      } else {
        // Bonus for high rating
        score += Math.min(15, (rating - constraints.min_shipper_rating) * 10);
      }

      // Additional performance factors
      score += this.calculateShipperScore(shipper, constraints);

      // Determine eligibility
      const eligible = reasons.length === 0 && score >= 30; // Minimum score threshold

      if (!eligible && reasons.length === 0) {
        reasons.push(`Score ${score.toFixed(1)} below minimum threshold of 30`);
      }

      return {
        eligible,
        reasons,
        score: Math.max(0, Math.round(score * 100) / 100)
      };

    } catch (error) {
      this.logger.error(`❌ Error checking shipper eligibility for ${shipper.id}: ${error.message}`);
      return {
        eligible: false,
        reasons: ['Error checking eligibility'],
        score: 0
      };
    }
  }

  /**
   * Calculate a score for shipper ranking (higher is better) - ENHANCED
   */
  private calculateShipperScore(shipper: User, constraints: SystemConstraint): number {
    let score = 0;

    try {
      // Performance metrics
      const totalDeliveries = (shipper.completedDeliveries || 0) + (shipper.failedDeliveries || 0);
      const completionRate = totalDeliveries > 0 ? (shipper.completedDeliveries || 0) / totalDeliveries : 1;

      // Experience bonus (completed deliveries)
      score += Math.min(25, (shipper.completedDeliveries || 0) * 0.5);

      // Completion rate bonus (beyond minimum requirement)
      if (completionRate > constraints.min_completion_rate) {
        score += (completionRate - constraints.min_completion_rate) * 30;
      }

      // Rating bonus
      const rating = shipper.averageRating || 5.0;
      if (rating > constraints.min_shipper_rating) {
        score += (rating - constraints.min_shipper_rating) * 8;
      }

      // Availability bonus (fewer active deliveries = more available)
      const activeDeliveries = shipper.activeDeliveries || 0;
      score += Math.max(0, (constraints.max_active_deliveries - activeDeliveries) * 3);

      // Time-based factors
      const now = new Date();
      if (shipper.lastActiveAt) {
        const minutesInactive = (now.getTime() - new Date(shipper.lastActiveAt).getTime()) / (1000 * 60);
        if (minutesInactive < 5) {
          score += 10; // Very recent activity
        } else if (minutesInactive < 30) {
          score += 5; // Recent activity
        }
      }

      // Reliability factors
      const lateDeliveries = shipper.lateDeliveries || 0;
      const onTimeDeliveries = shipper.onTimeDeliveries || 0;
      const totalTimedDeliveries = lateDeliveries + onTimeDeliveries;
      
      if (totalTimedDeliveries > 0) {
        const onTimeRate = onTimeDeliveries / totalTimedDeliveries;
        score += onTimeRate * 15; // Up to 15 points for perfect on-time delivery
      }

      // Response time bonus
      const responseTime = shipper.responseTimeMinutes || 5;
      if (responseTime < 2) {
        score += 8; // Very fast response
      } else if (responseTime < 5) {
        score += 4; // Good response time
      }

      // Penalty for rejection rate
      const rejectedOrders = shipper.rejectedOrders || 0;
      if (rejectedOrders > 0 && totalDeliveries > 0) {
        const rejectionRate = rejectedOrders / (rejectedOrders + totalDeliveries);
        score -= rejectionRate * 20; // Up to 20 point penalty
      }

      return Math.max(0, score);
    } catch (error) {
      this.logger.error(`Error calculating shipper score: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate shipping fee based on distance - ENHANCED
   */
  async calculateShippingFee(distanceKm: number): Promise<number> {
    try {
      const constraints = await this.getConstraints();
      
      if (distanceKm <= constraints.base_distance_km) {
        return constraints.base_shipping_fee;
      } else if (distanceKm <= constraints.tier2_distance_km) {
        return constraints.tier2_shipping_fee;
      } else {
        return constraints.tier3_shipping_fee;
      }
    } catch (error) {
      this.logger.error(`Error calculating shipping fee: ${error.message}`);
      // Fallback to hardcoded tiers
      if (distanceKm <= 5) return 15000;
      if (distanceKm <= 10) return 25000;
      return 35000;
    }
  }

  /**
   * Check if distance is within delivery limits
   */
  async isDistanceWithinLimits(distanceKm: number): Promise<boolean> {
    try {
      const constraints = await this.getConstraints();
      return distanceKm <= constraints.max_delivery_distance;
    } catch (error) {
      this.logger.error(`Error checking distance limits: ${error.message}`);
      return distanceKm <= 30; // Fallback limit
    }
  }

  /**
   * Get maximum delivery time in minutes
   */
  async getMaxDeliveryTime(): Promise<number> {
    try {
      const constraints = await this.getConstraints();
      return constraints.max_delivery_time_min;
    } catch (error) {
      this.logger.error(`Error getting max delivery time: ${error.message}`);
      return 45; // Fallback value
    }
  }

  /**
   * Get maximum delivery distance in kilometers
   */
  async getMaxDeliveryDistance(): Promise<number> {
    try {
      const constraints = await this.getConstraints();
      return constraints.max_delivery_distance;
    } catch (error) {
      this.logger.error(`Error getting max delivery distance: ${error.message}`);
      return 30; // Fallback value
    }
  }

  /**
   * Get shipper commission rate from system settings
   */
  async getShipperCommissionRate(): Promise<number> {
    // This could be configurable in the database, for now default to 80%
    return 0.8;
  }

  /**
   * Calculate shipper earnings from shipping fee
   */
  async calculateShipperEarnings(shippingFee: number): Promise<number> {
    const commissionRate = await this.getShipperCommissionRate();
    return Math.round(shippingFee * commissionRate);
  }

  /**
   * Get comprehensive delivery fee breakdown
   */
  async getDeliveryFeeBreakdown(distance: number): Promise<{
    distance: number;
    shippingFee: number;
    shipperEarnings: number;
    platformFee: number;
    commissionRate: number;
    feeStructure: string;
  }> {
    try {
      const shippingFee = await this.calculateShippingFee(distance);
      const shipperEarnings = await this.calculateShipperEarnings(shippingFee);
      const platformFee = shippingFee - shipperEarnings;
      const commissionRate = await this.getShipperCommissionRate();

      let feeStructure = '';
      if (distance <= 5) {
        feeStructure = 'Tier 1: 0-5km';
      } else if (distance <= 10) {
        feeStructure = 'Tier 2: 5-10km';
      } else {
        feeStructure = 'Tier 3: 10km+';
      }

      return {
        distance: Math.round(distance * 100) / 100,
        shippingFee,
        shipperEarnings,
        platformFee,
        commissionRate,
        feeStructure
      };
    } catch (error) {
      this.logger.error(`Error getting delivery fee breakdown: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update system constraints (admin only)
   */
  async updateConstraints(updates: Partial<SystemConstraint>): Promise<SystemConstraint> {
    try {
      let constraints = await this.systemConstraintsRepository.findOne({
        where: {} // Get any existing record
      });

      if (!constraints) {
        constraints = await this.createDefaultConstraints();
      }

      // Apply updates
      Object.assign(constraints, updates);
      
      const updated = await this.systemConstraintsRepository.save(constraints);
      
      // Clear cache to force reload
      this.clearCache();
      
      this.logger.log('✅ System constraints updated successfully');
      return updated;
    } catch (error) {
      this.logger.error(`Error updating constraints: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear cache (useful for testing or manual cache refresh)
   */
  clearCache(): void {
    this.cachedConstraints = null;
    this.lastCacheUpdate = new Date(0);
    this.logger.log('🗑️ System constraints cache cleared');
  }
}
