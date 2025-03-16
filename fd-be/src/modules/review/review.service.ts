import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from 'src/entities/review.entity';
import { CreateFoodReviewDto, CreateShipperReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
    constructor(
        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,
    ) {}

    async createFoodReview(data: CreateFoodReviewDto) {
        const review = this.reviewRepository.create({ ...data, type: 'food' });
        return await this.reviewRepository.save(review);
    }

    async createShipperReview(data: CreateShipperReviewDto) {
        const review = this.reviewRepository.create({ ...data, type: 'shipper' });
        return await this.reviewRepository.save(review);
    }

    async getReviewsForFood(foodId: string) {
        return await this.reviewRepository.find({
            where: { food: { id: foodId }, type: 'food' },
            relations: ['user'],
        });
    }

    async getReviewsForShipper(shipperId: string) {
        return await this.reviewRepository.find({
            where: { shipper: { id: shipperId }, type: 'shipper' },
            relations: ['user'],
        });
    }

    async updateReview(id: string, comment: string, rating: number) {
        const review = await this.reviewRepository.findOne({ where: { id } });
        if (!review) throw new Error('Review not found');
        review.comment = comment;
        review.rating = rating;
        return await this.reviewRepository.save(review);
    }

    async deleteReview(id: string) {
        return await this.reviewRepository.delete(id);
    }
}
