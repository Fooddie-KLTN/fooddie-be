import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from 'src/entities/review.entity';
import { CreateFoodReviewDto, CreateShipperReviewDto } from './dto/create-review.dto';
import { Food } from 'src/entities/food.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
export class ReviewService {
    constructor(
        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,
        @InjectRepository(Food)
        private foodRepository: Repository<Food>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    async createFoodReview(data: CreateFoodReviewDto, userId: string) {
        // Check if the user exists
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        // Find the food
        const food = await this.foodRepository.findOne({ 
            where: { id: data.foodId },
            relations: ['reviews'] // Load existing reviews to calculate new rating
        });

        if (!food) {
            throw new Error('Food not found');
        }

        // Check if user already reviewed this food
        const existingReview = await this.reviewRepository.findOne({
            where: {
                user: { id: userId },
                food: { id: data.foodId },
                type: 'food'
            }
        });

        if (existingReview) {
            throw new Error('You have already reviewed this food');
        }

        // Create the review without circular references
        const review = this.reviewRepository.create({
            user: user,
            food: food,
            rating: data.rating,
            comment: data.comment,
            image: data.image,
            type: 'food'
        });

        // Save the review first
        const savedReview = await this.reviewRepository.save(review);

        // Calculate new average rating
        const allReviews = await this.reviewRepository.find({
            where: { food: { id: data.foodId }, type: 'food' }
        });

        const newRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

        // check if food is bad
        if (food.reviews?.length && food.reviews.length > 10 && food.rating < 1.5 )
        {
            food.status = 'unavailable';
            await this.foodRepository.save(food);
        }
        
        // Update food rating without loading reviews to avoid circular reference
        await this.foodRepository.update(data.foodId, { 
            rating: Math.round(newRating * 100) / 100 // Round to 2 decimal places
        });

        // Return a clean review object without circular references
        return {
            id: savedReview.id,
            rating: savedReview.rating,
            comment: savedReview.comment,
            image: savedReview.image,
            type: savedReview.type,
            createdAt: savedReview.createdAt,
            user: {
                id: user.id,
                name: user.name,
                avatar: user.avatar
            },
            food: {
                id: food.id,
                name: food.name,
                rating: newRating
            }
        };
    }

    async createShipperReview(data: CreateShipperReviewDto, userId: string) {
        // Check if the user exists
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        // Find the shipper
        const shipper = await this.userRepository.findOne({ where: { id: data.shipperId } });
        if (!shipper) {
            throw new Error('Shipper not found');
        }

        // Check if user already reviewed this shipper
        const existingReview = await this.reviewRepository.findOne({
            where: {
                user: { id: userId },
                shipper: { id: data.shipperId },
                type: 'shipper'
            }
        });

        if (existingReview) {
            throw new Error('You have already reviewed this shipper');
        }

        // Create the review
        const review = this.reviewRepository.create({
            user: user,
            shipper: shipper,
            rating: data.rating,
            comment: data.comment,
            type: 'shipper'
        });

        const savedReview = await this.reviewRepository.save(review);

        // Return a clean review object
        return {
            id: savedReview.id,
            rating: savedReview.rating,
            comment: savedReview.comment,
            type: savedReview.type,
            createdAt: savedReview.createdAt,
            user: {
                id: user.id,
                name: user.name,
                avatar: user.avatar
            },
            shipper: {
                id: shipper.id,
                name: shipper.name,
                avatar: shipper.avatar
            }
        };
    }

    async getReviewsForFood(foodId: string) {
        const reviews = await this.reviewRepository.find({
            where: { food: { id: foodId }, type: 'food' },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });

        // Return clean data without circular references
        return reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            image: review.image,
            createdAt: review.createdAt,
            user: {
                id: review.user.id,
                name: review.user.name,
                avatar: review.user.avatar
            }
        }));
    }

    async getReviewsForShipper(shipperId: string) {
        const reviews = await this.reviewRepository.find({
            where: { shipper: { id: shipperId }, type: 'shipper' },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });

        // Return clean data without circular references
        return reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            user: {
                id: review.user.id,
                name: review.user.name,
                avatar: review.user.avatar
            }
        }));
    }

    async updateReview(id: string, comment: string, rating: number) {
        const review = await this.reviewRepository.findOne({ 
            where: { id },
            relations: ['user', 'food'] 
        });
        
        if (!review) throw new Error('Review not found');
        
        review.comment = comment;
        review.rating = rating;
        
        const savedReview = await this.reviewRepository.save(review);

        // If it's a food review, update the food's average rating
        if (review.type === 'food' && review.food) {
            const allReviews = await this.reviewRepository.find({
                where: { food: { id: review.food.id }, type: 'food' }
            });

            const newRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
            await this.foodRepository.update(review.food.id, { 
                rating: Math.round(newRating * 100) / 100 
            });
        }

        // Return clean data
        return {
            id: savedReview.id,
            rating: savedReview.rating,
            comment: savedReview.comment,
            image: savedReview.image,
            type: savedReview.type,
            createdAt: savedReview.createdAt
        };
    }

    async deleteReview(id: string) {
        const review = await this.reviewRepository.findOne({
            where: { id },
            relations: ['food']
        });

        if (!review) throw new Error('Review not found');

        await this.reviewRepository.delete(id);

        // If it's a food review, recalculate the food's rating
        if (review.type === 'food' && review.food) {
            const remainingReviews = await this.reviewRepository.find({
                where: { food: { id: review.food.id }, type: 'food' }
            });

            if (remainingReviews.length > 0) {
                const newRating = remainingReviews.reduce((acc, r) => acc + r.rating, 0) / remainingReviews.length;
                await this.foodRepository.update(review.food.id, { 
                    rating: Math.round(newRating * 100) / 100 
                });
            } else {
                // No reviews left, set rating to null or 0
                await this.foodRepository.update(review.food.id, { rating: 0 });
            }
        }

        return { message: 'Review deleted successfully' };
    }
}
