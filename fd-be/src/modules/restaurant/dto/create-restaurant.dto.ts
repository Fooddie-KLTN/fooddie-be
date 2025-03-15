import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RestaurantStatus } from 'src/entities/restaurant.entity';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  backgroundImage?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  openTime?: string;

  @IsString()
  @IsOptional()
  closeTime?: string;

  @IsString()
  @IsOptional()
  licenseCode?: string;

  @IsString()
  @IsOptional()
  certificateImage?: string;

  @IsEnum(RestaurantStatus)
  @IsOptional()
  status?: RestaurantStatus;

  @IsString()
  @IsNotEmpty()
  ownerId: string;
}