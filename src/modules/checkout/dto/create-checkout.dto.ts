import {
  IsUUID,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { CheckoutStatus } from 'src/entities/checkout.entity';

export class CreateCheckoutDto {
  @IsUUID()
  foodId: string;

  @IsNumber()
  amount: number;

  @IsString()
  paymentMethod: string;

  @IsEnum(CheckoutStatus)
  @IsOptional()
  status?: CheckoutStatus;

  @IsString()
  @IsOptional()
  paymentIntentId?: string;

  @IsOptional()
  paymentDetails?: Record<string, any>;
}
