import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsUUID, IsString, IsOptional } from 'class-validator';

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
}

