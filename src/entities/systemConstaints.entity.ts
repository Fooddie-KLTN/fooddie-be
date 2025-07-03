import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_constraints')
export class SystemConstraint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float', default: 0.7 })
  min_completion_rate: number;

  @Column({ type: 'int', default: 10 })
  min_total_orders: number;

  @Column({ type: 'int', default: 3 })
  max_active_deliveries: number;

  @Column({ type: 'float', default: 30 })
  max_delivery_distance: number;

  @Column({ type: 'float', default: 3.5 })
  min_shipper_rating: number;

  @Column({ type: 'int', default: 45 })
  max_delivery_time_min: number;

  // Shipping fee tiers
  @Column({ type: 'float', default: 5 })
  base_distance_km: number;

  @Column({ type: 'int', default: 15000 })
  base_shipping_fee: number;

  @Column({ type: 'float', default: 10 })
  tier2_distance_km: number;

  @Column({ type: 'int', default: 25000 })
  tier2_shipping_fee: number;

  @Column({ type: 'int', default: 35000 })
  tier3_shipping_fee: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}