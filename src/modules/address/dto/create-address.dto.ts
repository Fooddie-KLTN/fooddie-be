import { IsString, IsUUID, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateAddressDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsString()
    street: string;

    @IsOptional()
    @IsString()
    ward?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsString()
    city: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;

    @IsOptional()
    @IsString()
    label?: string;

    @IsUUID()
    @IsOptional()
    userId: string;
}