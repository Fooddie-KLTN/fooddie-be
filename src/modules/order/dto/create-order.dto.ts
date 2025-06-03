import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested } from "class-validator";

export class CreateOrderDetailDto {
  @IsNotEmpty()
  @IsString()
  foodId: string;

  @IsNotEmpty()
  @IsString()
  quantity: string;

  @IsNotEmpty()
  @IsString()
  price: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateOrderDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  restaurantId: string;

  @IsUUID()
  addressId: string;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailDto)
  orderDetails: CreateOrderDetailDto[];
}