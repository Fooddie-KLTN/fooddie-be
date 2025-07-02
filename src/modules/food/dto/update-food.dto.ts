import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodDto } from './create-food.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateToppingDto } from './create-topping.dto';

export class UpdateFoodDto extends PartialType(CreateFoodDto) {
    // Override toppings to make it optional for updates
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateToppingDto)
    toppings?: CreateToppingDto[];
}