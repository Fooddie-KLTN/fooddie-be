import { IsNotEmpty, IsOptional, IsString, IsNumberString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateToppingDto } from './create-topping.dto';

export class CreateFoodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumberString()
  @IsNotEmpty()
  price: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @IsNumberString()
  @IsOptional()
  discountPercent?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumberString()
  @IsOptional()
  purchasedNumber?: string;

  @IsString()
  @IsNotEmpty()
  restaurantId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  preparationTime?: string;

  @IsString()
  @IsOptional()
  tag?: string;

  // Add toppings support
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateToppingDto)
  toppings?: CreateToppingDto[];
}