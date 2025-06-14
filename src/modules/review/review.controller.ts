import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateFoodReviewDto, CreateShipperReviewDto, UpdateReviewDto } from './dto/create-review.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('reviews')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) {}

    @Post('food')
    @UseGuards(AuthGuard)
    createFoodReview(@Body() createFoodReviewDto: CreateFoodReviewDto, @Req() req: any) {
        const userId = req.user.id || req.user.userId; // Lấy userId từ request
        return this.reviewService.createFoodReview(createFoodReviewDto, userId);
    }

    @Post('shipper')
    @UseGuards(AuthGuard)
    createShipperReview(@Body() createShipperReviewDto: CreateShipperReviewDto, @Req() req: any) {
        const userId = req.user.id || req.user.UID; 
        return this.reviewService.createShipperReview(createShipperReviewDto, userId);
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
