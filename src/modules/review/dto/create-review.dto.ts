import { IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateFoodReviewDto {


    @IsUUID()
    foodId: string;

    @IsString()
    comment: string;

    @IsString()
    image: string;

    @IsNumber()
    rating: number;
}


export class CreateShipperReviewDto {


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
