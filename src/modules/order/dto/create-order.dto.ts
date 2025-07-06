import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested, Min, Max } from "class-validator";

export class SelectedToppingDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;
}

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

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedToppingDto)
  selectedToppings?: SelectedToppingDto[];
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

  @IsOptional()
  @IsString()
  promotionCode?: string; // Add promotion code field

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(1440) // Delivery time in minutes (30to 1440 minutes, which is 24 hours)
  requestedDeliveryTime?: number = 30; // Add delivery time selection

  @IsOptional()
  @IsString()
  deliveryType?: 'asap' | 'scheduled' = 'asap'; // Add delivery type selection

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailDto)
  orderDetails: CreateOrderDetailDto[];
}