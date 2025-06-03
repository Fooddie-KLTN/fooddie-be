import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RestaurantStatus } from 'src/entities/restaurant.entity';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  backgroundImage?: string;

  // Full address string (when provided as a single value)
  @IsString()
  @IsOptional()
  address?: string;

  // Individual address components (when provided separately)
  @IsString()
  @IsOptional()
  addressStreet?: string;

  @IsString()
  @IsOptional()
  addressWard?: string;

  @IsString()
  @IsOptional()
  addressDistrict?: string;

  @IsString()
  @IsOptional()
  addressCity?: string;

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

  @IsString()
  @IsOptional()
  latitude?: string;

  @IsString()
  @IsOptional()
  longitude?: string;
}