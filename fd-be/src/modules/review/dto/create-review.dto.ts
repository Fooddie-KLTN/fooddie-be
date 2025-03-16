import { IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateFoodReviewDto {
    @IsString()
    userId: string;

    @IsUUID()
    foodId: string;

    @IsString()
    comment: string;

    @IsNumber()
    rating: number;
}


export class CreateShipperReviewDto {
    @IsString()
    userId: string;

    @IsString()
    shipperId: string;

    @IsString()
    comment: string;

    @IsNumber()
    rating: number;
}

export class UpdateReviewDto {
    @IsString()
    comment: string;

    @IsNumber()
    rating: number;
}
