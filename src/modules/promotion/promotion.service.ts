import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion, PromotionType } from 'src/entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { GoogleCloudStorageService } from 'src/gcs/gcs.service';

@Injectable()
export class PromotionService {
    constructor(
        @InjectRepository(Promotion)
        private promotionRepository: Repository<Promotion>,
        private readonly gcsService: GoogleCloudStorageService
    ) {}

    async createPromotion(data: CreatePromotionDto) {
        // Validate dates
        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            
            if (startDate >= endDate) {
                throw new BadRequestException('Start date must be before end date');
            }
        }

        // Validate discount fields
        if (!data.discountPercent && !data.discountAmount) {
            throw new BadRequestException('Either discountPercent or discountAmount must be provided');
        }

        if (data.discountPercent && data.discountAmount) {
            throw new BadRequestException('Cannot provide both discountPercent and discountAmount');
        }

        if (data.discountPercent && (data.discountPercent < 0 || data.discountPercent > 100)) {
            throw new BadRequestException('Discount percent must be between 0 and 100');
        }

        const promotionData = {
            description: data.description,
            type: data.type,
            discountPercent: data.discountPercent,
            discountAmount: data.discountAmount,
            minOrderValue: data.minOrderValue,
            maxDiscountAmount: data.maxDiscountAmount,
            code: data.code,
            image: data.image,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
            maxUsage: data.maxUsage,
            numberOfUsed: 0,
        };

        const promotion = this.promotionRepository.create(promotionData);
        return await this.promotionRepository.save(promotion);
    }

    async getAllPromotions() {
        return await this.promotionRepository.find();
    }

    async getActivePromotions() {
        const now = new Date();
        return await this.promotionRepository
            .createQueryBuilder('promotion')
            .where('(promotion.startDate IS NULL OR promotion.startDate <= :now)', { now })
            .andWhere('(promotion.endDate IS NULL OR promotion.endDate >= :now)', { now })
            .andWhere('(promotion.maxUsage IS NULL OR promotion.numberOfUsed < promotion.maxUsage)')
            .getMany();
    }

    async getActivePromotionsByType(type: PromotionType) {
        const now = new Date();
        return await this.promotionRepository
            .createQueryBuilder('promotion')
            .where('promotion.type = :type', { type })
            .andWhere('(promotion.startDate IS NULL OR promotion.startDate <= :now)', { now })
            .andWhere('(promotion.endDate IS NULL OR promotion.endDate >= :now)', { now })
            .andWhere('(promotion.maxUsage IS NULL OR promotion.numberOfUsed < promotion.maxUsage)')
            .getMany();
    }

    async getPromotionById(id: string) {
        const promotion = await this.promotionRepository.findOne({ where: { id } });
        if (!promotion) throw new NotFoundException('Promotion not found');
        return promotion;
    }

    async getPromotionByCode(code: string) {
        const promotion = await this.promotionRepository.findOne({ where: { code } });
        if (!promotion) throw new NotFoundException('Promotion not found');
        return promotion;
    }

    async validatePromotion(code: string, orderValue?: number): Promise<{ 
        valid: boolean; 
        promotion?: Promotion; 
        reason?: string;
        calculatedDiscount?: number;
    }> {
        const promotion = await this.promotionRepository.findOne({ where: { code } });
        
        if (!promotion) {
            return { valid: false, reason: 'Promotion code not found' };
        }

        const now = new Date();

        // Check if promotion has started
        if (promotion.startDate && promotion.startDate > now) {
            return { valid: false, reason: 'Promotion has not started yet' };
        }

        // Check if promotion has ended
        if (promotion.endDate && promotion.endDate < now) {
            return { valid: false, reason: 'Promotion has expired' };
        }

        // Check usage limit
        if (promotion.maxUsage && promotion.numberOfUsed >= promotion.maxUsage) {
            return { valid: false, reason: 'Promotion usage limit reached' };
        }

        // Check minimum order value
        if (promotion.minOrderValue && orderValue && orderValue < promotion.minOrderValue) {
            return { 
                valid: false, 
                reason: `Minimum order value of ${promotion.minOrderValue} required` 
            };
        }

        // Calculate discount
        let calculatedDiscount = 0;
        if (orderValue) {
            calculatedDiscount = this.calculateDiscount(promotion, orderValue);
        }

        return { 
            valid: true, 
            promotion, 
            calculatedDiscount 
        };
    }

    calculateDiscount(promotion: Promotion, orderValue: number): number {
        let discount = 0;

        if (promotion.discountPercent) {
            discount = (orderValue * promotion.discountPercent) / 100;
        } else if (promotion.discountAmount) {
            discount = promotion.discountAmount;
        }

        // Apply maximum discount limit if set
        if (promotion.maxDiscountAmount && discount > promotion.maxDiscountAmount) {
            discount = promotion.maxDiscountAmount;
        }

        return Number(discount.toFixed(2));
    }

    async usePromotion(code: string, orderValue?: number): Promise<Promotion> {
        const validation = await this.validatePromotion(code, orderValue);
        
        if (!validation.valid || !validation.promotion) {
            throw new BadRequestException(validation.reason || 'Invalid promotion');
        }

        // Increment usage count
        await this.promotionRepository.increment(
            { id: validation.promotion.id },
            'numberOfUsed',
            1
        );

        return await this.getPromotionById(validation.promotion.id);
    }

    async updatePromotion(id: string, data: UpdatePromotionDto) {
        const promotion = await this.getPromotionById(id);

        // Validate dates if both are provided
        const startDate = data.startDate ? new Date(data.startDate) : promotion.startDate;
        const endDate = data.endDate ? new Date(data.endDate) : promotion.endDate;

        if (startDate && endDate && startDate >= endDate) {
            throw new BadRequestException('Start date must be before end date');
        }

        // Validate discount fields
        const newDiscountPercent = data.discountPercent !== undefined ? data.discountPercent : promotion.discountPercent;
        const newDiscountAmount = data.discountAmount !== undefined ? data.discountAmount : promotion.discountAmount;

        if (!newDiscountPercent && !newDiscountAmount) {
            throw new BadRequestException('Either discountPercent or discountAmount must be provided');
        }

        if (newDiscountPercent && newDiscountAmount) {
            throw new BadRequestException('Cannot provide both discountPercent and discountAmount');
        }

        // Handle image update
        if (promotion.image && data.image && promotion.image !== data.image) {
            await this.gcsService.deleteFile(promotion.image);
        }

        // Build update object with proper typing
        const updateData: Partial<Promotion> = {};
        
        if (data.description !== undefined) updateData.description = data.description;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.discountPercent !== undefined) updateData.discountPercent = data.discountPercent;
        if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount;
        if (data.minOrderValue !== undefined) updateData.minOrderValue = data.minOrderValue;
        if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount;
        if (data.code !== undefined) updateData.code = data.code;
        if (data.image !== undefined) updateData.image = data.image;
        if (data.maxUsage !== undefined) updateData.maxUsage = data.maxUsage;
        if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
        if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);

        await this.promotionRepository.update(id, updateData);
        return this.getPromotionById(id);
    }

    async deletePromotion(id: string) {
        const promotion = await this.getPromotionById(id);
        
        // Delete image if exists
        if (promotion.image) {
            await this.gcsService.deleteFile(promotion.image);
        }

        const result = await this.promotionRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException('Promotion not found');
        return { message: 'Promotion deleted successfully' };
    }

    async resetPromotionUsage(id: string) {
        await this.promotionRepository.update(id, { numberOfUsed: 0 });
        return this.getPromotionById(id);
    }

    /**
     * Get all promotions with pagination for guest users
     * 
     * @param page The page number
     * @param pageSize The number of items per page
     * @param type Optional promotion type filter
     * @returns List of all promotions with pagination metadata
     */
    async getAllPromotionsWithPagination(page = 1, pageSize = 10, type?: PromotionType): Promise<{
        items: Promotion[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const queryBuilder = this.promotionRepository.createQueryBuilder('promotion');
        
        if (type) {
            queryBuilder.where('promotion.type = :type', { type });
        }

        const [items, totalItems] = await queryBuilder
            .orderBy('promotion.id', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        return {
            items,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get active promotions with pagination for guest users
     * 
     * @param page The page number
     * @param pageSize The number of items per page
     * @param type Optional promotion type filter
     * @returns List of active promotions with pagination metadata
     */
    async getActivePromotionsWithPagination(
        page = 1,
        pageSize = 10,
        type?: PromotionType,
        name?: string
    ): Promise<{
        items: Promotion[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const now = new Date();

        const queryBuilder = this.promotionRepository
            .createQueryBuilder('promotion')
            .where('(promotion.startDate IS NULL OR promotion.startDate <= :now)', { now })
            .andWhere('(promotion.endDate IS NULL OR promotion.endDate >= :now)', { now })
            .andWhere('(promotion.maxUsage IS NULL OR promotion.numberOfUsed < promotion.maxUsage)');

        if (type) {
            queryBuilder.andWhere('promotion.type = :type', { type });
        }
        if (name) {
            queryBuilder.andWhere('LOWER(promotion.description) LIKE :name', { name: `%${name.toLowerCase()}%` });
        }

        const [items, totalItems] = await queryBuilder
            .orderBy('promotion.id', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        return {
            items,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }
}
