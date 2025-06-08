import { IsString, IsNumber, IsOptional, IsDateString, IsInt, Min, IsEnum, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionType } from 'src/entities/promotion.entity';

export class CreatePromotionDto {
    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(PromotionType)
    type: PromotionType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @ValidateIf(o => o.discountAmount === undefined || o.discountAmount === null)
    discountPercent?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @ValidateIf(o => o.discountPercent === undefined || o.discountPercent === null)
    discountAmount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minOrderValue?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxDiscountAmount?: number;

    @IsString()
    code: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    maxUsage?: number;
}
