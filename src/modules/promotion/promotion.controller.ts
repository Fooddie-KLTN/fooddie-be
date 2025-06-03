import { Controller, Post, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Controller('promotions')
export class PromotionController {
    constructor(private readonly promotionService: PromotionService) {}

    @Post()
    createPromotion(@Body() createPromotionDto: CreatePromotionDto) {
        return this.promotionService.createPromotion(createPromotionDto);
    }

    @Get()
    getAllPromotions() {
        return this.promotionService.getAllPromotions();
    }

    @Get(':id')
    getPromotionById(@Param('id') id: string) {
        return this.promotionService.getPromotionById(id);
    }

    @Put(':id')
    updatePromotion(@Param('id') id: string, @Body() updatePromotionDto: UpdatePromotionDto) {
        return this.promotionService.updatePromotion(id, updatePromotionDto);
    }

    @Delete(':id')
    deletePromotion(@Param('id') id: string) {
        return this.promotionService.deletePromotion(id);
    }
}
