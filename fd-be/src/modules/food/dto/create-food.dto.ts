import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID, IsNumberString } from 'class-validator';

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
}