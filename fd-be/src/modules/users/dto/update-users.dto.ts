/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-users.dto';
import { Type } from 'class-transformer';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { CreateAddressDto } from 'src/modules/address/dto/create-address.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  addresses?: CreateAddressDto[];
}
