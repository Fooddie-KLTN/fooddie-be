import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDetailDto } from './create-orderDetail.dto';

export class UpdateOrderDetailDto extends PartialType(CreateOrderDetailDto) {}
