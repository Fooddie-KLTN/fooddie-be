import { IsString, IsUUID } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    street: string;

    @IsString()
    city: string;

    @IsUUID()
    userId: string;
}
