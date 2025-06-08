import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, DefaultValuePipe, ParseIntPipe, Query } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';

@Controller('promotions')
export class PromotionController {
    constructor(private readonly promotionService: PromotionService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Permissions(Permission.PROMOTION.CREATE)
    createPromotion(@Body() createPromotionDto: CreatePromotionDto) {
        return this.promotionService.createPromotion(createPromotionDto);
    }

    @Get('all')
    async getPublicActivePromotions(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
        @Query('name') name?: string, // <-- Add name query param
    ) {
        return this.promotionService.getActivePromotionsWithPagination(page, pageSize, undefined, name);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Permissions(Permission.PROMOTION.READ)
    getAllPromotions() {
        return this.promotionService.getAllPromotions();
    }

    @Get(':id')
    @Permissions(Permission.PROMOTION.CREATE)
    getPromotionById(@Param('id') id: string) {
        return this.promotionService.getPromotionById(id);
    }

    @Put(':id')
    @Permissions(Permission.PROMOTION.WRITE)
    updatePromotion(@Param('id') id: string, @Body() updatePromotionDto: UpdatePromotionDto) {
        return this.promotionService.updatePromotion(id, updatePromotionDto);
    }

    @Delete(':id')
    @Permissions(Permission.PROMOTION.DELETE)
    deletePromotion(@Param('id') id: string) {
        return this.promotionService.deletePromotion(id);
    }
}
