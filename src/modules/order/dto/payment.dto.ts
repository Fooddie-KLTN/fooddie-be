import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class PaymentDto {
    @IsNotEmpty()
    @IsString()
    @IsIn(['credit_card', 'paypal', 'cash'])
    method: string;
    
    @IsOptional()
    @IsString()
    cardNumber?: string;
    
    @IsOptional()
    @IsString()
    expiryDate?: string;
    
    @IsOptional()
    @IsString()
    cvv?: string;
    
    @IsOptional()
    @IsString()
    paypalToken?: string;
}