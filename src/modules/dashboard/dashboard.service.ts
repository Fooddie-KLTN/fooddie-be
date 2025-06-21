import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Order } from 'src/entities/order.entity';
import { ShippingDetail } from 'src/entities/shippingDetail.entity';
import { 
  startOfYear, 
  endOfYear, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  subYears,
  subMonths,
  subWeeks,
  format,
  eachMonthOfInterval,
  eachDayOfInterval,
  eachWeekOfInterval,
  startOfDay,
  endOfDay
} from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ShippingDetail)
    private shippingDetailRepository: Repository<ShippingDetail>,
  ) {}

  async getDashboardStats() {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Get shipper stats
    const totalShippers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .where('role.name = :roleName', { roleName: 'shipper' })
      .getCount();

    const previousYearShippers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .where('role.name = :roleName', { roleName: 'shipper' })
      .andWhere('user.createdAt BETWEEN :start AND :end', {
        start: new Date(previousYear, 0, 1),
        end: new Date(previousYear, 11, 31)
      })
      .getCount();

    // Get active shippers (who have completed at least one order this year)
    const activeShippers = await this.shippingDetailRepository
      .createQueryBuilder('sd')
      .leftJoin('sd.shipper', 'shipper')
      .where('sd.status = :status', { status: 'COMPLETED' })
      .andWhere('sd.actualDeliveryTime >= :startYear', { 
        startYear: new Date(currentYear, 0, 1) 
      })
      .andWhere('sd.actualDeliveryTime <= :endYear', { 
        endYear: new Date(currentYear, 11, 31) 
      })
      .select('COUNT(DISTINCT sd.shipper)', 'count')
      .getRawOne();

    const previousYearActiveShippers = await this.shippingDetailRepository
      .createQueryBuilder('sd')
      .leftJoin('sd.shipper', 'shipper')
      .where('sd.status = :status', { status: 'COMPLETED' })
      .andWhere('sd.actualDeliveryTime >= :startYear', { 
        startYear: new Date(previousYear, 0, 1) 
      })
      .andWhere('sd.actualDeliveryTime <= :endYear', { 
        endYear: new Date(previousYear, 11, 31) 
      })
      .select('COUNT(DISTINCT sd.shipper)', 'count')
      .getRawOne();

    // Get completed orders
    const completedOrders = await this.orderRepository.count({
      where: {
        status: 'completed',
        createdAt: Between(
          new Date(currentYear, 0, 1),
          new Date(currentYear, 11, 31)
        )
      }
    });

    const previousYearCompletedOrders = await this.orderRepository.count({
      where: {
        status: 'completed',
        createdAt: Between(
          new Date(previousYear, 0, 1),
          new Date(previousYear, 11, 31)
        )
      }
    });

    // Calculate percentage changes
    const shipperChange = previousYearShippers > 0 
      ? ((totalShippers - previousYearShippers) / previousYearShippers * 100).toFixed(2)
      : '0';

    const activeShipperChange = previousYearActiveShippers.count > 0
      ? ((activeShippers.count - previousYearActiveShippers.count) / previousYearActiveShippers.count * 100).toFixed(2)
      : '0';

    const orderChange = previousYearCompletedOrders > 0
      ? ((completedOrders - previousYearCompletedOrders) / previousYearCompletedOrders * 100).toFixed(2)
      : '0';

    return [
      {
        title: "Shipper",
        value: totalShippers.toLocaleString(),
        previousValue: previousYearShippers.toLocaleString(),
        change: `${shipperChange > '0' ? '+' : ''}${shipperChange}% so với năm trước`,
        isPositive: parseFloat(shipperChange) >= 0,
      },
      {
        title: "Shipper Hoạt Động",
        value: activeShippers.count.toLocaleString(),
        previousValue: previousYearActiveShippers.count.toLocaleString(),
        change: `${activeShipperChange > '0' ? '+' : ''}${activeShipperChange}% so với năm trước`,
        isPositive: parseFloat(activeShipperChange) >= 0,
      },
      {
        title: "Hoàn thành đơn hàng",
        value: completedOrders.toLocaleString(),
        previousValue: previousYearCompletedOrders.toLocaleString(),
        change: `${orderChange > '0' ? '+' : ''}${orderChange}% so với năm trước`,
        isPositive: parseFloat(orderChange) >= 0,
      }
    ];
  }

  async getChartData(period: 'year' | 'month' | 'week', metric: 'overview' | 'orders' | 'revenue') {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let intervals: Date[];
    let labelFormat: string;

    switch (period) {
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        labelFormat = 'MMM';
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        labelFormat = 'd';
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        labelFormat = 'EEEEEE'; // Short day names
        break;
    }

    const labels = intervals.map(date => {
      if (period === 'week') {
        const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        const dayIndex = date.getDay();
        return dayNames[dayIndex === 0 ? 6 : dayIndex - 1];
      }
      return format(date, labelFormat);
    });

    if (metric === 'orders' || metric === 'overview') {
      const orderData = await this.getOrderDataForPeriod(intervals, period);
      if (metric === 'orders') {
        return {
          order: {
            labels,
            values: orderData,
          }
        };
      }
    }

    if (metric === 'revenue' || metric === 'overview') {
      const revenueData = await this.getRevenueDataForPeriod(intervals, period);
      if (metric === 'revenue') {
        return {
          revenue: {
            labels,
            values: revenueData,
          }
        };
      }
    }

    // Overview - return both
    const orderData = await this.getOrderDataForPeriod(intervals, period);
    const revenueData = await this.getRevenueDataForPeriod(intervals, period);

    return {
      order: {
        labels,
        values: orderData,
      },
      revenue: {
        labels,
        values: revenueData,
      }
    };
  }

  private async getOrderDataForPeriod(intervals: Date[], period: 'year' | 'month' | 'week'): Promise<number[]> {
    const data: number[] = [];

    for (const date of intervals) {
      let start: Date;
      let end: Date;

      switch (period) {
        case 'year':
          start = startOfMonth(date);
          end = endOfMonth(date);
          break;
        case 'month':
        case 'week':
          start = startOfDay(date);
          end = endOfDay(date);
          break;
      }

      const count = await this.orderRepository.count({
        where: {
          status: 'completed',
          createdAt: Between(start, end)
        }
      });

      data.push(count);
    }

    return data;
  }

  private async getRevenueDataForPeriod(intervals: Date[], period: 'year' | 'month' | 'week'): Promise<number[]> {
    const data: number[] = [];

    for (const date of intervals) {
      let start: Date;
      let end: Date;

      switch (period) {
        case 'year':
          start = startOfMonth(date);
          end = endOfMonth(date);
          break;
        case 'month':
        case 'week':
          start = startOfDay(date);
          end = endOfDay(date);
          break;
      }

      const result = await this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total)', 'sum')
        .where('order.status = :status', { status: 'completed' })
        .andWhere('order.createdAt >= :start AND order.createdAt <= :end', { start, end })
        .getRawOne();

      data.push(Number(result.sum) || 0);
    }

    return data;
  }

async getShipperStats(period: 'year' | 'month' | 'week') {
    // Implementation for detailed shipper statistics
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (period) {
      case 'year':
        startDate = startOfYear(now);
        previousStartDate = startOfYear(subYears(now, 1));
        break;
      case 'month':
        startDate = startOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
    }

    // Get current period stats
    const currentStats = await this.shippingDetailRepository
      .createQueryBuilder('sd')
      .select('COUNT(DISTINCT sd.shipper)', 'activeShippers')
      .addSelect('COUNT(*)', 'totalDeliveries')
      .where('sd.status = :status', { status: 'COMPLETED' })
      .andWhere('sd.actualDeliveryTime >= :startDate', { startDate })
      .getRawOne();

    return {
      period,
      activeShippers: Number(currentStats.activeShippers),
      totalDeliveries: Number(currentStats.totalDeliveries),
    };
  }

  async getOrderCompletionStats(period: 'year' | 'month' | 'week') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'year':
        startDate = startOfYear(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
    }

    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.createdAt >= :startDate', { startDate })
      .groupBy('order.status')
      .getRawMany();

    const totalOrders = stats.reduce((sum, stat) => sum + Number(stat.count), 0);
    const completedOrders = stats.find(stat => stat.status === 'completed')?.count || 0;
    const completionRate = totalOrders > 0 ? (Number(completedOrders) / totalOrders * 100).toFixed(2) : '0';

    return {
      period,
      totalOrders,
      completedOrders: Number(completedOrders),
      completionRate: parseFloat(completionRate),
      breakdown: stats.map(stat => ({
        status: stat.status,
        count: Number(stat.count),
        percentage: totalOrders > 0 ? (Number(stat.count) / totalOrders * 100).toFixed(2) : '0'
      }))
    };
  }
}