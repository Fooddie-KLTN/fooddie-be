import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateFoodReviewDto, CreateShipperReviewDto, UpdateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) {}

    @Post('food')
    createFoodReview(@Body() createFoodReviewDto: CreateFoodReviewDto) {
        return this.reviewService.createFoodReview(createFoodReviewDto);
    }

    @Post('shipper')
    createShipperReview(@Body() createShipperReviewDto: CreateShipperReviewDto) {
        return this.reviewService.createShipperReview(createShipperReviewDto);
    }

    @Get('food/:foodId')
    getReviewsForFood(@Param('foodId') foodId: string) {
        return this.reviewService.getReviewsForFood(foodId);
    }

    @Get('shipper/:shipperId')
    getReviewsForShipper(@Param('shipperId') shipperId: string) {
        return this.reviewService.getReviewsForShipper(shipperId);
    }

    @Put(':id')
    updateReview(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
        return this.reviewService.updateReview(id, updateReviewDto.comment, updateReviewDto.rating);
    }

    @Delete(':id')
    deleteReview(@Param('id') id: string) {
        return this.reviewService.deleteReview(id);
    }
}
