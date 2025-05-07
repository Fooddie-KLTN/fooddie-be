import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { DefaultRole } from '../../../entities/role.entity';

export class CreateRoleDto {


  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsOptional()
  description?: string;
}
