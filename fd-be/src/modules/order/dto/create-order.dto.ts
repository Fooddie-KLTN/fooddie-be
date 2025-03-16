import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsUUID, IsString, IsOptional, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateOrderDetailDto {
  @IsNotEmpty()
  @IsString()
  foodId: string;

  @IsNotEmpty()
  @IsString()
  quantity: string;

  @IsNotEmpty()
  @IsString()
  price: string;

  @IsOptional()
  @IsString()
  note?: string;
}
export class CreateOrderDto {
    @IsUUID()
    userId: string;

    @IsUUID()
    restaurantId: string;

    @IsUUID()
    addressId: string;

    @IsOptional()
    @IsUUID()
    promotionId?: string;

    @IsOptional()
    @IsString()
    total?: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    date?: string;
    
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderDetailDto)
    orderDetails: CreateOrderDetailDto[];
}

