import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class CreateOrderDetailDto {
    @IsUUID()
    orderId: string;

    @IsUUID()
    foodId: string;

    @IsOptional()
    @IsString()
    varity?: string;
}