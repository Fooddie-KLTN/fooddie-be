import { IsNotEmpty, IsOptional, IsString, IsNumberString, IsArray } from 'class-validator';

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
}