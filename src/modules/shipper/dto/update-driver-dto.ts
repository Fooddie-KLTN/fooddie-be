// dto/update-driver.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateDriverProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cccd?: string;

  @IsOptional()
  @IsString()
  driverLicense?: string;

  @IsOptional()
  birthday?: string;
}
