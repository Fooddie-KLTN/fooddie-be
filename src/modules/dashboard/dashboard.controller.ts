import { Controller, Get, Query, UseGuards, DefaultValuePipe } from '@nestjs/common';

import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(RolesGuard)
@Permissions(Permission.DASHBOARD.READ)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats() {
    return await this.dashboardService.getDashboardStats();
  }

  @Get('chart-data')
  async getChartData(
    @Query('period', new DefaultValuePipe('year')) period: 'year' | 'month' | 'week',
    @Query('metric', new DefaultValuePipe('overview')) metric: 'overview' | 'orders' | 'revenue'
  ) {
    return await this.dashboardService.getChartData(period, metric);
  }

  @Get('shipper-stats')
  async getShipperStats(
    @Query('period', new DefaultValuePipe('year')) period: 'year' | 'month' | 'week'
  ) {
    return await this.dashboardService.getShipperStats(period);
  }

  @Get('order-completion-stats')
  async getOrderCompletionStats(
    @Query('period', new DefaultValuePipe('year')) period: 'year' | 'month' | 'week'
  ) {
    return await this.dashboardService.getOrderCompletionStats(period);
  }
}