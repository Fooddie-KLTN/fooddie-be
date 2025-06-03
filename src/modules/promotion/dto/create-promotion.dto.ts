import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePromotionDto {
    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    discountPercent: number;

    @IsString()
    code: string;
}
