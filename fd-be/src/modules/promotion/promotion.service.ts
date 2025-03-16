import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from 'src/entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionService {
    constructor(
        @InjectRepository(Promotion)
        private promotionRepository: Repository<Promotion>,
    ) {}

    async createPromotion(data: CreatePromotionDto) {
        const promotion = this.promotionRepository.create(data);
        return await this.promotionRepository.save(promotion);
    }

    async getAllPromotions() {
        return await this.promotionRepository.find();
    }

    async getPromotionById(id: string) {
        const promotion = await this.promotionRepository.findOne({ where: { id } });
        if (!promotion) throw new NotFoundException('Promotion not found');
        return promotion;
    }

    async updatePromotion(id: string, data: UpdatePromotionDto) {
        await this.promotionRepository.update(id, data);
        return this.getPromotionById(id);
    }

    async deletePromotion(id: string) {
        const result = await this.promotionRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException('Promotion not found');
        return { message: 'Promotion deleted successfully' };
    }
}
